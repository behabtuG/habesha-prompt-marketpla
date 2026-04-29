// modules/auth/auth.service.ts
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';
import * as qs from 'querystring';

interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  [key: string]: any;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async validateTelegramInitData(initData: string) {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

    if (!BOT_TOKEN) {
      this.logger.error('TELEGRAM_BOT_TOKEN is not configured');
      throw new Error('Telegram bot token not configured');
    }

    try {
      const parsed = qs.parse(initData);
      const hash = parsed.hash as string;

      // Production: Full validation
      // Production: Full validation
      if (!hash) {
        throw new UnauthorizedException('Missing hash in initData');
      }

      // Check for auth_date to prevent replay attacks
      if (parsed.auth_date) {
        const authDate = parseInt(parsed.auth_date as string, 10);
        const now = Math.floor(Date.now() / 1000);
        const difference = now - authDate;

        if (difference > 86400) {
          // 24 hours
          this.logger.warn('Expired Telegram initData detected', {
            authDate,
            now,
            difference,
          });
          throw new UnauthorizedException('Authentication data expired');
        }
      }

      const dataCheckString = Object.keys(parsed)
        .filter((key) => key !== 'hash')
        .sort()
        .map((key) => `${key}=${parsed[key]}`)
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
        this.logger.warn('Invalid hash detected', {
          computedHash,
          receivedHash: hash,
        });
        throw new UnauthorizedException('Invalid Telegram authentication');
      }

      const userData: TelegramUser = JSON.parse(parsed.user as string);
      return await this.findOrCreateUser(userData);
    } catch (error) {
      this.logger.error('Telegram auth validation failed', error);
      throw new UnauthorizedException('Invalid Telegram authentication data');
    }
  }

  private async findOrCreateUser(telegramUser: TelegramUser) {
    try {
      const telegramId = BigInt(telegramUser.id);

      const firstName = telegramUser.last_name
        ? `${telegramUser.first_name || ''} ${telegramUser.last_name}`.trim()
        : telegramUser.first_name || null;

      const telegramData = {
        id: telegramUser.id,
        first_name: telegramUser.first_name || null,
        last_name: telegramUser.last_name || null,
        username: telegramUser.username || null,
        language_code: telegramUser.language_code || null,
        is_premium: telegramUser.is_premium || false,
      };

      return await this.prisma.user.upsert({
        where: { telegramId },
        update: {
          telegramData,
          firstName,
          username: telegramUser.username || null,
        },
        create: {
          telegramId,
          telegramData,
          firstName,
          username: telegramUser.username || null,
        },
      });
    } catch (error) {
      this.logger.error('Failed to find or create user', error);
      throw error;
    }
  }

  async login(user: any) {
    const payload = {
      sub: user.id,
      telegramId: user.telegramId.toString(),
      username: user.username,
      firstName: user.firstName,
      isAdmin: user.isAdmin || false,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      access_token: accessToken,
      user: {
        id: user.id,
        telegramId: user.telegramId.toString(),
        username: user.username,
        firstName: user.firstName,
        isAdmin: user.isAdmin || false,
        balanceStars: user.balanceStars || 0,
        totalSpent: user.totalSpent || 0,
      },
    };
  }
}
