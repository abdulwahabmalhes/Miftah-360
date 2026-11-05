import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateQuoteRevisionDto,
  RejectQuoteDto,
} from './dto/quotes.dto';
import {
  QuoteRevisionStatus,
  JobStatus,
  BookingStatus,
  Prisma,
} from '@prisma/client';
import { Role } from '@miftah/contracts';
import { createHash, randomUUID } from 'crypto';

@Injectable()
export class QuotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // -------------------------------------------------------------
  // WORKSHOP ACTIONS
  // -------------------------------------------------------------
  async getJobQuotes(workshopId: string, jobId: string) {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, workshopId },
      include: {
        booking: {
          include: {
            serviceRequest: true,
          },
        },
      },
    });

    if (!job) {
      throw new NotFoundException('أمر الصيانة غير موجود');
    }

    const quoteFamily = await this.prisma.quoteFamily.findUnique({
      where: { serviceRequestId: job.serviceRequestId },
      include: {
        revisions: {
          orderBy: { revisionNumber: 'desc' },
          include: {
            items: {
              orderBy: { sortOrder: 'asc' },
              include: { service: { select: { id: true, code: true, nameAr: true, nameEn: true } } },
            },
            acceptedByUser: {
              select: { id: true, fullName: true },
            },
          },
        },
      },
    });

    return {
      jobId: job.id,
      serviceRequestId: job.serviceRequestId,
      authorizedQuoteRevisionId: job.authorizedQuoteRevisionId,
      quoteFamily,
    };
  }

  async createOrUpdateDraft(
    workshopId: string,
    jobId: string,
    dto: CreateQuoteRevisionDto,
    actorUserId?: string,
  ) {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, workshopId },
      include: {
        booking: {
          include: { serviceRequest: true },
        },
      },
    });

    if (!job) {
      throw new NotFoundException('أمر الصيانة غير موجود');
    }

    if (dto.items.length === 0) {
      throw new BadRequestException('عرض السعر يجب أن يحتوي على بند واحد على الأقل');
    }

    // 1. Ensure QuoteFamily exists
    let quoteFamily = await this.prisma.quoteFamily.findUnique({
      where: { serviceRequestId: job.serviceRequestId },
      include: { revisions: { orderBy: { revisionNumber: 'desc' } } },
    });

    if (!quoteFamily) {
      quoteFamily = await this.prisma.quoteFamily.create({
        data: {
          serviceRequestId: job.serviceRequestId,
          workshopId,
          userId: job.booking.userId,
        },
        include: { revisions: true },
      });
    }

    // 2. Calculate Subtotal, Tax, and Total server-side
    let subtotalNum = 0;
    dto.items.forEach((item) => {
      subtotalNum += item.quantity * item.unitPrice;
    });

    const discountNum = dto.discount || 0;
    const taxableSubtotal = Math.max(0, subtotalNum - discountNum);
    const taxNum = Number((taxableSubtotal * 0.05).toFixed(2)); // 5% UAE VAT
    const totalNum = Number((taxableSubtotal + taxNum).toFixed(2));

    const subtotal = new Prisma.Decimal(subtotalNum.toFixed(2));
    const discount = new Prisma.Decimal(discountNum.toFixed(2));
    const tax = new Prisma.Decimal(taxNum.toFixed(2));
    const total = new Prisma.Decimal(totalNum.toFixed(2));

    // 3. Check for existing DRAFT revision, or bump revision number
    const existingDraft = quoteFamily.revisions.find(
      (r) => r.status === QuoteRevisionStatus.DRAFT,
    );

    return this.prisma.$transaction(async (tx) => {
      let revision;
      if (existingDraft) {
        // Delete old items and update
        await tx.quoteItem.deleteMany({
          where: { quoteRevisionId: existingDraft.id },
        });

        revision = await tx.quoteRevision.update({
          where: { id: existingDraft.id },
          data: {
            subtotal,
            discount,
            tax,
            total,
            items: {
              create: dto.items.map((it, idx) => ({
                serviceId: it.serviceId,
                description: it.description,
                quantity: it.quantity,
                unitPrice: new Prisma.Decimal(it.unitPrice.toFixed(2)),
                lineTotal: new Prisma.Decimal((it.quantity * it.unitPrice).toFixed(2)),
                sortOrder: it.sortOrder ?? idx,
              })),
            },
          },
          include: { items: true },
        });
      } else {
        const nextRevNum =
          quoteFamily.revisions.length > 0
            ? Math.max(...quoteFamily.revisions.map((r) => r.revisionNumber)) + 1
            : 1;

        revision = await tx.quoteRevision.create({
          data: {
            quoteFamilyId: quoteFamily.id,
            revisionNumber: nextRevNum,
            status: QuoteRevisionStatus.DRAFT,
            currency: 'AED',
            subtotal,
            discount,
            tax,
            total,
            items: {
              create: dto.items.map((it, idx) => ({
                serviceId: it.serviceId,
                description: it.description,
                quantity: it.quantity,
                unitPrice: new Prisma.Decimal(it.unitPrice.toFixed(2)),
                lineTotal: new Prisma.Decimal((it.quantity * it.unitPrice).toFixed(2)),
                sortOrder: it.sortOrder ?? idx,
              })),
            },
          },
          include: { items: true },
        });
      }

      return revision;
    });
  }

  async sendQuote(
    workshopId: string,
    revisionId: string,
    actorUserId?: string,
  ) {
    const revision = await this.prisma.quoteRevision.findFirst({
      where: {
        id: revisionId,
        quoteFamily: { workshopId },
      },
      include: {
        items: true,
        quoteFamily: {
          include: {
            serviceRequest: {
              include: { booking: true },
            },
          },
        },
      },
    });

    if (!revision) {
      throw new NotFoundException('عرض السعر غير موجود');
    }

    if (revision.status !== QuoteRevisionStatus.DRAFT) {
      throw new BadRequestException('يمكن إرسال المسودات فقط (DRAFT)');
    }

    const sentAt = new Date();
    const expiresAt = new Date(sentAt.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Generate SHA-256 Immutable Hash
    const hashPayload = {
      quoteFamilyId: revision.quoteFamilyId,
      revisionNumber: revision.revisionNumber,
      total: Number(revision.total),
      items: revision.items.map((i) => ({
        desc: i.description,
        qty: i.quantity,
        price: Number(i.unitPrice),
      })),
      timestamp: sentAt.toISOString(),
    };
    const immutableHash = createHash('sha256')
      .update(JSON.stringify(hashPayload))
      .digest('hex');

    return this.prisma.$transaction(async (tx) => {
      // 1. Supersede any other active SENT revisions in this family
      await tx.quoteRevision.updateMany({
        where: {
          quoteFamilyId: revision.quoteFamilyId,
          status: QuoteRevisionStatus.SENT,
          id: { not: revisionId },
        },
        data: { status: QuoteRevisionStatus.SUPERSEDED },
      });

      // 2. Mark this revision as SENT
      const updatedRevision = await tx.quoteRevision.update({
        where: { id: revisionId },
        data: {
          status: QuoteRevisionStatus.SENT,
          sentAt,
          expiresAt,
          immutableHash,
        },
      });

      // 3. Update Job and Booking to AWAITING_APPROVAL / QUOTE_SENT
      const serviceReq = revision.quoteFamily.serviceRequest;
      if (serviceReq.booking) {
        await tx.booking.update({
          where: { id: serviceReq.booking.id },
          data: { status: BookingStatus.QUOTE_SENT },
        });

        await tx.job.updateMany({
          where: { bookingId: serviceReq.booking.id },
          data: { status: JobStatus.AWAITING_APPROVAL },
        });
      }

      if (actorUserId) {
        await this.auditService.record({
          actorUserId,
          actorRole: Role.WORKSHOP_OWNER,
          tenantId: workshopId,
          entityType: 'QuoteRevision',
          entityId: revisionId,
          action: 'QUOTE_SENT',
          fromState: QuoteRevisionStatus.DRAFT,
          toState: QuoteRevisionStatus.SENT,
          correlationId: randomUUID(),
          metadata: {
            revisionNumber: revision.revisionNumber,
            total: Number(revision.total),
            immutableHash,
          },
        });
      }

      return updatedRevision;
    });
  }

  // -------------------------------------------------------------
  // CUSTOMER APPROVAL GATE (Car Owner Only)
  // -------------------------------------------------------------
  async acceptQuote(
    userId: string,
    revisionId: string,
    userRole: string,
  ) {
    const revision = await this.prisma.quoteRevision.findUnique({
      where: { id: revisionId },
      include: {
        quoteFamily: {
          include: {
            serviceRequest: {
              include: {
                booking: { include: { job: true } },
              },
            },
          },
        },
      },
    });

    if (!revision) {
      throw new NotFoundException('عرض السعر غير موجود');
    }

    // STRICT RULE: Only the Car Owner can accept!
    if (userRole !== Role.CAR_OWNER && userRole !== Role.SUPER_ADMIN) {
      throw new ForbiddenException(
        'غير مسموح لموظفي الورشة بالموافقة على عرض السعر نيابة عن العميل. الموافقة حصراً لمالك المركبة.',
      );
    }

    if (revision.quoteFamily.userId !== userId && userRole !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('عرض السعر لا يتبع للمستخدم الحالي');
    }

    if (revision.status !== QuoteRevisionStatus.SENT) {
      throw new BadRequestException(
        `لا يمكن قبول عرض السعر في حالته الحالية: ${revision.status}`,
      );
    }

    const acceptedAt = new Date();

    return this.prisma.$transaction(async (tx) => {
      // 1. Mark Quote Revision as ACCEPTED
      const updatedRevision = await tx.quoteRevision.update({
        where: { id: revisionId },
        data: {
          status: QuoteRevisionStatus.ACCEPTED,
          acceptedAt,
          acceptedByUserId: userId,
        },
      });

      // 2. Authorize Job & Update Status to CONFIRMED
      const booking = revision.quoteFamily.serviceRequest.booking;
      if (booking?.job) {
        await tx.job.update({
          where: { id: booking.job.id },
          data: {
            status: JobStatus.CONFIRMED, // Authorized Work!
            authorizedQuoteRevisionId: revisionId,
          },
        });

        // 3. Update Booking to QUOTE_APPROVED
        await tx.booking.update({
          where: { id: booking.id },
          data: { status: BookingStatus.QUOTE_APPROVED },
        });
      }

      await this.auditService.record({
        actorUserId: userId,
        actorRole: Role.CAR_OWNER,
        tenantId: revision.quoteFamily.workshopId,
        entityType: 'QuoteRevision',
        entityId: revisionId,
        action: 'QUOTE_ACCEPTED',
        fromState: QuoteRevisionStatus.SENT,
        toState: QuoteRevisionStatus.ACCEPTED,
        correlationId: randomUUID(),
        metadata: {
          revisionNumber: revision.revisionNumber,
          total: Number(revision.total),
        },
      });

      return updatedRevision;
    });
  }

  async rejectQuote(
    userId: string,
    revisionId: string,
    dto?: RejectQuoteDto,
  ) {
    const revision = await this.prisma.quoteRevision.findUnique({
      where: { id: revisionId },
      include: { quoteFamily: true },
    });

    if (!revision) {
      throw new NotFoundException('عرض السعر غير موجود');
    }

    if (revision.quoteFamily.userId !== userId) {
      throw new ForbiddenException('عرض السعر لا يتبع للمستخدم الحالي');
    }

    if (revision.status !== QuoteRevisionStatus.SENT) {
      throw new BadRequestException('يمكن رفض عروض الأسعار المرسلة فقط');
    }

    const rejectedAt = new Date();

    const result = await this.prisma.quoteRevision.update({
      where: { id: revisionId },
      data: {
        status: QuoteRevisionStatus.REJECTED,
        rejectedAt,
      },
    });

    await this.auditService.record({
      actorUserId: userId,
      actorRole: Role.CAR_OWNER,
      tenantId: revision.quoteFamily.workshopId,
      entityType: 'QuoteRevision',
      entityId: revisionId,
      action: 'QUOTE_REJECTED',
      fromState: QuoteRevisionStatus.SENT,
      toState: QuoteRevisionStatus.REJECTED,
      correlationId: randomUUID(),
      metadata: { reason: dto?.reason },
    });

    return result;
  }
}

