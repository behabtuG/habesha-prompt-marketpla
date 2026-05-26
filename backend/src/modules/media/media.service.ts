// src/modules/media/media.service.ts
import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class MediaService {
  private readonly uploadDir: string;

  constructor() {
    // Set upload directory (create if doesn't exist)
    this.uploadDir = path.resolve(process.cwd(), 'uploads', 'prompts');
    this.ensureUploadDir();
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'prompts',
  ): Promise<{ fileName: string; filePath: string; url: string }> {
    try {
      console.log('📤 [MediaService] Starting file upload...');
      console.log('📤 File details:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        bufferLength: file.buffer.length,
      });

      // 1. Validate file
      this.validateFile(file);

      // 2. Generate unique filename
      const fileName = this.generateFileName(file.originalname);
      const targetDir = path.resolve(process.cwd(), 'uploads', folder);
      const filePath = path.join(targetDir, fileName);

      console.log('📤 Generated file name:', fileName);
      console.log('📤 File path:', filePath);
      console.log('📤 Upload directory:', targetDir);

      // 3. Ensure directory exists
      await this.ensureDirExists(targetDir);

      // 4. Save file to disk
      await fs.writeFile(filePath, file.buffer);

      // Verify file was saved
      const savedStats = await fs.stat(filePath);
      console.log('📤 File saved successfully:', {
        size: savedStats.size,
        path: filePath,
        url: `/uploads/${folder}/${fileName}`,
      });

      // 5. Return file info
      return {
        fileName,
        filePath,
        url: `/uploads/${folder}/${fileName}`,
      };
    } catch (error) {
      console.error('❌ [MediaService] Upload failed:', error);
      throw new InternalServerErrorException(
        `Failed to upload file: ${error.message}`,
      );
    }
  }

  /**
   * Helper to ensure custom folder directory exists
   */
  private async ensureDirExists(dir: string): Promise<void> {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  /**
   * Delete file
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      if (await this.fileExists(filePath)) {
        await fs.unlink(filePath);
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
      // Don't throw error if file doesn't exist
    }
  }

  /**
   * Validate file
   */
  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Check file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException(
        `File size exceeds ${maxSize / 1024 / 1024}MB limit`,
      );
    }

    // Check file type (images only)
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed: ${allowedMimeTypes.join(', ')}`,
      );
    }
  }

  /**
   * Generate unique filename
   */
  private generateFileName(originalName: string): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');
    const ext = path.extname(originalName).toLowerCase();
    const baseName = path
      .basename(originalName, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .substring(0, 50);

    return `${baseName}-${timestamp}-${random}${ext}`;
  }

  /**
   * Ensure upload directory exists
   */
  private async ensureUploadDir(): Promise<void> {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Check if file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
