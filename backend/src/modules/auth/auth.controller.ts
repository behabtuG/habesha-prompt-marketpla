// modules/auth/auth.controller.ts
import {
  Controller,
  Post,
  Headers,
  HttpCode,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('telegram')
  @HttpCode(200)
  async telegramAuth(@Headers('x-telegram-init-data') initData: string) {
    console.log('🔍 Auth Controller Init Data:', initData);
    console.log('🔍 Type of Init Data:', typeof initData);

    if (!initData) {
      throw new Error('Telegram init data is required');
    }

    const user = await this.authService.validateTelegramInitData(initData);
    return this.authService.login(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    return {
      success: true,
      data: req.user,
    };
  }
}
