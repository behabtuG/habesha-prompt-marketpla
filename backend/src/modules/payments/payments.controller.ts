// src/modules/payments/payments.controller.ts
import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Get,
  Put,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { multerConfig } from '../../config/multer.config';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('purchase')
  async initiatePurchase(
    @Body() body: { promptId: string; paymentMethod: string; metadata?: any },
    @Request() req,
  ) {
    return this.paymentsService.initiatePurchase(
      req.user.sub,
      body.promptId,
      body.paymentMethod,
      body.metadata,
    );
  }

  @Post('verify/:purchaseId')
  async verifyPayment(
    @Param('purchaseId') purchaseId: string,
    @Body() body: { paymentId: string; metadata?: any },
  ) {
    if (!body.paymentId) {
      throw new BadRequestException('paymentId is required');
    }
    return this.paymentsService.verifyPayment(
      purchaseId,
      body.paymentId,
      body.metadata,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('purchases')
  async getUserPurchases(@Request() req) {
    return this.paymentsService.getUserPurchases(req.user.sub);
  }

  @Get('status/:purchaseId')
  async getPurchaseStatus(@Param('purchaseId') purchaseId: string) {
    return this.paymentsService.getPurchaseStatus(purchaseId);
  }

  // Add the TON status endpoint
  @UseGuards(JwtAuthGuard)
  @Get('ton/status/:purchaseId')
  async checkTonPaymentStatus(
    @Param('purchaseId') purchaseId: string,
    @Request() req,
  ) {
    // This will call the method from PaymentsService
    return this.paymentsService.checkTonPaymentStatus(purchaseId, req.user.sub);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put('refund/:purchaseId')
  async refundPurchase(
    @Param('purchaseId') purchaseId: string,
    @Request() req,
  ) {
    return this.paymentsService.refundPurchase(purchaseId, req.user.sub);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin/revenue')
  async getAdminRevenueStats() {
    return this.paymentsService.getAdminRevenueStats();
  }

  @UseGuards(JwtAuthGuard)
  @Get('check-access/:promptId')
  async checkPromptAccess(@Param('promptId') promptId: string, @Request() req) {
    return this.paymentsService.checkPromptAccess(req.user.sub, promptId);
  }

  // Webhook endpoints for payment providers
  @Post('webhook/telegram')
  async telegramWebhook(@Body() update: any) {
    if (update.pre_checkout_query) {
      return { ok: true };
    }

    if (update.message?.successful_payment) {
      const purchaseId =
        update.message.successful_payment.invoice_payload.replace('stars_', '');
      await this.paymentsService.verifyPayment(
        purchaseId,
        update.message.successful_payment.telegram_payment_charge_id,
      );
    }
    return { ok: true };
  }

  // Add TON webhook endpoint
  @Post('webhook/ton')
  async tonWebhook(@Body() body: any) {
    const { purchaseId, transactionHash, amount, fromAddress } = body;

    if (!purchaseId || !transactionHash) {
      throw new BadRequestException('Missing required fields');
    }

    return this.paymentsService.verifyPayment(
      purchaseId,
      `TON_${transactionHash}`,
      {
        tonTransactionHash: transactionHash,
        fromAddress,
        verifiedVia: 'ton_webhook',
        verifiedAt: new Date().toISOString(),
      },
    );
  }

  @Post('webhook/chapa')
  async chapaWebhook(@Body() body: any) {
    if (body.event === 'charge.success') {
      const purchaseId = body.tx_ref;
      await this.paymentsService.verifyPayment(purchaseId, body.id, {
        chapaReference: body.reference,
      });
    }
    return { ok: true };
  }

  /* ===============================
     LOCAL PAYMENT INITIATION
  =============================== */
  @UseGuards(JwtAuthGuard)
  @Post('local/initiate')
  async initiateLocalPayment(
    @Body() body: { promptId: string },
    @Request() req,
  ) {
    return this.paymentsService.initiateLocalPayment(
      req.user.sub,
      body.promptId,
    );
  }

  /* ===============================
     UPLOAD PAYMENT RECEIPT
  =============================== */
  @UseGuards(JwtAuthGuard)
  @Post('local/upload')
  @UseInterceptors(FileInterceptor('receipt', multerConfig))
  async uploadPaymentReceipt(
    @Body()
    body: {
      purchaseId: string;
      bankName: string;
      accountNumber: string;
      referenceNumber: string;
      notes?: string;
    },
    @UploadedFile() receiptFile: Express.Multer.File,
    @Request() req,
  ) {
    if (!receiptFile) {
      throw new BadRequestException('Receipt file is required');
    }

    return this.paymentsService.uploadPaymentReceipt(
      body.purchaseId,
      body.bankName,
      body.accountNumber,
      body.referenceNumber,
      body.notes || '',
      receiptFile,
    );
  }

  /* ===============================
   ADMIN: GET PENDING MANUAL PAYMENTS
  =============================== */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin/pending-manual')
  async getPendingManualPayments(@Request() req) {
    return this.paymentsService.getPendingManualPayments(req.user.sub);
  }

  /* ===============================
   ADMIN: VERIFY MANUAL PAYMENT
  =============================== */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put('admin/verify-manual/:purchaseId')
  async verifyManualPayment(
    @Param('purchaseId') purchaseId: string,
    @Body() body: { notes?: string },
    @Request() req,
  ) {
    if (!purchaseId) {
      throw new BadRequestException('Purchase ID is required');
    }

    return this.paymentsService.verifyManualPayment(
      purchaseId,
      req.user.sub,
      body.notes,
    );
  }

  /* ===============================
   ADMIN: REJECT MANUAL PAYMENT
  =============================== */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put('admin/reject-manual/:purchaseId')
  async rejectManualPayment(
    @Param('purchaseId') purchaseId: string,
    @Body() body: { reason: string },
    @Request() req,
  ) {
    if (!purchaseId) {
      throw new BadRequestException('Purchase ID is required');
    }

    if (!body.reason || body.reason.trim() === '') {
      throw new BadRequestException('Rejection reason is required');
    }

    return this.paymentsService.rejectManualPayment(
      purchaseId,
      req.user.sub,
      body.reason,
    );
  }
}
