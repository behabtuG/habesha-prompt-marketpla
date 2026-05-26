// modules/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';
import * as qs from 'querystring';
import * as bcrypt from 'bcrypt';
import axios from 'axios';
import {
  RegisterDto,
  LoginDto,
  UpdateProfileDto,
  ChangePasswordDto,
  GoogleLoginDto,
} from './dto/register.dto';

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  [key: string]: any;
}

// ─── Auth Service ─────────────────────────────────────────────────────────────

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly BCRYPT_ROUNDS = 12;
  private readonly AUTH_DATA_MAX_AGE_SECONDS = 86400; // 24 h

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // ══════════════════════════════════════════════════════════════════════════
  // TELEGRAM AUTH (Mini App)
  // ══════════════════════════════════════════════════════════════════════════

  /** Validate Telegram WebApp initData and return a JWT */
  async validateTelegramInitData(initData: string) {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    if (!BOT_TOKEN) throw new Error('Telegram bot token not configured');

    try {
      const parsed = qs.parse(initData);
      const hash = parsed.hash as string;

      if (!hash) throw new UnauthorizedException('Missing hash in initData');

      // Replay-attack protection
      if (parsed.auth_date) {
        const authDate = parseInt(parsed.auth_date as string, 10);
        const diff = Math.floor(Date.now() / 1000) - authDate;
        if (diff > this.AUTH_DATA_MAX_AGE_SECONDS) {
          throw new UnauthorizedException('Authentication data expired');
        }
      }

      // HMAC verification
      const dataCheckString = Object.keys(parsed)
        .filter((k) => k !== 'hash')
        .sort()
        .map((k) => `${k}=${parsed[k]}`)
        .join('\n');

      const secretKey = crypto
        .createHmac('sha256', 'WebAppData')
        .update(BOT_TOKEN)
        .digest();

      const computedHash = crypto
        .createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');

      if (computedHash !== hash) {
        throw new UnauthorizedException('Invalid Telegram authentication');
      }

      const telegramUser: TelegramUser = JSON.parse(parsed.user as string);
      return this.syncTelegramUser(telegramUser);
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      this.logger.error('Telegram auth validation failed', error);
      throw new UnauthorizedException('Invalid Telegram authentication data');
    }
  }

  /**
   * Upsert a user from Telegram data.
   * If an account with the same email already exists (edge-case: unlikely
   * unless admin pre-created), we link the Telegram ID to it.
   */
  private async syncTelegramUser(telegramUser: TelegramUser) {
    const telegramId = BigInt(telegramUser.id);

    const telegramData = {
      id: telegramUser.id,
      first_name: telegramUser.first_name || null,
      last_name: telegramUser.last_name || null,
      username: telegramUser.username || null,
      language_code: telegramUser.language_code || null,
      is_premium: telegramUser.is_premium || false,
    };

    // Try to find existing Telegram user
    const existing = await this.prisma.user.findUnique({
      where: { telegramId },
    });

    if (existing) {
      // Update Telegram data on every login (name/username can change)
      return this.prisma.user.update({
        where: { telegramId },
        data: {
          telegramData,
          firstName: telegramUser.first_name ?? existing.firstName,
          lastName: telegramUser.last_name ?? existing.lastName,
          username: telegramUser.username ?? existing.username,
          authProvider: existing.email ? 'BOTH' : 'TELEGRAM',
        },
      });
    }

    // New Telegram user — create account
    return this.prisma.user.create({
      data: {
        telegramId,
        telegramData,
        firstName: telegramUser.first_name || null,
        lastName: telegramUser.last_name || null,
        username: telegramUser.username || null,
        authProvider: 'TELEGRAM',
      },
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // WEB AUTH (Email + Password)
  // ══════════════════════════════════════════════════════════════════════════

  /** Register a new user via email */
  async registerWithEmail(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, this.BCRYPT_ROUNDS);
    const emailVerifyToken = crypto.randomBytes(32).toString('hex');

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        emailVerifyToken,
        emailVerified: false,
        firstName: dto.firstName ?? null,
        lastName: dto.lastName ?? null,
        authProvider: 'EMAIL',
        // telegramId is intentionally left null
      },
    });

    this.logger.log(`New web user registered: ${email}`);

    // TODO: send verification email
    // await this.mailService.sendVerificationEmail(email, emailVerifyToken);

    return this.buildLoginResponse(user);
  }

  /** Log in with email + password */
  async loginWithEmail(dto: LoginDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.buildLoginResponse(user);
  }

  /** Log in or Register with Google ID Token */
  async loginWithGoogle(idToken: string) {
    try {
      // 1. Verify Google token via Google OAuth2 api
      const response = await axios.get(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`,
      );
      const payload = response.data;

      if (!payload.email) {
        throw new BadRequestException('Google ID token does not contain email');
      }

      const googleId = payload.sub;
      const email = payload.email.toLowerCase().trim();
      const firstName = payload.given_name || null;
      const lastName = payload.family_name || null;
      const avatarUrl = payload.picture || null;

      // Check if user with this googleId already exists
      let user = await this.prisma.user.findUnique({
        where: { googleId },
      });

      if (user) {
        // Update avatarUrl if not already set, or sync details
        if (!user.avatarUrl && avatarUrl) {
          user = await this.prisma.user.update({
            where: { googleId },
            data: { avatarUrl },
          });
        }
        return this.buildLoginResponse(user);
      }

      // Check if a user with this email already exists
      user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (user) {
        // Link Google ID to existing account
        user = await this.prisma.user.update({
          where: { email },
          data: {
            googleId,
            firstName: user.firstName ?? firstName,
            lastName: user.lastName ?? lastName,
            avatarUrl: user.avatarUrl ?? avatarUrl,
            authProvider: 'BOTH',
          },
        });
        return this.buildLoginResponse(user);
      }

      // Create new user authenticated with Google
      user = await this.prisma.user.create({
        data: {
          email,
          googleId,
          firstName,
          lastName,
          avatarUrl,
          emailVerified: true, // Google email is verified
          authProvider: 'GOOGLE',
        },
      });

      this.logger.log(`New user registered via Google: ${email}`);
      return this.buildLoginResponse(user);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error('Google auth validation failed', error);
      throw new UnauthorizedException('Invalid Google authentication token');
    }
  }

  /** Verify email address from token */
  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: { emailVerifyToken: token },
    });

    if (!user) throw new BadRequestException('Invalid or expired verification token');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, emailVerifyToken: null },
    });

    return { success: true, message: 'Email verified successfully' };
  }

  /** Initiate password reset — generates a token (email sending is TODO) */
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return 200 to avoid user enumeration
    if (!user || !user.email) {
      return { success: true, message: 'If that email exists, a reset link has been sent' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3_600_000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: resetToken, passwordResetExpiry: expiry },
    });

    // TODO: await this.mailService.sendPasswordResetEmail(email, resetToken);
    this.logger.log(`Password reset requested for: ${email}`);

    return { success: true, message: 'If that email exists, a reset link has been sent' };
  }

  /** Reset password using token */
  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpiry: { gt: new Date() },
      },
    });

    if (!user) throw new BadRequestException('Invalid or expired reset token');

    const passwordHash = await bcrypt.hash(newPassword, this.BCRYPT_ROUNDS);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiry: null,
      },
    });

    return { success: true, message: 'Password updated successfully' };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ACCOUNT LINKING (Telegram ↔ Web)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Generate a short-lived link token for the logged-in web user.
   * They share it with the bot (via deep-link) to link their Telegram account.
   */
  async generateLinkToken(userId: string): Promise<{ linkToken: string; botUrl: string }> {
    const linkToken = crypto.randomBytes(20).toString('hex');

    await this.prisma.user.update({
      where: { id: userId },
      data: { linkToken },
    });

    const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'YourBot';
    return {
      linkToken,
      botUrl: `https://t.me/${botUsername}?start=link_${linkToken}`,
    };
  }

  /**
   * Called by the Telegram bot when a user sends /start link_<token>.
   * Links the Telegram account to the existing web account.
   */
  async linkTelegramViaToken(linkToken: string, telegramUser: TelegramUser) {
    const webUser = await this.prisma.user.findUnique({ where: { linkToken } });

    if (!webUser) {
      throw new NotFoundException('Link token not found or already used');
    }

    const telegramId = BigInt(telegramUser.id);

    // Check the Telegram ID isn't already on another account
    const existingTgUser = await this.prisma.user.findUnique({
      where: { telegramId },
    });

    if (existingTgUser && existingTgUser.id !== webUser.id) {
      throw new ConflictException(
        'This Telegram account is already linked to a different user',
      );
    }

    // If Telegram had a separate account, we merge balances and delete it
    if (existingTgUser && existingTgUser.id !== webUser.id) {
      // Transfer balance from old Telegram account
      await this.prisma.user.update({
        where: { id: webUser.id },
        data: {
          balanceStars: { increment: existingTgUser.balanceStars },
        },
      });
    }

    const telegramData = {
      id: telegramUser.id,
      first_name: telegramUser.first_name || null,
      last_name: telegramUser.last_name || null,
      username: telegramUser.username || null,
      language_code: telegramUser.language_code || null,
      is_premium: telegramUser.is_premium || false,
    };

    const updated = await this.prisma.user.update({
      where: { id: webUser.id },
      data: {
        telegramId,
        telegramData,
        username: telegramUser.username ?? webUser.username,
        authProvider: 'BOTH',
        linkToken: null, // consume token — one-time use
      },
    });

    this.logger.log(
      `Linked Telegram ${telegramUser.id} → web account ${webUser.id}`,
    );

    return updated;
  }

  /**
   * Called when a logged-in web user submits Telegram initData directly
   * (e.g., they opened the Mini App while already logged in via email).
   */
  async linkTelegramWithInitData(userId: string, initData: string) {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    if (!BOT_TOKEN) throw new Error('Bot token not configured');

    const parsed = qs.parse(initData);
    const hash = parsed.hash as string;
    if (!hash) throw new UnauthorizedException('Missing hash');

    const dataCheckString = Object.keys(parsed)
      .filter((k) => k !== 'hash')
      .sort()
      .map((k) => `${k}=${parsed[k]}`)
      .join('\n');

    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(BOT_TOKEN)
      .digest();

    const computedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (computedHash !== hash) throw new UnauthorizedException('Invalid initData');

    const telegramUser: TelegramUser = JSON.parse(parsed.user as string);

    return this.linkTelegramViaToken(
      // reuse the token-based linker but generate a one-use token transparently
      await this._getOrCreateLinkToken(userId),
      telegramUser,
    );
  }

  private async _getOrCreateLinkToken(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.linkToken) return user.linkToken;

    const token = crypto.randomBytes(20).toString('hex');
    await this.prisma.user.update({ where: { id: userId }, data: { linkToken: token } });
    return token;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // JWT HELPERS
  // ══════════════════════════════════════════════════════════════════════════

  /** Build the standard JWT login response */
  buildLoginResponse(user: any) {
    const payload = {
      sub: user.id,
      telegramId: user.telegramId ? user.telegramId.toString() : null,
      email: user.email ?? null,
      username: user.username,
      firstName: user.firstName,
      isAdmin: user.isAdmin || false,
      authProvider: user.authProvider,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      access_token: accessToken,
      user: {
        id: user.id,
        telegramId: user.telegramId ? user.telegramId.toString() : null,
        email: user.email ?? null,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName ?? null,
        avatarUrl: user.avatarUrl ?? null,
        isAdmin: user.isAdmin || false,
        authProvider: user.authProvider,
        emailVerified: user.emailVerified,
        balanceStars: user.balanceStars || 0,
        totalSpent: user.totalSpent || 0,
        hasTelegram: !!user.telegramId,
        hasEmail: !!user.email,
      },
    };
  }

  /** Keep old `login()` name for backward compat (used by controller) */
  async login(user: any) {
    return this.buildLoginResponse(user);
  }

  /** Get user profile from database with fresh details */
  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      id: user.id,
      telegramId: user.telegramId ? user.telegramId.toString() : null,
      email: user.email ?? null,
      username: user.username ?? null,
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
      avatarUrl: user.avatarUrl ?? null,
      isAdmin: user.isAdmin || false,
      authProvider: user.authProvider,
      emailVerified: user.emailVerified,
      balanceStars: user.balanceStars || 0,
      totalSpent: user.totalSpent || 0,
      hasTelegram: !!user.telegramId,
      hasEmail: !!user.email,
    };
  }

  /** Update user profile in the database */
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const updateData: any = {};
    if (dto.firstName !== undefined) updateData.firstName = dto.firstName;
    if (dto.lastName !== undefined) updateData.lastName = dto.lastName;
    if (dto.avatarUrl !== undefined) updateData.avatarUrl = dto.avatarUrl;
    if (dto.username !== undefined) {
      // Check username uniqueness if changing
      if (dto.username !== null && dto.username !== '') {
        const existing = await this.prisma.user.findFirst({
          where: {
            username: dto.username,
            id: { not: userId },
          },
        });
        if (existing) {
          throw new ConflictException('Username is already taken');
        }
      }
      updateData.username = dto.username;
    }
    if (dto.email !== undefined) {
      // Check email uniqueness if changing
      if (dto.email !== null && dto.email !== '') {
        const existing = await this.prisma.user.findFirst({
          where: {
            email: dto.email,
            id: { not: userId },
          },
        });
        if (existing) {
          throw new ConflictException('Email is already in use');
        }
      }
      updateData.email = dto.email;
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return this.getUserById(updated.id);
  }

  /** Change user password securely */
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.passwordHash) {
      throw new BadRequestException('Local password auth is not configured on this account');
    }

    const isValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, this.BCRYPT_ROUNDS);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { success: true, message: 'Password updated successfully' };
  }

  /** Recharge user balance stars */
  async rechargeStars(userId: string, amount: number) {
    if (amount <= 0) {
      throw new BadRequestException('Recharge amount must be positive');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        balanceStars: { increment: amount },
      },
    });

    return {
      success: true,
      balanceStars: updated.balanceStars,
      message: `${amount} stars credited successfully`,
    };
  }
}

