// src/prisma/prisma.service.ts
import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  [x: string]: any;
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super();
    this.logger.log('Prisma Client initialized');
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Successfully connected to the database');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Disconnected from the database');
  }
}
