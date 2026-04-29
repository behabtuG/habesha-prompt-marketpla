// src/modules/payments/providers/chapa.service.ts
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class ChapaService {
  private readonly logger = new Logger(ChapaService.name);
  private readonly CHAPA_SECRET = process.env.CHAPA_SECRET || '';

  async initializePayment(purchaseId: string, amount: number, email: string) {
    this.logger.log(`Initializing Chapa payment: ${purchaseId}`);

    if (!this.CHAPA_SECRET) {
      throw new Error('CHAPA_SECRET not configured');
    }

    try {
      const res = await axios.post(
        'https://api.chapa.co/v1/transaction/initialize',
        {
          tx_ref: purchaseId,
          amount: amount.toFixed(2),
          currency: 'ETB',
          email,
          callback_url: `${process.env.API_URL || 'http://localhost:4060'}/payments/webhook/chapa`,
          return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/success/${purchaseId}`,
          customization: {
            title: 'Prompt Marketplace',
            description: 'Purchase premium AI prompt',
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.CHAPA_SECRET}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return res.data.data.checkout_url;
    } catch (error: any) {
      this.logger.error(
        'Chapa initialization failed',
        error.response?.data || error.message,
      );
      throw new Error(`Failed to initialize Chapa payment: ${error.message}`);
    }
  }
}
