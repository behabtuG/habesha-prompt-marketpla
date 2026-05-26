// src/modules/payments/payments.service.ts
import {
  Injectable,
  BadRequestException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../prisma/redis.service';
// import { TelegramService } from './providers/telegram.service';
import { TonService } from './providers/ton.service';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// Define payment status enum (match your Prisma schema)
export enum PurchaseStatus {
  PENDING = 'PENDING',
  WAITING_VERIFICATION = 'WAITING_VERIFICATION',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
}

// Define payment method enum
export enum PaymentMethod {
  TELEGRAM_STARS = 'TELEGRAM_STARS',
  TON = 'TON',
  LOCAL_BIRR = 'LOCAL_BIRR',
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private PLATFORM_FEE = 0.1; // 10%

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    // private telegram: TelegramService,
    private ton: TonService,
    // private chapa: ChapaService,
  ) {}

  /* ===============================
     PURCHASE INITIATION
  =============================== */
  async initiatePurchase(
    userId: string,
    promptId: string,
    paymentMethod: string,
    metadata?: any,
  ) {
    const prompt = await this.prisma.prompt.findFirst({
      where: { id: promptId, isActive: true },
    });

    if (!prompt) throw new BadRequestException('Prompt not found');

    const existing = await this.prisma.purchase.findFirst({
      where: {
        userId,
        promptId,
        status: PurchaseStatus.COMPLETED,
      },
    });

    if (existing) {
      throw new BadRequestException('Prompt already purchased');
    }

    const price = this.getPrice(prompt, paymentMethod);

    if (!price.amount || price.amount <= 0) {
      throw new BadRequestException(`Invalid price for ${paymentMethod}`);
    }

    // Create purchase with proper type
    const purchase = await this.prisma.purchase.create({
      data: {
        userId,
        promptId,
        paymentMethod: paymentMethod as any,
        amountPaid: price.amount,
        currency: price.currency,
        status: PurchaseStatus.PENDING,
        metadata: metadata
          ? { promptVersion: prompt.version, ...metadata }
          : { promptVersion: prompt.version },
      },
    });

    await this.redis.set(
      `purchase:${purchase.id}`,
      JSON.stringify({ userId, promptId }),
      1800, // 30 minutes
    );

    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    /* ===== TON ===== */
    // if (paymentMethod === PaymentMethod.TON) {
    //   return {
    //     success: true,
    //     data: {
    //       purchaseId: purchase.id,
    //       walletAddress: process.env.TON_WALLET,
    //       amount: price.amount,
    //       comment: purchase.id,
    //       currency: 'TON',
    //     },
    //   };
    // }

    /* ===== TON ===== */
    if (paymentMethod === PaymentMethod.TON) {
      const paymentComment = this.ton.generatePaymentComment(purchase.id);

      return {
        success: true,
        data: {
          purchaseId: purchase.id,
          walletAddress: process.env.TON_WALLET,
          amount: price.amount,
          comment: paymentComment, // Use generated comment
          currency: 'TON',
          network: 'TON',
          memoRequired: true,
          instructions: [
            `Send exactly ${price.amount} TON to the address above`,
            `Include this comment in your transaction: ${paymentComment}`,
            `Payment will auto-verify within 2-5 minutes`,
            `Keep this page open or check "My Purchases" for status`,
          ],
        },
      };
    }
    /* ===== LOCAL BIRR ===== */
    // In initiatePurchase method, update LOCAL_BIRR section:
    if (paymentMethod === PaymentMethod.LOCAL_BIRR) {
      return this.initiateLocalPayment(userId, promptId);
    }

    /* ===== TELEGRAM STARS ===== */
    return {
      success: true,
      data: {
        purchaseId: purchase.id,
        amount: price.amount,
        currency: price.currency,
        telegramId: user?.telegramId?.toString(),
      },
    };
  }

  /* ===============================
   CHECK TON PAYMENT STATUS
=============================== */
  async checkTonPaymentStatus(purchaseId: string, userId: string) {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: { user: true, prompt: true },
    });

    if (!purchase) {
      throw new BadRequestException('Purchase not found');
    }

    if (purchase.userId !== userId) {
      throw new ForbiddenException('Not authorized to check this payment');
    }

    if (purchase.paymentMethod !== PaymentMethod.TON) {
      throw new BadRequestException('Not a TON payment');
    }

    // If already completed, return status
    if (purchase.status === PurchaseStatus.COMPLETED) {
      return {
        success: true,
        data: {
          status: 'COMPLETED',
          message: 'Payment already verified',
          unlockedAt: purchase.unlockedAt,
        },
      };
    }

    // Check if payment is verified
    const isVerified = await this.ton.verifyTonPayment(
      purchase.id,
      purchase.amountPaid,
    );

    if (isVerified) {
      // Automatically verify the payment
      await this.verifyPayment(purchase.id, 'TON_AUTO_VERIFIED', {
        verificationMethod: 'ton_auto_check',
        verifiedAt: new Date().toISOString(),
      });

      const updatedPurchase = await this.prisma.purchase.findUnique({
        where: { id: purchaseId },
      });

      return {
        success: true,
        data: {
          status: 'COMPLETED',
          message: 'Payment verified successfully',
          unlockedAt: updatedPurchase?.unlockedAt,
        },
      };
    }

    return {
      success: true,
      data: {
        status: 'PENDING',
        message: 'Payment not yet received',
        lastChecked: new Date().toISOString(),
      },
    };
  }

  /* ===============================
     PAYMENT VERIFICATION
  =============================== */
  async verifyPayment(purchaseId: string, paymentId: string, metadata?: any) {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        prompt: {
          include: {
            creator: true,
          },
        },
        user: true,
      },
    });

    if (!purchase) throw new BadRequestException('Purchase not found');
    if (purchase.status === PurchaseStatus.COMPLETED) {
      return {
        success: true,
        message: 'Payment already verified',
        data: purchase,
      };
    }

    let verified = false;

    /* ===== TON VERIFICATION ===== */
    if (purchase.paymentMethod === PaymentMethod.TON) {
      verified = await this.ton.verifyTonPayment(
        purchaseId,
        purchase.amountPaid,
      );
      if (!verified) throw new BadRequestException('TON payment not verified');
    } else if (purchase.paymentMethod === PaymentMethod.TELEGRAM_STARS) {
      /* ===== TELEGRAM STARS VERIFICATION ===== */
      verified = paymentId.startsWith('stars_');
    } else if (purchase.paymentMethod === PaymentMethod.LOCAL_BIRR) {
      throw new BadRequestException(
        'Manual payments must be verified by admin',
      );
    }

    if (!verified) {
      throw new BadRequestException('Payment verification failed');
    }

    // Prepare update data with proper typing
    const updateData: any = {
      status: PurchaseStatus.COMPLETED,
      paymentId,
      unlockedAt: new Date(),
      verifiedAt: new Date(),
      updatedAt: new Date(),
    };

    // Merge metadata
    const existingMetadata = (purchase.metadata as any) || {};
    updateData.metadata = metadata
      ? {
          ...existingMetadata,
          ...metadata,
          verifiedAt: new Date().toISOString(),
        }
      : { ...existingMetadata, verifiedAt: new Date().toISOString() };

    const updatedPurchase = await this.prisma.purchase.update({
      where: { id: purchaseId },
      data: updateData,
    });

    // Update prompt purchase count
    await this.prisma.prompt.update({
      where: { id: purchase.promptId },
      data: {
        purchaseCount: { increment: 1 },
      },
    });

    // Apply revenue split if creator exists
    if (purchase.prompt.creatorId) {
      await this.applyRevenueSplit(purchase);
    }

    // Update user's total spent
    await this.prisma.user.update({
      where: { id: purchase.userId },
      data: {
        totalSpent: { increment: purchase.amountPaid },
      },
    });

    await this.redis.del(`purchase:${purchaseId}`);

    return {
      success: true,
      message: 'Payment verified successfully',
      data: updatedPurchase,
    };
  }

  /* ===============================
     REVENUE SPLIT
  =============================== */
  private async applyRevenueSplit(purchase: any) {
    const total = purchase.amountPaid;
    const platformCut = total * this.PLATFORM_FEE;
    const creatorCut = total - platformCut;

    if (purchase.prompt.creatorId) {
      // Get current metadata safely
      const currentMetadata = (purchase.prompt.creator?.metadata as any) || {};

      await this.prisma.user.update({
        where: { id: purchase.prompt.creatorId },
        data: {
          metadata: {
            ...currentMetadata,
            totalEarnings: (currentMetadata.totalEarnings || 0) + creatorCut,
          },
        },
      });
    }
  }

  /* ===============================
     REFUNDS (ADMIN)
  =============================== */
  async refundPurchase(purchaseId: string, adminId: string) {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        user: true,
        prompt: true,
      },
    });

    if (!purchase || purchase.status !== PurchaseStatus.COMPLETED) {
      throw new BadRequestException('Invalid refund request');
    }

    // Check if refund is within allowed period
    const purchaseDate = purchase.unlockedAt || purchase.createdAt;
    const daysSincePurchase =
      (Date.now() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSincePurchase > 7) {
      throw new BadRequestException('Refund period expired (7 days)');
    }

    const existingMetadata = (purchase.metadata as any) || {};

    await this.prisma.purchase.update({
      where: { id: purchaseId },
      data: {
        status: PurchaseStatus.REFUNDED,
        refundedAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          ...existingMetadata,
          refundedBy: adminId,
          refundedAt: new Date().toISOString(),
        },
      },
    });

    // Update user's total spent
    await this.prisma.user.update({
      where: { id: purchase.userId },
      data: {
        totalSpent: { decrement: purchase.amountPaid },
      },
    });

    // Update prompt purchase count
    await this.prisma.prompt.update({
      where: { id: purchase.promptId },
      data: {
        purchaseCount: { decrement: 1 },
      },
    });

    // Log admin action
    await this.prisma.adminLog.create({
      data: {
        adminId,
        action: 'REFUND_PURCHASE',
        details: {
          purchaseId,
          amount: purchase.amountPaid,
          currency: purchase.currency,
          userId: purchase.userId,
          promptId: purchase.promptId,
          promptTitle: purchase.prompt.title,
        },
      },
    });

    return { success: true, message: 'Refund processed successfully' };
  }

  /* ===============================
     GET PURCHASE STATUS
  =============================== */
  async getPurchaseStatus(purchaseId: string) {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id: purchaseId },
      select: {
        id: true,
        status: true,
        paymentMethod: true,
        amountPaid: true,
        currency: true,
        unlockedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!purchase) {
      throw new BadRequestException('Purchase not found');
    }

    return {
      success: true,
      data: purchase,
    };
  }

  /* ===============================
     PRICE RESOLUTION
  =============================== */
  private getPrice(prompt: any, method: string) {
    switch (method) {
      case PaymentMethod.TELEGRAM_STARS:
        return { amount: prompt.priceStars, currency: 'XTR' };
      case PaymentMethod.TON:
        return { amount: prompt.priceTon || 0, currency: 'TON' };
      case PaymentMethod.LOCAL_BIRR:
        return { amount: prompt.priceLocal || 0, currency: 'ETB' };
      default:
        throw new BadRequestException('Invalid payment method');
    }
  }

  /* ===============================
     GET USER PURCHASES
  =============================== */
  async getUserPurchases(userId: string) {
    try {
      const purchases = await this.prisma.purchase.findMany({
        where: {
          userId,
          status: {
            in: [PurchaseStatus.COMPLETED, PurchaseStatus.PENDING_VERIFICATION],
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
        include: {
          prompt: {
            select: {
              id: true,
              title: true,
              description: true,
              category: true,
              imageUrl: true,
              imageAlt: true,
              previewContent: true,
            },
          },
        },
      });

      return {
        success: true,
        data: purchases,
        count: purchases.length,
      };
    } catch (error) {
      this.logger.error('Failed to fetch user purchases', error);
      throw error;
    }
  }
  /* ===============================
     ADMIN: GET REVENUE STATS
  =============================== */
  async getAdminRevenueStats() {
    const [totalRevenue, totalPurchases, todayRevenue, pendingPurchases] =
      await Promise.all([
        this.prisma.purchase.aggregate({
          _sum: { amountPaid: true },
          where: { status: PurchaseStatus.COMPLETED },
        }),
        this.prisma.purchase.count({
          where: { status: PurchaseStatus.COMPLETED },
        }),
        this.prisma.purchase.aggregate({
          _sum: { amountPaid: true },
          where: {
            status: PurchaseStatus.COMPLETED,
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
        this.prisma.purchase.count({
          where: { status: PurchaseStatus.PENDING },
        }),
      ]);

    return {
      success: true,
      data: {
        totalRevenue: totalRevenue._sum.amountPaid || 0,
        totalPurchases,
        todayRevenue: todayRevenue._sum.amountPaid || 0,
        pendingPurchases,
        averagePurchaseValue:
          totalPurchases > 0
            ? (totalRevenue._sum.amountPaid || 0) / totalPurchases
            : 0,
      },
    };
  }

  /* ===============================
     CHECK PROMPT VERSION ACCESS
  =============================== */
  async checkPromptAccess(userId: string, promptId: string) {
    const prompt = await this.prisma.prompt.findUnique({
      where: { id: promptId },
      select: { creatorId: true, version: true }
    });

    if (prompt && prompt.creatorId === userId) {
      return {
        hasAccess: true,
        canPurchase: false,
        purchaseStatus: 'COMPLETED',
        purchasedVersion: prompt.version,
        currentVersion: prompt.version,
        needsUpdate: false,
      };
    }

    const purchase = await this.prisma.purchase.findFirst({
      where: {
        userId,
        promptId,
        status: {
          in: [PurchaseStatus.COMPLETED, PurchaseStatus.PENDING_VERIFICATION],
        },
      },
      include: {
        prompt: {
          select: {
            id: true,
            title: true,
            description: true,
            version: true,
          },
        },
      },
    });

    if (!purchase) {
      return {
        hasAccess: false,
        canPurchase: true,
        purchaseStatus: null,
      };
    }

    const purchaseMetadata = (purchase.metadata as any) || {};
    const purchasedVersion = purchaseMetadata.promptVersion || 1;
    const currentVersion = purchase.prompt.version;

    return {
      hasAccess: purchase.status === PurchaseStatus.COMPLETED,
      canPurchase: false,
      purchaseStatus: purchase.status,
      purchasedVersion,
      currentVersion,
      needsUpdate: currentVersion > purchasedVersion,
      lastAccessed: purchase.unlockedAt,
    };
  }

  /* ===============================
     LOCAL BIRR MANUAL PAYMENT INITIATION
  =============================== */
  async initiateLocalPayment(userId: string, promptId: string) {
    const prompt = await this.prisma.prompt.findFirst({
      where: { id: promptId, isActive: true },
    });

    if (!prompt) throw new BadRequestException('Prompt not found');

    // Check if already purchased
    const existing = await this.prisma.purchase.findFirst({
      where: {
        userId,
        promptId,
        status: PurchaseStatus.COMPLETED,
      },
    });

    if (existing) {
      throw new BadRequestException('Prompt already purchased');
    }

    const price = { amount: prompt.priceLocal || 0, currency: 'ETB' };

    if (price.amount <= 0) {
      throw new BadRequestException('Invalid price for local payment');
    }

    // Create purchase with WAITING_VERIFICATION status
    const purchase = await this.prisma.purchase.create({
      data: {
        userId,
        promptId,
        paymentMethod: PaymentMethod.LOCAL_BIRR,
        amountPaid: price.amount,
        currency: price.currency,
        status: PurchaseStatus.WAITING_VERIFICATION,
        metadata: {
          promptVersion: prompt.version,
          paymentType: 'manual_bank_transfer',
        },
      },
    });

    // Return bank account details for user
    const bankAccounts = [
      {
        name: 'Commercial Bank of Ethiopia',
        accountNumber: '1000146061188',
        accountName: 'Behabtu Getnet Walle',
        branch: 'Main Branch',
      },
      {
        name: 'Awash Bank',
        accountNumber: '0130000000002',
        accountName: 'Behabtu Getnet Walle',
        branch: 'Megenagna Branch',
      },
    ];

    return {
      success: true,
      data: {
        purchaseId: purchase.id,
        amount: price.amount,
        currency: price.currency,
        bankAccounts,
        instructions: [
          `Transfer exactly ${price.amount} ETB to one of the bank accounts`,
          'Include the purchase ID as reference',
          'Upload payment receipt after transfer',
          'Verification takes 1-24 hours',
        ],
      },
    };
  }

  /* ===============================
   UPLOAD PAYMENT RECEIPT
  =============================== */
  async uploadPaymentReceipt(
    purchaseId: string,
    bankName: string,
    accountNumber: string,
    referenceNumber: string,
    notes: string,
    receiptFile: Express.Multer.File,
  ) {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id: purchaseId },
    });

    if (!purchase) {
      throw new BadRequestException('Purchase not found');
    }

    if (purchase.status !== PurchaseStatus.WAITING_VERIFICATION) {
      throw new BadRequestException('Purchase is not waiting for verification');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(receiptFile.originalname);
    const filename = `${timestamp}-${randomString}${ext}`;

    const receiptUrl = `/uploads/receipts/${filename}`;

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'uploads', 'receipts');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Move file to uploads directory
    const filePath = path.join(uploadDir, filename);

    // Handle file based on storage type
    if (receiptFile.buffer) {
      // Memory storage
      fs.writeFileSync(filePath, receiptFile.buffer);
    } else if (receiptFile.path && fs.existsSync(receiptFile.path)) {
      // Disk storage - move the file
      fs.renameSync(receiptFile.path, filePath);
    } else {
      throw new BadRequestException('No valid file data received');
    }

    // Update purchase with payment details
    await this.prisma.purchase.update({
      where: { id: purchaseId },
      data: {
        manualPaymentData: {
          bankName,
          accountNumber,
          referenceNumber,
          notes,
          receiptUrl,
          uploadedAt: new Date().toISOString(),
          amount: purchase.amountPaid,
          currency: purchase.currency,
        },
        status: PurchaseStatus.PENDING_VERIFICATION,
        updatedAt: new Date(),
      },
    });

    // Try to find an admin user for logging
    try {
      const adminUser = await this.prisma.user.findFirst({
        where: {
          OR: [{ role: 'ADMIN' }, { isAdmin: true }],
        },
        select: { id: true },
      });

      // Create admin log if admin exists, otherwise skip
      if (adminUser) {
        await this.prisma.adminLog.create({
          data: {
            adminId: adminUser.id,
            action: 'PAYMENT_UPLOADED',
            details: {
              purchaseId,
              bankName,
              accountNumber,
              referenceNumber,
              amount: purchase.amountPaid,
              currency: purchase.currency,
              userId: purchase.userId,
              timestamp: new Date().toISOString(),
            },
          },
        });
      } else {
        // Log to console if no admin found
        this.logger.log(
          `Payment uploaded for purchase ${purchaseId}, but no admin user found for logging`,
        );
      }
    } catch (error) {
      // Don't fail the whole operation if logging fails
      this.logger.error(`Failed to create admin log: ${error.message}`);
    }

    return {
      success: true,
      message:
        'Payment receipt uploaded successfully. Waiting for admin verification.',
      data: {
        purchaseId,
        receiptUrl,
        status: 'PENDING_VERIFICATION',
      },
    };
  }

  /* ===============================
   GET PENDING MANUAL PAYMENTS (ADMIN)
  =============================== */
  async getPendingManualPayments(adminId: string) {
    try {
      const pendingPayments = await this.prisma.purchase.findMany({
        where: {
          paymentMethod: PaymentMethod.LOCAL_BIRR,
          status: {
            in: [PurchaseStatus.WAITING_VERIFICATION, PurchaseStatus.PENDING_VERIFICATION],
          },
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              telegramId: true,
            },
          },
          prompt: {
            select: {
              id: true,
              title: true,
              priceLocal: true,
              category: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

      // Convert BigInt to string to avoid serialization issues
      const formattedPayments = pendingPayments.map((payment) => ({
        ...payment,
        user: payment.user
          ? {
              ...payment.user,
              telegramId: payment.user.telegramId?.toString() || null,
            }
          : null,
      }));

      // Log admin access
      await this.createAdminLog(adminId, 'VIEW_PENDING_PAYMENTS', {
        count: formattedPayments.length,
      });

      return {
        success: true,
        data: formattedPayments,
        count: formattedPayments.length,
      };
    } catch (error) {
      this.logger.error('Failed to fetch pending payments:', error);
      throw error;
    }
  }

  /* =====================================================
     TELEGRAM WEBHOOK (STARS)
  ====================================================== */
  async handleTelegramWebhook(signature: string, payload: any) {
    // ✅ B. Telegram webhook signature verification
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET!;
    const computed = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    if (signature !== computed) {
      throw new BadRequestException('Invalid Telegram webhook signature');
    }

    const purchaseId = payload?.payload?.purchaseId;
    if (!purchaseId) return;

    await this.verifyPayment(purchaseId, 'TELEGRAM_STARS');
  }

  /* ===============================
   VERIFY MANUAL PAYMENT (ADMIN)
  =============================== */
  async verifyManualPayment(
    purchaseId: string,
    adminId: string,
    notes?: string,
  ) {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        user: true,
        prompt: true,
      },
    });

    if (!purchase) {
      throw new BadRequestException('Purchase not found');
    }

    if (purchase.status !== PurchaseStatus.PENDING_VERIFICATION) {
      throw new BadRequestException('Payment is not pending verification');
    }

    if (purchase.paymentMethod !== PaymentMethod.LOCAL_BIRR) {
      throw new BadRequestException('Only manual payments can be verified');
    }

    // Update purchase as completed
    const updatedPurchase = await this.prisma.purchase.update({
      where: { id: purchaseId },
      data: {
        status: PurchaseStatus.COMPLETED,
        verifiedAt: new Date(),
        verifiedBy: adminId,
        verificationNotes: notes || 'Payment verified from bank statement',
        unlockedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Update prompt purchase count
    await this.prisma.prompt.update({
      where: { id: purchase.promptId },
      data: {
        purchaseCount: { increment: 1 },
      },
    });

    // Apply revenue split if creator exists
    if (purchase.prompt.creatorId) {
      await this.applyRevenueSplit(purchase);
    }

    // Update user's total spent
    await this.prisma.user.update({
      where: { id: purchase.userId },
      data: {
        totalSpent: { increment: purchase.amountPaid },
      },
    });

    // Create admin log
    await this.createAdminLog(adminId, 'VERIFY_MANUAL_PAYMENT', {
      purchaseId,
      amount: purchase.amountPaid,
      currency: purchase.currency,
      userId: purchase.userId,
      promptId: purchase.promptId,
      notes,
    });

    // TODO: Send notification to user (email/telegram)
    this.logger.log(`Payment ${purchaseId} verified by admin ${adminId}`);

    return {
      success: true,
      message: 'Payment verified and prompt unlocked',
      data: { purchaseId },
    };
  }

  /* ===============================
   REJECT MANUAL PAYMENT (ADMIN)
  =============================== */
  async rejectManualPayment(
    purchaseId: string,
    adminId: string,
    reason: string,
  ) {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: { user: true },
    });

    if (!purchase) {
      throw new BadRequestException('Purchase not found');
    }

    if (purchase.status !== PurchaseStatus.PENDING_VERIFICATION) {
      throw new BadRequestException('Payment is not pending verification');
    }

    const updatedPurchase = await this.prisma.purchase.update({
      where: { id: purchaseId },
      data: {
        status: PurchaseStatus.FAILED,
        verificationNotes: reason,
        updatedAt: new Date(),
      },
    });

    // Create admin log
    await this.createAdminLog(adminId, 'REJECT_MANUAL_PAYMENT', {
      purchaseId,
      amount: purchase.amountPaid,
      currency: purchase.currency,
      userId: purchase.userId,
      reason,
    });

    // TODO: Send notification to user about rejection
    this.logger.log(`Payment ${purchaseId} rejected by admin ${adminId}`);

    return {
      success: true,
      message: 'Payment rejected',
      data: { purchaseId },
    };
  }

  /* ===============================
   HELPER: CREATE ADMIN LOG
  =============================== */
  private async createAdminLog(adminId: string, action: string, details: any) {
    try {
      // First check if admin user exists
      const adminUser = await this.prisma.user.findUnique({
        where: { id: adminId },
      });

      if (!adminUser) {
        this.logger.warn(`Admin user ${adminId} not found for logging`);
        return;
      }

      await this.prisma.adminLog.create({
        data: {
          adminId,
          action,
          details: {
            ...details,
            timestamp: new Date().toISOString(),
            adminUsername: adminUser.username,
          },
        },
      });
    } catch (error) {
      // Don't fail the main operation if logging fails
      this.logger.error(`Failed to create admin log: ${error.message}`);
    }
  }
}
