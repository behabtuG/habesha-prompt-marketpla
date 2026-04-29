// src/prisma/redis.service.ts
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  private store = new Map<string, { value: string; expiresAt?: number }>();

  // Simple set method - accepts seconds for TTL
  async set(key: string, value: string, ttlSeconds?: number): Promise<string> {
    let expiresAt: number | undefined;

    if (ttlSeconds) {
      expiresAt = Date.now() + ttlSeconds * 1000;
    }

    this.store.set(key, { value, expiresAt });
    this.logger.debug(
      `Set key: ${key} with TTL: ${ttlSeconds || 'none'} seconds`,
    );
    return 'OK';
  }

  async setex(key: string, seconds: number, value: string): Promise<string> {
    return this.set(key, value, seconds);
  }

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) {
      this.logger.debug(`Key not found: ${key}`);
      return null;
    }

    // Check expiration
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      this.logger.debug(`Key expired: ${key}`);
      return null;
    }

    this.logger.debug(`Got key: ${key}`);
    return item.value;
  }

  async del(key: string): Promise<number> {
    const existed = this.store.has(key);
    this.store.delete(key);
    this.logger.debug(`Deleted key: ${key} (existed: ${existed})`);
    return existed ? 1 : 0;
  }

  async zincrby(
    key: string,
    increment: number,
    member: string,
  ): Promise<string> {
    // Simple implementation for zincrby
    this.logger.debug(
      `zincrby: ${key}, increment: ${increment}, member: ${member}`,
    );
    return '1';
  }

  async zadd(key: string, score: number, member: string): Promise<number> {
    // Simple implementation for zadd
    this.logger.debug(`zadd: ${key}, score: ${score}, member: ${member}`);
    return 1;
  }

  async exists(key: string): Promise<number> {
    const item = this.store.get(key);
    if (!item) return 0;

    // Check expiration
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return 0;
    }

    return 1;
  }

  async onModuleDestroy() {
    this.store.clear();
    this.logger.log('Redis store cleared');
  }
}
