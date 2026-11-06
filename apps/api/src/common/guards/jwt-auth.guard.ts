import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { JwtPayload, StandardErrorCode, StaffStatus } from '@miftah/contracts';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: JwtPayload; workshopId?: string }>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException({
        code: StandardErrorCode.UNAUTHORIZED,
        message: 'Missing or malformed Authorization header',
      });
    }

    const token = authHeader.split(' ')[1];

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: process.env.JWT_SECRET || 'dev_secret_miftah_360_replace_in_prod',
      });
    } catch {
      throw new UnauthorizedException({
        code: StandardErrorCode.UNAUTHORIZED,
        message: 'Invalid or expired token',
      });
    }

    // Check if session is revoked
    if (payload.session_id) {
      const session = await this.prisma.session.findUnique({
        where: { id: payload.session_id },
      });

      if (!session || session.isRevoked || session.tokenVersion !== payload.token_version) {
        throw new UnauthorizedException({
          code: StandardErrorCode.TOKEN_REVOKED,
          message: 'Session has been revoked or expired',
        });
      }
    }

    // If workshop staff/owner, verify affiliation is still active
    if (payload.workshop_id && payload.sub) {
      const staff = await this.prisma.workshopStaff.findUnique({
        where: {
          workshopId_userId: {
            workshopId: payload.workshop_id,
            userId: payload.sub,
          },
        },
      });

      if (staff) {
        if (staff.status === StaffStatus.DISABLED) {
          throw new UnauthorizedException({
            code: StandardErrorCode.TOKEN_REVOKED,
            message: 'Staff account has been disabled by the workshop owner',
          });
        }
      } else {
        const workshop = await this.prisma.workshop.findUnique({
          where: { id: payload.workshop_id },
          select: { ownerUserId: true },
        });

        if (!workshop || workshop.ownerUserId !== payload.sub) {
          throw new UnauthorizedException({
            code: StandardErrorCode.TOKEN_REVOKED,
            message: 'User is no longer affiliated with this workshop tenant',
          });
        }
      }
    }

    request.user = payload;
    if (payload.workshop_id) {
      request.workshopId = payload.workshop_id;
    }

    return true;
  }
}

