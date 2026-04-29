// src/modules/payments/providers/ton.service.ts
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class TonService {
  private readonly logger = new Logger(TonService.name);
  private readonly WALLET = process.env.TON_WALLET || '';
  private readonly API_KEY = process.env.TON_API_KEY || '';
  private readonly API_URL = process.env.TON_API_URL;

  /**
   * Verify TON payment by checking blockchain transactions
   */
  async verifyTonPayment(
    purchaseId: string,
    expectedAmount: number,
  ): Promise<boolean> {
    this.logger.log(
      `Verifying TON payment: ${purchaseId}, expected: ${expectedAmount} TON`,
    );

    if (!this.WALLET) {
      this.logger.warn('TON_WALLET not configured, skipping verification');
      return true; // Skip verification in development
    }

    try {
      // Get recent transactions for our wallet
      const response = await axios.get(`${this.API_URL}/getTransactions`, {
        params: {
          address: this.WALLET,
          limit: 20,
        },
        headers: this.API_KEY
          ? {
              'X-API-Key': this.API_KEY,
            }
          : {},
      });

      const transactions = response.data.result;

      // Look for a transaction with our purchaseId as comment
      const foundTransaction = transactions.find((tx: any) => {
        // Check if this transaction has our purchaseId in the message/comment
        const inMsg = tx.in_msg;
        if (!inMsg) return false;

        const message = inMsg.message || '';
        const value = parseFloat(inMsg.value) / 1000000000; // Convert nanoTON to TON

        // Check if message contains purchaseId and amount matches
        const matchesComment =
          message.includes(purchaseId) ||
          message === purchaseId ||
          (tx.comment && tx.comment.includes(purchaseId));

        const matchesAmount = Math.abs(value - expectedAmount) < 0.01; // Allow small rounding

        if (matchesComment && matchesAmount) {
          this.logger.log(
            `Found matching TON transaction: ${tx.transaction_id.hash}`,
          );
          return true;
        }

        return false;
      });

      return !!foundTransaction;
    } catch (error: any) {
      this.logger.error(
        `TON verification failed: ${error.message}`,
        error.stack,
      );

      // For development/testing, we can return true if API fails
      if (process.env.NODE_ENV === 'development') {
        this.logger.warn('Development mode: Assuming TON payment is valid');
        return true;
      }

      return false;
    }
  }

  /**
   * Get current TON price in USD (optional)
   */
  async getTonPrice(): Promise<number> {
    try {
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/simple/price',
        {
          params: {
            ids: 'the-open-network',
            vs_currencies: 'usd',
          },
        },
      );

      return response.data['the-open-network'].usd;
    } catch (error) {
      this.logger.error('Failed to fetch TON price', error);
      return 0;
    }
  }

  /**
   * Generate a unique comment for TON payment
   */
  generatePaymentComment(purchaseId: string): string {
    return `prompt-${purchaseId}-${Date.now().toString(36)}`;
  }

  /**
   * Format TON amount (convert to nanoTON)
   */
  formatTonAmount(tonAmount: number): number {
    return Math.round(tonAmount * 1000000000); // Convert TON to nanoTON
  }
}
