import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  StartInspectionDto,
  AddInspectionFindingDto,
  CompleteInspectionDto,
} from './dto/inspections.dto';
import {
  InspectionStatus,
  JobStatus,
  BookingStatus,
} from '@prisma/client';
import { Role } from '@miftah/contracts';
import { randomUUID } from 'crypto';

@Injectable()
export class InspectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async startInspection(
    workshopId: string,
    jobId: string,
    dto?: StartInspectionDto,
    actorUserId?: string,
  ) {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, workshopId },
      include: { booking: true },
    });

    if (!job) {
      throw new NotFoundException('أمر الصيانة غير موجود');
    }

    let inspection = await this.prisma.inspection.findFirst({
      where: { jobId },
    });

    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      if (!inspection) {
        inspection = await tx.inspection.create({
          data: {
            bookingId: job.bookingId,
            jobId: job.id,
            status: InspectionStatus.IN_PROGRESS,
            startedAt: now,
            internalNotes: dto?.notes,
            createdByUserId: actorUserId || job.workshopId,
          },
        });
      } else {
        inspection = await tx.inspection.update({
          where: { id: inspection.id },
          data: {
            status: InspectionStatus.IN_PROGRESS,
            startedAt: inspection.startedAt || now,
            ...(dto?.notes ? { internalNotes: dto.notes } : {}),
          },
        });
      }

      // Update Job status to INSPECTION
      await tx.job.update({
        where: { id: jobId },
        data: { status: JobStatus.INSPECTION },
      });

      // Update Booking status to INSPECTION
      await tx.booking.update({
        where: { id: job.bookingId },
        data: { status: BookingStatus.INSPECTION },
      });

      if (actorUserId) {
        await this.auditService.record({
          actorUserId,
          actorRole: Role.WORKSHOP_OWNER,
          tenantId: workshopId,
          entityType: 'Inspection',
          entityId: inspection.id,
          action: 'INSPECTION_STARTED',
          fromState: InspectionStatus.NOT_STARTED,
          toState: InspectionStatus.IN_PROGRESS,
          correlationId: randomUUID(),
          metadata: { jobId },
        });
      }

      return inspection;
    });
  }

  async getInspectionById(workshopId: string, inspectionId: string) {
    const inspection = await this.prisma.inspection.findFirst({
      where: {
        id: inspectionId,
        booking: { workshopId },
      },
      include: {
        findings: true,
        booking: {
          include: {
            serviceRequest: {
              include: {
                vehicle: {
                  include: { brand: true, model: true },
                },
                user: {
                  select: { id: true, fullName: true, phoneE164: true },
                },
                service: true,
              },
            },
            job: true,
          },
        },
      },
    });

    if (!inspection) {
      throw new NotFoundException('تقرير الفحص غير موجود أو يتبع ورشة أخرى');
    }

    return inspection;
  }

  async addFinding(
    workshopId: string,
    inspectionId: string,
    dto: AddInspectionFindingDto,
  ) {
    const inspection = await this.prisma.inspection.findFirst({
      where: {
        id: inspectionId,
        booking: { workshopId },
      },
    });

    if (!inspection) {
      throw new NotFoundException('تقرير الفحص غير موجود');
    }

    if (inspection.status === InspectionStatus.COMPLETED) {
      throw new BadRequestException('لا يمكن إضافة بنود فحص لتقرير مكتمل ومعتمد');
    }

    return this.prisma.inspectionFinding.create({
      data: {
        inspectionId,
        title: dto.title,
        description: dto.description,
        severity: dto.severity,
        proposedServiceId: dto.proposedServiceId,
        userVisible: dto.userVisible ?? true,
      },
    });
  }

  async completeInspection(
    workshopId: string,
    inspectionId: string,
    dto: CompleteInspectionDto,
    actorUserId?: string,
  ) {
    const inspection = await this.prisma.inspection.findFirst({
      where: {
        id: inspectionId,
        booking: { workshopId },
      },
      include: {
        findings: true,
        job: true,
      },
    });

    if (!inspection) {
      throw new NotFoundException('تقرير الفحص غير موجود');
    }

    const completedAt = new Date();

    const result = await this.prisma.inspection.update({
      where: { id: inspectionId },
      data: {
        status: InspectionStatus.COMPLETED,
        completedAt,
        summaryUserVisible: dto.summaryUserVisible,
        internalNotes: dto.internalNotes,
      },
      include: { findings: true },
    });

    if (actorUserId) {
      await this.auditService.record({
        actorUserId,
        actorRole: Role.WORKSHOP_OWNER,
        tenantId: workshopId,
        entityType: 'Inspection',
        entityId: inspectionId,
        action: 'INSPECTION_COMPLETED',
        fromState: inspection.status,
        toState: InspectionStatus.COMPLETED,
        correlationId: randomUUID(),
        metadata: {
          findingsCount: inspection.findings.length,
          criticalCount: inspection.findings.filter((f) => f.severity === 'CRITICAL').length,
        },
      });
    }

    return result;
  }
}

