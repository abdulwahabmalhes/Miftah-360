import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  AssignTechnicianDto,
  AddJobNoteDto,
  CompleteJobDto,
  RecordPaymentDto,
  QueryJobsDto,
} from './dto/jobs.dto';
import {
  JobStatus,
  BookingStatus,
  InvoiceStatus,
  PaymentStatus,
  ProvenanceType,
  Prisma,
} from '@prisma/client';
import { Role } from '@miftah/contracts';
import { randomUUID } from 'crypto';

@Injectable()
export class JobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // -------------------------------------------------------------
  // 1. LIST JOBS & OPERATIONAL QUEUES
  // -------------------------------------------------------------
  async listJobs(workshopId: string, query?: QueryJobsDto) {
    const where: Prisma.JobWhereInput = {
      workshopId,
      ...(query?.status ? { status: query.status } : {}),
      ...(query?.technicianUserId ? { assignedTechnicianUserId: query.technicianUserId } : {}),
    };

    if (query?.search && query.search.trim()) {
      const q = query.search.trim();
      where.OR = [
        { vehicle: { plateNumber: { contains: q, mode: 'insensitive' } } },
        { vehicle: { brand: { name: { contains: q, mode: 'insensitive' } } } },
        { vehicle: { model: { name: { contains: q, mode: 'insensitive' } } } },
        { serviceRequest: { user: { fullName: { contains: q, mode: 'insensitive' } } } },
        { serviceRequest: { user: { phoneE164: { contains: q } } } },
      ];
    }

    const jobs = await this.prisma.job.findMany({
      where,
      include: {
        vehicle: {
          include: {
            brand: { select: { name: true } },
            model: { select: { name: true } },
          },
        },
        serviceRequest: {
          include: {
            user: { select: { id: true, fullName: true, phoneE164: true } },
            service: { select: { id: true, code: true, nameAr: true, nameEn: true } },
          },
        },
        booking: {
          select: {
            id: true,
            status: true,
            confirmedStartAt: true,
            arrivedAt: true,
          },
        },
        authorizedQuoteRevision: {
          select: {
            id: true,
            revisionNumber: true,
            total: true,
            status: true,
          },
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            total: true,
            status: true,
            payment: {
              select: {
                id: true,
                status: true,
                amountDue: true,
                amountPaid: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 60,
    });

    return jobs.map((j) => this.formatJobSummary(j));
  }

  // -------------------------------------------------------------
  // 2. UNIFIED JOB CARD HUB CONTEXT
  // -------------------------------------------------------------
  async getJobCardHubContext(workshopId: string, jobId: string) {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, workshopId },
      include: {
        vehicle: {
          include: {
            brand: true,
            model: true,
          },
        },
        serviceRequest: {
          include: {
            user: true,
            service: { include: { category: true } },
            aiClassification: true,
            quoteFamily: {
              include: {
                revisions: {
                  orderBy: { revisionNumber: 'desc' },
                  include: {
                    items: {
                      orderBy: { sortOrder: 'asc' },
                      include: { service: true },
                    },
                    acceptedByUser: { select: { id: true, fullName: true } },
                  },
                },
              },
            },
          },
        },
        booking: {
          include: {
            inspections: {
              include: { findings: true },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        authorizedQuoteRevision: {
          include: {
            items: {
              include: { service: true },
            },
          },
        },
        notes: {
          orderBy: { createdAt: 'desc' },
        },
        invoice: {
          include: { payment: true },
        },
        maintenanceRecord: true,
      },
    });

    if (!job) {
      throw new NotFoundException('أمر الصيانة غير موجود أو لا يتبع لهذه الورشة');
    }

    return this.formatJobCardDetail(job);
  }

  // -------------------------------------------------------------
  // 3. ASSIGN TECHNICIAN
  // -------------------------------------------------------------
  async assignTechnician(
    workshopId: string,
    jobId: string,
    dto: AssignTechnicianDto,
    actorUserId?: string,
  ) {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, workshopId },
    });
    if (!job) throw new NotFoundException('أمر الصيانة غير موجود');

    // Verify technician is staff in this workshop
    const staff = await this.prisma.workshopStaff.findFirst({
      where: {
        workshopId,
        userId: dto.technicianUserId,
        status: 'ACTIVE',
      },
      include: { user: true },
    });
    if (!staff) {
      throw new BadRequestException('المستخدم المحدد ليس فنياً نشطاً في هذه الورشة');
    }

    const updatedJob = await this.prisma.job.update({
      where: { id: jobId },
      data: { assignedTechnicianUserId: dto.technicianUserId },
    });

    if (actorUserId) {
      await this.auditService.record({
        actorUserId,
        actorRole: Role.WORKSHOP_OWNER,
        tenantId: workshopId,
        entityType: 'Job',
        entityId: jobId,
        action: 'TECHNICIAN_ASSIGNED',
        correlationId: randomUUID(),
        metadata: {
          technicianUserId: dto.technicianUserId,
          technicianName: staff.user.fullName,
        },
      });
    }

    return updatedJob;
  }

  // -------------------------------------------------------------
  // 4. START WORK (Rule 9: Requires Approved Quote Gate)
  // -------------------------------------------------------------
  async startWork(
    workshopId: string,
    jobId: string,
    actorUserId?: string,
  ) {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, workshopId },
      include: { authorizedQuoteRevision: true },
    });
    if (!job) throw new NotFoundException('أمر الصيانة غير موجود');

    // STRICT RULE: Work execution requires Authorized / Confirmed state
    if (job.status !== JobStatus.CONFIRMED && !job.authorizedQuoteRevisionId) {
      throw new BadRequestException(
        'لا يمكن بدء تنفيذ الصيانة قبل اعتماد وموافقة العميل على عرض السعر (WAITING FOR CUSTOMER APPROVAL)',
      );
    }

    const startedAt = new Date();

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedJob = await tx.job.update({
        where: { id: jobId },
        data: {
          status: JobStatus.IN_PROGRESS,
          startedAt,
        },
      });

      await tx.booking.update({
        where: { id: job.bookingId },
        data: { status: BookingStatus.IN_PROGRESS },
      });

      return updatedJob;
    });

    if (actorUserId) {
      await this.auditService.record({
        actorUserId,
        actorRole: Role.WORKSHOP_OWNER,
        tenantId: workshopId,
        entityType: 'Job',
        entityId: jobId,
        action: 'JOB_WORK_STARTED',
        fromState: job.status,
        toState: JobStatus.IN_PROGRESS,
        correlationId: randomUUID(),
      });
    }

    return result;
  }

  // -------------------------------------------------------------
  // 5. ADD JOB NOTE
  // -------------------------------------------------------------
  async addJobNote(
    workshopId: string,
    jobId: string,
    dto: AddJobNoteDto,
    actorUserId?: string,
  ) {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, workshopId },
    });
    if (!job) throw new NotFoundException('أمر الصيانة غير موجود');

    return this.prisma.jobNote.create({
      data: {
        jobId,
        authorUserId: actorUserId || job.workshopId,
        visibility: dto.visibility || 'INTERNAL',
        body: dto.body,
      },
    });
  }

  // -------------------------------------------------------------
  // 6. ATOMIC JOB COMPLETION TRANSACTION (Rule 11)
  // -------------------------------------------------------------
  async completeJobTransaction(
    workshopId: string,
    jobId: string,
    dto?: CompleteJobDto,
    actorUserId?: string,
  ) {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, workshopId },
      include: {
        vehicle: true,
        serviceRequest: {
          include: {
            service: true,
            user: true,
          },
        },
        authorizedQuoteRevision: {
          include: { items: true },
        },
        invoice: {
          include: { payment: true },
        },
        maintenanceRecord: true,
      },
    });

    if (!job) {
      throw new NotFoundException('أمر الصيانة غير موجود');
    }

    // IDEMPOTENCY: If already completed, return existing without re-creating
    if (job.status === JobStatus.COMPLETED && job.invoice && job.maintenanceRecord) {
      return {
        job,
        invoice: job.invoice,
        payment: job.invoice.payment,
        maintenanceRecord: job.maintenanceRecord,
        isAlreadyCompleted: true,
      };
    }

    const completedAt = new Date();
    const finalMileage = dto?.finalMileage || job.vehicle.mileage || 0;

    return this.prisma.$transaction(async (tx) => {
      // 1. Update Job Status to COMPLETED
      const updatedJob = await tx.job.update({
        where: { id: jobId },
        data: {
          status: JobStatus.COMPLETED,
          completedAt,
          finalMileage,
        },
      });

      // 2. Update Booking Status to COMPLETED
      await tx.booking.update({
        where: { id: job.bookingId },
        data: { status: BookingStatus.COMPLETED },
      });

      // 3. Update Vehicle Current Mileage
      if (finalMileage > 0) {
        await tx.vehicle.update({
          where: { id: job.vehicleId },
          data: { mileage: finalMileage },
        });
      }

      // 4. Generate or Reuse Official Invoice
      let invoice: any = job.invoice;
      if (!invoice) {
        const datePrefix = completedAt.toISOString().slice(0, 7).replace('-', '');
        const randomSeq = Math.floor(1000 + Math.random() * 9000);
        const invoiceNumber = `INV-${datePrefix}-${randomSeq}`;

        const quoteRev = job.authorizedQuoteRevision;
        const subtotal = quoteRev ? quoteRev.subtotal : new Prisma.Decimal(0);
        const discount = quoteRev ? quoteRev.discount : new Prisma.Decimal(0);
        const tax = quoteRev ? quoteRev.tax : new Prisma.Decimal(0);
        const total = quoteRev ? quoteRev.total : new Prisma.Decimal(0);

        invoice = await tx.invoice.create({
          data: {
            jobId,
            workshopId,
            userId: job.serviceRequest.userId,
            vehicleId: job.vehicleId,
            invoiceNumber,
            status: InvoiceStatus.ISSUED,
            currency: 'AED',
            subtotal,
            discount,
            tax,
            total,
            issuedAt: completedAt,
            sourceQuoteRevisionId: job.authorizedQuoteRevisionId,
          },
        });
      }

      // 5. Generate Payment Record as UNPAID
      let payment: any = invoice.payment;
      if (!payment) {
        payment = await tx.payment.create({
          data: {
            invoiceId: invoice.id,
            status: PaymentStatus.UNPAID,
            amountDue: invoice.total,
            amountPaid: new Prisma.Decimal(0),
          },
        });
      }

      // 6. Generate Permanent Maintenance History Record
      let maintenanceRecord = job.maintenanceRecord;
      if (!maintenanceRecord) {
        const serviceSummary =
          job.authorizedQuoteRevision?.items.map((i) => i.description).join('، ') ||
          job.serviceRequest.service.nameAr ||
          'صيانة دورية معتمدة';

        maintenanceRecord = await tx.maintenanceRecord.create({
          data: {
            jobId,
            vehicleId: job.vehicleId,
            userId: job.serviceRequest.userId,
            workshopId,
            invoiceId: invoice.id,
            provenance: ProvenanceType.WORKSHOP_JOB,
            serviceDate: completedAt,
            mileage: finalMileage,
            totalAmount: invoice.total,
            summary: serviceSummary,
          },
        });

        // Link Service to Maintenance Record
        await tx.maintenanceRecordService.create({
          data: {
            maintenanceRecordId: maintenanceRecord.id,
            serviceId: job.serviceRequest.serviceId,
          },
        });
      }

      // 7. Audit Log
      if (actorUserId) {
        await this.auditService.record({
          actorUserId,
          actorRole: Role.WORKSHOP_OWNER,
          tenantId: workshopId,
          entityType: 'Job',
          entityId: jobId,
          action: 'JOB_COMPLETED_TRANSACTION',
          fromState: job.status,
          toState: JobStatus.COMPLETED,
          correlationId: randomUUID(),
          metadata: {
            invoiceNumber: invoice.invoiceNumber,
            total: Number(invoice.total),
            finalMileage,
          },
        });
      }

      return {
        job: updatedJob,
        invoice,
        payment,
        maintenanceRecord,
      };
    });
  }

  // -------------------------------------------------------------
  // 7. SETTLE PAYMENT
  // -------------------------------------------------------------
  async settlePayment(
    workshopId: string,
    jobId: string,
    dto: RecordPaymentDto,
    actorUserId?: string,
  ) {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, workshopId },
      include: {
        invoice: { include: { payment: true } },
      },
    });

    if (!job || !job.invoice) {
      throw new NotFoundException('فاتورة أمر الصيانة غير موجودة أو لم تصدر بعد');
    }

    if (!job.invoice.payment) {
      throw new NotFoundException('سجل السداد غير موجود');
    }

    const paidAt = new Date();

    const payment = await this.prisma.payment.update({
      where: { id: job.invoice.payment.id },
      data: {
        status: PaymentStatus.PAID,
        amountPaid: new Prisma.Decimal(dto.amount.toFixed(2)),
        paidAt,
      },
    });

    if (actorUserId) {
      await this.auditService.record({
        actorUserId,
        actorRole: Role.WORKSHOP_OWNER,
        tenantId: workshopId,
        entityType: 'Payment',
        entityId: payment.id,
        action: 'PAYMENT_SETTLED',
        fromState: PaymentStatus.UNPAID,
        toState: PaymentStatus.PAID,
        correlationId: randomUUID(),
        metadata: {
          amountPaid: dto.amount,
          notes: dto.notes,
        },
      });
    }

    return payment;
  }

  // -------------------------------------------------------------
  // FORMATTERS
  // -------------------------------------------------------------
  private formatJobSummary(j: any) {
    const nextAction = this.deriveJobNextAction(j.status, Boolean(j.authorizedQuoteRevisionId), j.invoice);

    return {
      id: j.id,
      status: j.status,
      startedAt: j.startedAt,
      completedAt: j.completedAt,
      assignedTechnicianUserId: j.assignedTechnicianUserId,
      createdAt: j.createdAt,
      customer: {
        id: j.serviceRequest.user.id,
        name: j.serviceRequest.user.fullName || 'عميل منصة مفتاح',
        phone: j.serviceRequest.user.phoneE164,
      },
      vehicle: {
        id: j.vehicle.id,
        plateNumber: j.vehicle.plateNumber,
        brand: j.vehicle.brand?.name,
        model: j.vehicle.model?.name,
      },
      service: {
        id: j.serviceRequest.service.id,
        code: j.serviceRequest.service.code,
        nameAr: j.serviceRequest.service.nameAr,
        nameEn: j.serviceRequest.service.nameEn,
      },
      authorizedQuoteRevision: j.authorizedQuoteRevision,
      invoice: j.invoice,
      nextAction,
    };
  }

  private formatJobCardDetail(j: any) {
    const summary = this.formatJobSummary(j);
    return {
      ...summary,
      fullVehicle: j.vehicle,
      fullCustomer: j.serviceRequest.user,
      fullService: j.serviceRequest.service,
      booking: j.booking,
      inspections: j.booking?.inspections || [],
      quoteFamily: j.serviceRequest.quoteFamily || null,
      notes: j.notes || [],
      maintenanceRecord: j.maintenanceRecord || null,
      timeline: this.buildJobTimeline(j),
    };
  }

  private deriveJobNextAction(
    status: JobStatus,
    hasAuthorizedQuote: boolean,
    invoice?: any,
  ) {
    if (status === JobStatus.CREATED || status === JobStatus.INSPECTION) {
      return {
        code: 'PERFORM_INSPECTION_OR_QUOTE',
        labelAr: 'الفحص الفني وتجهيز عرض السعر',
        labelEn: 'Inspection & Quote Preparation',
        priority: 'HIGH',
      };
    }

    if (status === JobStatus.AWAITING_APPROVAL) {
      return {
        code: 'WAITING_CUSTOMER_APPROVAL',
        labelAr: 'بانتظار موافقة العميل على عرض السعر',
        labelEn: 'Waiting Customer Approval',
        priority: 'HIGH',
      };
    }

    if (status === JobStatus.CONFIRMED) {
      return {
        code: 'START_AUTHORIZED_WORK',
        labelAr: 'العرض معتمد — إسناد الفني وبدء الصيانة',
        labelEn: 'Quote Approved — Start Work',
        priority: 'HIGH',
      };
    }

    if (status === JobStatus.IN_PROGRESS) {
      return {
        code: 'COMPLETE_WORK_AND_INVOICE',
        labelAr: 'الصيانة قيد التنفيذ — إنهاء العمل وإصدار الفاتورة',
        labelEn: 'Work In Progress — Complete & Issue Invoice',
        priority: 'HIGH',
      };
    }

    if (status === JobStatus.COMPLETED) {
      if (invoice?.payment?.status === PaymentStatus.UNPAID) {
        return {
          code: 'SETTLE_PAYMENT',
          labelAr: 'الصيانة مكتملة — بانتظار تحصيل المبلغ وسداد الفاتورة',
          labelEn: 'Completed — Collect Payment',
          priority: 'NORMAL',
        };
      }
      return {
        code: 'DELIVERED_AND_REVIEW',
        labelAr: 'تمت الصيانة والسداد بنجاح — مؤهل للتقييم',
        labelEn: 'Completed & Paid — Review Eligible',
        priority: 'LOW',
      };
    }

    return {
      code: 'STATUS_VIEW',
      labelAr: 'أمر الصيانة نشط',
      labelEn: 'Active Job',
      priority: 'NORMAL',
    };
  }

  private buildJobTimeline(j: any) {
    const timeline = [];

    if (j.createdAt) {
      timeline.push({
        event: 'JOB_CREATED',
        titleAr: 'فتح كرت أمر الصيانة',
        timestamp: j.createdAt,
      });
    }

    if (j.booking?.arrivedAt) {
      timeline.push({
        event: 'VEHICLE_ARRIVED',
        titleAr: 'استلام المركبة وتوثيق العداد',
        timestamp: j.booking.arrivedAt,
      });
    }

    if (j.authorizedQuoteRevision) {
      timeline.push({
        event: 'QUOTE_AUTHORIZED',
        titleAr: `اعتماد عرض السعر (إصدار #${j.authorizedQuoteRevision.revisionNumber}) من قبل العميل`,
        timestamp: j.authorizedQuoteRevision.acceptedAt || j.updatedAt,
      });
    }

    if (j.startedAt) {
      timeline.push({
        event: 'WORK_STARTED',
        titleAr: 'بدء تنفيذ الصيانة الميدانية',
        timestamp: j.startedAt,
      });
    }

    if (j.completedAt) {
      timeline.push({
        event: 'JOB_COMPLETED',
        titleAr: 'اكتمال أعمال الصيانة وإصدار الفاتورة الرسمية',
        timestamp: j.completedAt,
      });
    }

    if (j.invoice?.payment?.status === PaymentStatus.PAID) {
      timeline.push({
        event: 'PAYMENT_SETTLED',
        titleAr: 'سداد الفاتورة بالكامل وتوثيق السجل الدائم',
        timestamp: j.invoice.payment.paidAt || j.invoice.issuedAt,
      });
    }

    return timeline;
  }
}
