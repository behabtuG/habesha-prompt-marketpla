// common/guards/jwt-auth.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new ForbiddenException('No token provided');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new ForbiddenException('Invalid token format');
    }

    try {
      const payload = this.jwtService.verify(token);

      // Check if user exists and is admin
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.isAdmin) {
        throw new ForbiddenException('Admin privileges required');
      }

      request.user = payload;
      return true;
    } catch (error) {
      throw new ForbiddenException('Invalid or expired token');
    }
  }
}
