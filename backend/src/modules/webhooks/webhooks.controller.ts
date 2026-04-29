// modules/webhooks/webhooks.controller.ts
import { Controller, Post, Body, Headers } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('telegram/stars')
  async handleStarsWebhook(@Body() body: any) {
    return this.webhooksService.handleStarsPayment(body);
  }

  @Post('telegram/bot')
  async handleBotWebhook(@Body() body: any) {
    return this.webhooksService.handleBotUpdate(body);
  }
}
