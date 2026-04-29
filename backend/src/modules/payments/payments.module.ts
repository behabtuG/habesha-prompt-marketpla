// src/modules/payments/payments.module.ts
import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { TelegramService } from './providers/telegram.service';
import { TonService } from './providers/ton.service';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, TelegramService, TonService],
})
export class PaymentsModule {}
