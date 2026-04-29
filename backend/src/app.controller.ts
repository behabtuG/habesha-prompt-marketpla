// src/app.controller.ts
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import path from 'path';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  healthCheck() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Telegram Prompt Marketplace API',
    };
  }

  @Get('test-image')
  async testImage() {
    const baseUrl = process.env.BACKEND_URL;

    return {
      message: 'Image URL test',
      staticPath: '/uploads/prompts/',
      sampleUrl: `${baseUrl}/uploads/prompts/test-image.jpg`,
      uploadsDirectory: path.join(process.cwd(), 'uploads'),
    };
  }
}
