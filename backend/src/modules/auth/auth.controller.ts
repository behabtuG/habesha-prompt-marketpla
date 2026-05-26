import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Headers,
  Param,
  HttpCode,
  UseGuards,
  Request,
  UnauthorizedException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { MediaService } from '../media/media.service';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  UpdateProfileDto,
  ChangePasswordDto,
  GoogleLoginDto,
} from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly mediaService: MediaService,
  ) {}

  // ── Telegram Mini App ────────────────────────────────────────────────────

  /**
   * POST /api/auth/telegram
   * Called by the Mini App with Telegram WebApp.initData in the header.
   */
  @Post('telegram')
  @HttpCode(200)
  async telegramAuth(@Headers('x-telegram-init-data') initData: string) {
    if (!initData) {
      throw new UnauthorizedException('Telegram init data is required');
    }
    const user = await this.authService.validateTelegramInitData(initData);
    return this.authService.login(user);
  }

  // ── Web Email Auth ────────────────────────────────────────────────────────

  /**
   * POST /api/auth/register
   * Register a new user with email + password.
   */
  @Post('register')
  @HttpCode(201)
  async register(@Body() dto: RegisterDto) {
    return this.authService.registerWithEmail(dto);
  }

  /**
   * POST /api/auth/login
   * Log in with email + password.
   */
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto) {
    return this.authService.loginWithEmail(dto);
  }

  /**
   * POST /api/auth/google
   * Authenticate with Google ID Token.
   */
  @Post('google')
  @HttpCode(200)
  async googleAuth(@Body() dto: GoogleLoginDto) {
    return this.authService.loginWithGoogle(dto.idToken);
  }

  /**
   * GET /api/auth/verify-email/:token
   * Confirm email address from the link sent in the registration email.
   */
  @Get('verify-email/:token')
  async verifyEmail(@Param('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  /**
   * POST /api/auth/forgot-password
   * Request a password reset email.
   */
  @Post('forgot-password')
  @HttpCode(200)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  /**
   * POST /api/auth/reset-password
   * Reset password using the token from the reset email.
   */
  @Post('reset-password')
  @HttpCode(200)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  // ── Account Linking ───────────────────────────────────────────────────────

  /**
   * POST /api/auth/link/generate-token
   * (Authenticated) Generate a link token so the user can connect their
   * Telegram account via the bot deep-link.
   * Returns: { linkToken, botUrl }
   */
  @UseGuards(JwtAuthGuard)
  @Post('link/generate-token')
  @HttpCode(200)
  async generateLinkToken(@Request() req) {
    return this.authService.generateLinkToken(req.user.userId);
  }

  /**
   * POST /api/auth/link/telegram-initdata
   * (Authenticated) Directly link Telegram when the user is inside the
   * Mini App and already has a JWT (e.g., logged in via email first).
   * Body: { initData: string }
   */
  @UseGuards(JwtAuthGuard)
  @Post('link/telegram-initdata')
  @HttpCode(200)
  async linkTelegramWithInitData(
    @Request() req,
    @Body('initData') initData: string,
  ) {
    if (!initData) throw new UnauthorizedException('initData is required');
    return this.authService.linkTelegramWithInitData(req.user.userId, initData);
  }

  /**
   * POST /api/auth/link/bot-callback
   * Called by the Telegram bot (NOT the browser) when it receives
   * /start link_<token>. The bot sends the token + Telegram user data.
   * Protected by a shared bot secret.
   */
  @Post('link/bot-callback')
  @HttpCode(200)
  async botLinkCallback(
    @Headers('x-bot-secret') botSecret: string,
    @Body('linkToken') linkToken: string,
    @Body('telegramUser') telegramUser: any,
  ) {
    const expected = process.env.BOT_INTERNAL_SECRET;
    if (!expected || botSecret !== expected) {
      throw new UnauthorizedException('Invalid bot secret');
    }
    if (!linkToken || !telegramUser?.id) {
      throw new UnauthorizedException('linkToken and telegramUser required');
    }
    const updated = await this.authService.linkTelegramViaToken(linkToken, telegramUser);
    return { success: true, userId: updated.id };
  }

  // ── Profile ───────────────────────────────────────────────────────────────

  /**
   * GET /api/auth/profile
   * Return the current authenticated user with fresh details.
   */
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    const user = await this.authService.getUserById(req.user.userId);
    return { success: true, data: user };
  }

  /**
   * PUT /api/auth/profile
   * Update the user profile (first name, last name, username, email).
   */
  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateProfile(@Request() req, @Body() dto: UpdateProfileDto) {
    const user = await this.authService.updateProfile(req.user.userId, dto);
    return { success: true, data: user };
  }

  /**
   * POST /api/auth/change-password
   * Change user password securely.
   */
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(200)
  async changePassword(@Request() req, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.userId, dto);
  }

  /**
   * POST /api/auth/recharge
   * Recharge balance stars for the user.
   */
  @UseGuards(JwtAuthGuard)
  @Post('recharge')
  @HttpCode(200)
  async rechargeStars(@Request() req, @Body('amount') amount: number) {
    return this.authService.rechargeStars(req.user.userId, amount);
  }

  /**
   * PUT /api/auth/profile/avatar
   * Upload and update user profile avatar.
   */
  @UseGuards(JwtAuthGuard)
  @Put('profile/avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new UnauthorizedException('No file provided');
    }
    const uploadResult = await this.mediaService.uploadFile(file, 'profile');
    const updatedUser = await this.authService.updateProfile(req.user.userId, {
      avatarUrl: uploadResult.url,
    });
    return { success: true, data: updatedUser };
  }
}
