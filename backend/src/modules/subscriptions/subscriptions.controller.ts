import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('status')
  async getStatus(@Request() req) {
    return this.subscriptionsService.getSubscriptionStatus(req.user.sub);
  }

  @Post('activate')
  async activate(
    @Request() req,
    @Body('tier') tier: any,
    @Body('days') days?: number,
  ) {
    return this.subscriptionsService.activateSubscription(
      req.user.sub,
      tier,
      days,
    );
  }

  @Post('cancel')
  async cancel(@Request() req) {
    return this.subscriptionsService.cancelSubscription(req.user.sub);
  }
}
