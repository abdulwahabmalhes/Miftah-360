import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateAuditLogParams {
  actorUserId?: string;
  actorRole?: string;
  tenantId?: string;
  entityType: string;
  entityId?: string;
  action: string;
  fromState?: string;
  toState?: string;
  reasonCode?: string;
  correlationId: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(params: CreateAuditLogParams) {
    try {
      const log = await this.prisma.auditLog.create({
        data: {
          actorUserId: params.actorUserId,
          actorRole: params.actorRole,
          tenantId: params.tenantId,
          entityType: params.entityType,
          entityId: params.entityId,
          action: params.action,
          fromState: params.fromState,
          toState: params.toState,
          reasonCode: params.reasonCode,
          correlationId: params.correlationId,
          metadata: params.metadata as any,
        },
      });

      this.logger.log(
        `[AUDIT] Action: ${params.action} | Entity: ${params.entityType}:${params.entityId || 'N/A'} | Actor: ${params.actorUserId || 'ANONYMOUS'} (${params.actorRole || 'NONE'}) | Correlation: ${params.correlationId}`,
      );

      return log;
    } catch (error) {
      this.logger.error(`Failed to write audit log: ${(error as Error).message}`, (error as Error).stack);
      return null;
    }
  }
}

