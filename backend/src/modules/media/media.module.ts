// src/modules/media/media.module.ts
import { Module } from '@nestjs/common';
import { MediaService } from './media.service';

@Module({
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
