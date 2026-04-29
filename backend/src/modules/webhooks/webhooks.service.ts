// modules/webhooks/webhooks.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private readonly prisma: PrismaService) {}

  async handleStarsPayment(body: any) {
    this.logger.log('Received Telegram Stars payment webhook', body);

    try {
      // Handle pre_checkout_query
      if (body.pre_checkout_query) {
        const { id, from, invoice_payload, total_amount } =
          body.pre_checkout_query;

        // Extract purchase ID from invoice payload
        const purchaseId = invoice_payload.split('_')[1];

        if (!purchaseId) {
          return { ok: false, error: 'Invalid invoice payload' };
        }

        // Verify purchase exists and is valid
        const purchase = await this.prisma.purchase.findUnique({
          where: { id: purchaseId },
          include: { prompt: true },
        });

        if (!purchase) {
          return { ok: false, error: 'Purchase not found' };
        }

        if (purchase.status === 'COMPLETED') {
          return { ok: false, error: 'Already purchased' };
        }

        // Convert stars to amount (Telegram sends stars * 100)
        const starsAmount = total_amount / 100;

        if (starsAmount !== purchase.amountPaid) {
          return { ok: false, error: 'Amount mismatch' };
        }

        // All checks passed
        return { ok: true };
      }

      // Handle successful payment
      if (body.message?.successful_payment) {
        const { invoice_payload, total_amount } =
          body.message.successful_payment;
        const purchaseId = invoice_payload.split('_')[1];

        if (!purchaseId) {
          this.logger.error('Invalid invoice payload in successful payment');
          return { ok: false };
        }

        // Update purchase status
        await this.prisma.purchase.update({
          where: { id: purchaseId },
          data: {
            status: 'COMPLETED',
            paymentId: `telegram_stars_${Date.now()}`,
            unlockedAt: new Date(),
          },
        });

        // Increment prompt purchase count
        await this.prisma.prompt.update({
          where: { id: body.promptId }, // Note: You need to fetch promptId from purchase first
          data: { purchaseCount: { increment: 1 } },
        });

        this.logger.log(`Purchase ${purchaseId} completed via Telegram Stars`);
        return { ok: true };
      }

      return { ok: false, error: 'Unhandled webhook type' };
    } catch (error) {
      this.logger.error('Error handling stars payment webhook', error);
      return { ok: false, error: error.message };
    }
  }

  async handleBotUpdate(body: any) {
    this.logger.log('Received bot update webhook', body);

    // Forward to bot logic (in production, you might want to process here)
    // For now, just log and acknowledge
    return { ok: true, message: 'Webhook received' };
  }
}
