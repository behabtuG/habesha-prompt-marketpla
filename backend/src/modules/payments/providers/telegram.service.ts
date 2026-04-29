// src/modules/payments/providers/telegram.service.ts
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
  private readonly API = `https://api.telegram.org/bot${this.BOT_TOKEN}`;

  async createStarsInvoice(
    telegramId: number,
    purchaseId: string,
    title: string,
    description: string,
    amountStars: number,
  ) {
    this.logger.log(`Creating Telegram Stars invoice: ${purchaseId}`);

    return axios.post(`${this.API}/sendInvoice`, {
      chat_id: telegramId,
      title: title.substring(0, 32),
      description: description.substring(0, 128),
      payload: purchaseId,
      provider_token: '', // MUST be empty for Stars
      currency: 'XTR',
      prices: [
        {
          label: 'Prompt Access',
          amount: amountStars * 100,
        },
      ],
    });
  }
}
