// src/modules/admin/admin.service.ts
import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MediaService } from '../media/media.service';
import * as CryptoJS from 'crypto-js';
import * as path from 'path';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private mediaService: MediaService,
  ) {}

  async createPrompt(data: {
    title: string;
    description: string;
    category: string;
    priceStars: number | string;
    previewContent: string;
    fullContent: string;
    creatorId: string;
    priceTon?: number | string;
    priceLocal?: number | string;
    imageFile?: Express.Multer.File;
    imageAlt?: string;
  }) {
    // 1. Validate required fields
    const requiredFields = [
      'title',
      'description',
      'category',
      'priceStars',
      'fullContent',
    ];
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new BadRequestException(`Field "${field}" is required`);
      }
    }

    // 2. Convert string numbers to actual numbers
    const priceStars = this.parseNumber(data.priceStars, 'priceStars');
    const priceTon = data.priceTon
      ? this.parseNumber(data.priceTon, 'priceTon')
      : 0;
    const priceLocal = data.priceLocal
      ? this.parseNumber(data.priceLocal, 'priceLocal')
      : 0;

    // 3. Generate slug
    const slug = this.generateSlug(data.title);

    // 4. Check if slug exists
    const existing = await this.prisma.prompt.findUnique({ where: { slug } });
    if (existing) {
      throw new BadRequestException(
        `Prompt with title "${data.title}" already exists`,
      );
    }

    // 5. Encrypt content (only if price > 0)
    let encryptedContent = data.fullContent;
    if (priceStars > 0) {
      const encryptionKey = process.env.ENCRYPTION_KEY;
      if (!encryptionKey) {
        throw new Error('ENCRYPTION_KEY is not configured');
      }
      encryptedContent = CryptoJS.AES.encrypt(
        data.fullContent,
        encryptionKey,
      ).toString();
    }

    // 6. Handle image upload (optional)
    let imageUrl: string | null = null;
    if (data.imageFile) {
      const uploadResult = await this.mediaService.uploadFile(data.imageFile);
      imageUrl = uploadResult.url;
    }

    // 7. Create prompt in database
    const prompt = await this.prisma.prompt.create({
      data: {
        title: data.title,
        slug,
        description: data.description,
        category: data.category,
        priceStars,
        priceTon,
        priceLocal,
        previewContent: data.previewContent || '',
        fullContent: encryptedContent,
        creatorId: data.creatorId,
        imageUrl,
        imageAlt: data.imageAlt || data.title,
        isActive: true,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        priceStars: true,
        imageUrl: true,
        createdAt: true,
      },
    });

    // 8. Return success response
    return {
      success: true,
      message: 'Prompt created successfully',
      data: {
        id: prompt.id,
        title: prompt.title,
        slug: prompt.slug,
        category: prompt.category,
        priceStars: prompt.priceStars,
        imageUrl: prompt.imageUrl,
        createdAt: prompt.createdAt,
      },
    };
  }

  async getPromptForEdit(id: string) {
    try {
      const prompt = await this.prisma.prompt.findUnique({
        where: { id },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          category: true,
          priceStars: true,
          priceTon: true,
          priceLocal: true,
          previewContent: true,
          fullContent: true, // This is encrypted
          imageUrl: true,
          imageAlt: true,
          isActive: true,
          purchaseCount: true,
          createdAt: true,
          creatorId: true,
        },
      });

      if (!prompt) {
        throw new NotFoundException('Prompt not found');
      }

      // Decrypt the full content
      const encryptionKey = process.env.ENCRYPTION_KEY;
      if (!encryptionKey) {
        throw new Error('ENCRYPTION_KEY is not configured');
      }

      let decryptedContent = '';
      try {
        decryptedContent = CryptoJS.AES.decrypt(
          prompt.fullContent,
          encryptionKey,
        ).toString(CryptoJS.enc.Utf8);
      } catch (error) {
        console.error('Failed to decrypt content:', error);
        decryptedContent = prompt.fullContent; // Fallback to encrypted content
      }

      return {
        success: true,
        data: {
          ...prompt,
          fullContent: decryptedContent, // Return decrypted content
        },
      };
    } catch (error) {
      console.error('Error getting prompt for edit:', error);
      throw error;
    }
  }

  async getAllPrompts(page: number = 1, limit: number = 20) {
    try {
      console.log('📝 [ADMIN] Getting prompts, page:', page, 'limit:', limit);

      const skip = (page - 1) * limit;

      // First, let's debug what's in the database
      const allPromptsInDB = await this.prisma.prompt.findMany({
        select: {
          id: true,
          title: true,
          isActive: true,
        },
      });

      console.log('📝 [ADMIN] All prompts in DB:', allPromptsInDB);

      const [prompts, total] = await Promise.all([
        this.prisma.prompt.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            category: true,
            priceStars: true,
            previewContent: true,
            imageUrl: true,
            imageAlt: true,
            purchaseCount: true,
            isActive: true,
            createdAt: true,
            creator: {
              select: {
                id: true,
                firstName: true,
                username: true,
              },
            },
          },
        }),
        this.prisma.prompt.count(), // Count ALL prompts
      ]);

      console.log('📝 [ADMIN] API returning prompts:', prompts.length);
      console.log('📝 [ADMIN] First prompt details:', prompts[0]);

      return {
        success: true,
        data: prompts,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('❌ [ADMIN] Error in getAllPrompts:', error);
      throw error;
    }
  }

  async updatePrompt(
    id: string,
    data: {
      title?: string;
      description?: string;
      category?: string;
      priceStars?: number | string;
      previewContent?: string;
      fullContent?: string;
      priceTon?: number | string;
      priceLocal?: number | string;
      imageFile?: Express.Multer.File;
      imageAlt?: string;
      isActive?: boolean;
    },
  ) {
    // 1. Find existing prompt
    const prompt = await this.prisma.prompt.findUnique({ where: { id } });
    if (!prompt) {
      throw new BadRequestException('Prompt not found');
    }

    // 2. Prepare update data
    const updateData: any = {};

    // 3. Update text fields if provided
    if (data.title) updateData.title = data.title;
    if (data.description) updateData.description = data.description;
    if (data.category) updateData.category = data.category;

    // Convert string numbers to numbers
    if (data.priceStars !== undefined) {
      updateData.priceStars = this.parseNumber(data.priceStars, 'priceStars');
    }

    if (data.previewContent !== undefined)
      updateData.previewContent = data.previewContent;

    if (data.priceTon !== undefined) {
      updateData.priceTon = this.parseNumber(data.priceTon, 'priceTon');
    }

    if (data.priceLocal !== undefined) {
      updateData.priceLocal = this.parseNumber(data.priceLocal, 'priceLocal');
    }

    if (data.imageAlt !== undefined) updateData.imageAlt = data.imageAlt;
    // Ensure isActive is a boolean
    if (data.isActive !== undefined) {
      updateData.isActive = typeof data.isActive === 'string' ? data.isActive === 'true' : !!data.isActive;
    }

    // 4. Encrypt full content if provided OR decrypt if price changed to 0
    const finalPriceStars =
      updateData.priceStars !== undefined ? updateData.priceStars : prompt.priceStars;

    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY is not configured');
    }

    if (data.fullContent !== undefined) {
      // Content provided, decide whether to encrypt
      if (finalPriceStars > 0) {
        updateData.fullContent = CryptoJS.AES.encrypt(
          data.fullContent,
          encryptionKey,
        ).toString();
      } else {
        updateData.fullContent = data.fullContent;
      }
    } else if (
      finalPriceStars === 0 &&
      prompt.priceStars > 0 &&
      prompt.fullContent
    ) {
      // Price changed from premium to free, decrypt existing content
      try {
        const decrypted = CryptoJS.AES.decrypt(
          prompt.fullContent,
          encryptionKey,
        ).toString(CryptoJS.enc.Utf8);
        if (decrypted) {
          updateData.fullContent = decrypted;
        }
      } catch (e) {
        console.error('Failed to decrypt during price change:', e);
      }
    }

    // 5. Handle image update if provided
    if (data.imageFile) {
      // Delete old image if exists
      if (prompt.imageUrl) {
        const oldFilePath = path.join(
          process.cwd(),
          'uploads',
          prompt.imageUrl.replace('/uploads/', ''),
        );
        await this.mediaService.deleteFile(oldFilePath);
      }

      // Upload new image
      const uploadResult = await this.mediaService.uploadFile(data.imageFile);
      updateData.imageUrl = uploadResult.url;
    }

    // 6. Update slug if title changed
    if (data.title && data.title !== prompt.title) {
      const newSlug = this.generateSlug(data.title);
      const existing = await this.prisma.prompt.findUnique({
        where: { slug: newSlug },
      });
      if (existing && existing.id !== id) {
        throw new BadRequestException(`Title "${data.title}" is already used`);
      }
      updateData.slug = newSlug;
    }

    // 7. Update in database
    const updatedPrompt = await this.prisma.prompt.update({
      where: { id },
      data: updateData,
    });

    return {
      success: true,
      message: 'Prompt updated successfully',
      data: {
        id: updatedPrompt.id,
        title: updatedPrompt.title,
        slug: updatedPrompt.slug,
        category: updatedPrompt.category,
        priceStars: updatedPrompt.priceStars,
        imageUrl: updatedPrompt.imageUrl,
      },
    };
  }

  // Helper method to parse numbers from strings or numbers
  private parseNumber(value: string | number, fieldName: string): number {
    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      if (isNaN(parsed)) {
        throw new BadRequestException(
          `Field "${fieldName}" must be a valid number`,
        );
      }
      return parsed;
    }

    throw new BadRequestException(`Field "${fieldName}" must be a number`);
  }

  async deletePrompt(id: string) {
    // 1. Find prompt
    const prompt = await this.prisma.prompt.findUnique({ where: { id } });
    if (!prompt) {
      throw new BadRequestException('Prompt not found');
    }

    // 2. Delete image file if exists
    if (prompt.imageUrl) {
      const filePath = path.join(
        process.cwd(),
        'uploads',
        prompt.imageUrl.replace('/uploads/', ''),
      );
      await this.mediaService.deleteFile(filePath);
    }

    // 3. Soft delete (mark as inactive)
    await this.prisma.prompt.update({
      where: { id },
      data: { isActive: false },
    });

    return {
      success: true,
      message: 'Prompt deleted successfully',
    };
  }

  // Helper method
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  // --- USER MANAGEMENT (Requested Feature) ---
  async getAllUsers(page = 1, limit = 20) {
    try {
      console.log('🔍 [ADMIN] getAllUsers called with:', { page, limit });

      const skip = (page - 1) * limit;

      const users = await this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          telegramId: true,
          username: true,
          firstName: true,
          isAdmin: true,
          balanceStars: true,
          createdAt: true,
        },
      });

      const total = await this.prisma.user.count();

      console.log('🔍 [ADMIN] Paginated users found:', users.length);

      // FIX: Convert BigInt telegramId to string (with null safety)
      const usersWithStringIds = users.map((user) => ({
        ...user,
        telegramId: user.telegramId ? user.telegramId.toString() : 'N/A',
      }));

      console.log('🔍 [ADMIN] After conversion:', usersWithStringIds);

      return {
        success: true,
        data: usersWithStringIds, // Use the converted array
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      };
    } catch (error) {
      console.error('❌ [ADMIN] Error in getAllUsers:', error);
      throw new InternalServerErrorException(
        'Failed to fetch users: ' + error.message,
      );
    }
  }

  async updateUserRole(userId: string, isAdmin: boolean) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isAdmin,
        role: isAdmin ? 'ADMIN' : 'USER',
      },
    });

    return {
      success: true,
      message: `User ${isAdmin ? 'promoted' : 'demoted'} to ${isAdmin ? 'admin' : 'user'}`,
    };
  }

  // --- STATS ---
  async getSystemStats() {
    const [totalUsers, totalPrompts, totalRevenueStars, activePrompts] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.prompt.count(),
        this.prisma.purchase.aggregate({
          _sum: { amountPaid: true },
        }),
        this.prisma.prompt.count({ where: { isActive: true } }),
      ]);

    return {
      success: true,
      data: {
        totalUsers,
        totalPrompts,
        totalRevenueStars: totalRevenueStars._sum.amountPaid || 0,
        activePrompts,
      },
    };
  }

  // --- PURCHASE MANAGEMENT ---
  async getAllPurchases(page = 1, limit = 20) {
    try {
      console.log('🔍 [ADMIN] getAllPurchases called:', { page, limit });
      const skip = (page - 1) * limit;

      const [purchases, total] = await Promise.all([
        this.prisma.purchase.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                username: true,
              },
            },
            prompt: {
              select: {
                id: true,
                title: true,
                priceStars: true,
              },
            },
          },
        }),
        this.prisma.purchase.count(),
      ]);

      return {
        success: true,
        data: purchases,
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      };
    } catch (error) {
      console.error('❌ [ADMIN] Error in getAllPurchases:', error);
      throw new InternalServerErrorException('Failed to fetch purchases');
    }
  }
}
