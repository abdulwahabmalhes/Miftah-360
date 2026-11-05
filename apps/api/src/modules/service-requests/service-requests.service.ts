import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateServiceRequestDto,
  AcceptServiceRequestDto,
  RejectServiceRequestDto,
  ProposeTimeDto,
  QueryServiceRequestsDto,
} from './dto/service-requests.dto';
import {
  ServiceRequestStatus,
  BookingStatus,
  Prisma,
} from '@prisma/client';
import { Role } from '@miftah/contracts';
import { randomUUID } from 'crypto';

@Injectable()
export class ServiceRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // -------------------------------------------------------------
  // WORKSHOP QUERIES & ACTIONS
  // -------------------------------------------------------------
  async listWorkshopRequests(
    workshopId: string,
    query?: QueryServiceRequestsDto,
  ) {
    const where: Prisma.ServiceRequestWhereInput = {
      workshopId,
      ...(query?.status ? { status: query.status } : {}),
    };

    if (query?.search && query.search.trim()) {
      const q = query.search.trim();
      where.OR = [
        { user: { fullName: { contains: q, mode: 'insensitive' } } },
        { user: { phoneE164: { contains: q } } },
        { vehicle: { plateNumber: { contains: q, mode: 'insensitive' } } },
        { vehicle: { brand: { name: { contains: q, mode: 'insensitive' } } } },
        { vehicle: { model: { name: { contains: q, mode: 'insensitive' } } } },
        { service: { nameAr: { contains: q } } },
        { service: { nameEn: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const requests = await this.prisma.serviceRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            phoneE164: true,
            email: true,
            preferredLanguage: true,
          },
        },
        vehicle: {
          include: {
            brand: { select: { id: true, name: true } },
            model: { select: { id: true, name: true } },
          },
        },
        service: {
          include: {
            category: { select: { id: true, code: true, nameAr: true, nameEn: true } },
          },
        },
        aiClassification: true,
        booking: {
          select: {
            id: true,
            status: true,
            requestedStartAt: true,
            proposedStartAt: true,
            confirmedStartAt: true,
            arrivedAt: true,
          },
        },
        jobs: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return requests.map((r) => this.formatRequestSummary(r));
  }

  async getWorkshopRequestById(workshopId: string, requestId: string) {
    const request = await this.prisma.serviceRequest.findFirst({
      where: { id: requestId, workshopId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            phoneE164: true,
            email: true,
            preferredLanguage: true,
          },
        },
        vehicle: {
          include: {
            brand: { select: { id: true, name: true } },
            model: { select: { id: true, name: true } },
          },
        },
        service: {
          include: {
            category: { select: { id: true, code: true, nameAr: true, nameEn: true } },
          },
        },
        aiClassification: true,
        booking: {
          include: {
            job: {
              select: {
                id: true,
                status: true,
                startedAt: true,
                completedAt: true,
              },
            },
          },
        },
        quoteFamily: {
          include: {
            revisions: {
              orderBy: { revisionNumber: 'desc' },
              include: { items: true },
            },
          },
        },
        jobs: {
          select: {
            id: true,
            status: true,
            startedAt: true,
            completedAt: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('طلب الخدمة غير موجود أو لا يتبع لهذه الورشة');
    }

    return this.formatRequestDetail(request);
  }

  async acceptRequest(
    workshopId: string,
    requestId: string,
    dto: AcceptServiceRequestDto,
    actorUserId?: string,
  ) {
    const request = await this.prisma.serviceRequest.findFirst({
      where: { id: requestId, workshopId },
      include: { booking: true },
    });

    if (!request) {
      throw new NotFoundException('طلب الخدمة غير موجود');
    }

    if (
      request.status !== ServiceRequestStatus.SUBMITTED &&
      request.status !== ServiceRequestStatus.DRAFT
    ) {
      throw new BadRequestException(
        `لا يمكن قبول الطلب وهو في حالة: ${request.status}`,
      );
    }

    const confirmedStartAt = dto.confirmedDatetime
      ? new Date(dto.confirmedDatetime)
      : request.preferredDatetime;

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Update Request
      const updatedRequest = await tx.serviceRequest.update({
        where: { id: requestId },
        data: {
          status: ServiceRequestStatus.ACCEPTED,
        },
      });

      // 2. Upsert Booking to CONFIRMED
      let booking;
      if (request.booking) {
        booking = await tx.booking.update({
          where: { id: request.booking.id },
          data: {
            status: BookingStatus.CONFIRMED,
            confirmedStartAt,
          },
        });
      } else {
        booking = await tx.booking.create({
          data: {
            serviceRequestId: requestId,
            workshopId,
            userId: request.userId,
            status: BookingStatus.CONFIRMED,
            requestedStartAt: request.preferredDatetime,
            confirmedStartAt,
          },
        });
      }

      return { request: updatedRequest, booking };
    });

    if (actorUserId) {
      await this.auditService.record({
        actorUserId,
        actorRole: Role.WORKSHOP_OWNER,
        tenantId: workshopId,
        entityType: 'ServiceRequest',
        entityId: requestId,
        action: 'REQUEST_ACCEPTED',
        fromState: request.status,
        toState: ServiceRequestStatus.ACCEPTED,
        correlationId: randomUUID(),
      });
    }

    return result;
  }

  async rejectRequest(
    workshopId: string,
    requestId: string,
    dto: RejectServiceRequestDto,
    actorUserId?: string,
  ) {
    const request = await this.prisma.serviceRequest.findFirst({
      where: { id: requestId, workshopId },
      include: { booking: true },
    });

    if (!request) {
      throw new NotFoundException('طلب الخدمة غير موجود');
    }

    if (request.status === ServiceRequestStatus.CLOSED) {
      throw new BadRequestException('لا يمكن رفض طلب مغلق مسبقاً');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedRequest = await tx.serviceRequest.update({
        where: { id: requestId },
        data: {
          status: ServiceRequestStatus.REJECTED,
        },
      });

      if (request.booking) {
        await tx.booking.update({
          where: { id: request.booking.id },
          data: {
            status: BookingStatus.CANCELLED,
            cancelledAt: new Date(),
            cancellationReason: dto.reason,
          },
        });
      }

      return updatedRequest;
    });

    if (actorUserId) {
      await this.auditService.record({
        actorUserId,
        actorRole: Role.WORKSHOP_OWNER,
        tenantId: workshopId,
        entityType: 'ServiceRequest',
        entityId: requestId,
        action: 'REQUEST_REJECTED',
        fromState: request.status,
        toState: ServiceRequestStatus.REJECTED,
        correlationId: randomUUID(),
        metadata: { reason: dto.reason },
      });
    }

    return result;
  }

  async proposeTime(
    workshopId: string,
    requestId: string,
    dto: ProposeTimeDto,
    actorUserId?: string,
  ) {
    const request = await this.prisma.serviceRequest.findFirst({
      where: { id: requestId, workshopId },
      include: { booking: true },
    });

    if (!request) {
      throw new NotFoundException('طلب الخدمة غير موجود');
    }

    const proposedDate = new Date(dto.proposedDatetime);

    const booking = await this.prisma.$transaction(async (tx) => {
      if (request.booking) {
        return tx.booking.update({
          where: { id: request.booking.id },
          data: {
            status: BookingStatus.TIME_PROPOSED,
            proposedStartAt: proposedDate,
          },
        });
      } else {
        return tx.booking.create({
          data: {
            serviceRequestId: requestId,
            workshopId,
            userId: request.userId,
            status: BookingStatus.TIME_PROPOSED,
            requestedStartAt: request.preferredDatetime,
            proposedStartAt: proposedDate,
          },
        });
      }
    });

    if (actorUserId) {
      await this.auditService.record({
        actorUserId,
        actorRole: Role.WORKSHOP_OWNER,
        tenantId: workshopId,
        entityType: 'Booking',
        entityId: booking.id,
        action: 'TIME_PROPOSED',
        correlationId: randomUUID(),
        metadata: {
          proposedDatetime: dto.proposedDatetime,
          notes: dto.notes,
        },
      });
    }

    return { request, booking };
  }

  // -------------------------------------------------------------
  // CAR OWNER ACTIONS
  // -------------------------------------------------------------
  async createRequest(userId: string, dto: CreateServiceRequestDto) {
    // 1. Verify vehicle belongs to user
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: dto.vehicleId, ownerUserId: userId },
    });
    if (!vehicle) {
      throw new NotFoundException('المركبة غير مسجلة للمستخدم الحالي');
    }

    // 2. Verify workshop exists & active
    const workshop = await this.prisma.workshop.findUnique({
      where: { id: dto.workshopId },
    });
    if (!workshop || workshop.status !== 'ACTIVE') {
      throw new BadRequestException('الورشة المستهدفة غير متاحة لاستقبال الطلبات حالياً');
    }

    // 3. Verify service exists
    const service = await this.prisma.service.findUnique({
      where: { id: dto.serviceId },
    });
    if (!service) {
      throw new NotFoundException('الخدمة المطلوبة غير متوفرة');
    }

    const preferredDate = new Date(dto.preferredDatetime);

    return this.prisma.$transaction(async (tx) => {
      const serviceRequest = await tx.serviceRequest.create({
        data: {
          userId,
          vehicleId: dto.vehicleId,
          workshopId: dto.workshopId,
          serviceId: dto.serviceId,
          issueSummary: dto.issueSummary || 'طلب صيانة دورية / فحص للمركبة',
          preferredDatetime: preferredDate,
          emirate: dto.emirate,
          status: ServiceRequestStatus.SUBMITTED,
        },
      });

      const booking = await tx.booking.create({
        data: {
          serviceRequestId: serviceRequest.id,
          workshopId: dto.workshopId,
          userId,
          status: BookingStatus.PENDING,
          requestedStartAt: preferredDate,
        },
      });

      return {
        ...serviceRequest,
        booking,
      };
    });
  }

  async listCustomerRequests(userId: string) {
    return this.prisma.serviceRequest.findMany({
      where: { userId },
      include: {
        workshop: {
          select: {
            id: true,
            displayNameAr: true,
            displayNameEn: true,
            primaryPhone: true,
            emirate: true,
          },
        },
        vehicle: {
          include: {
            brand: { select: { name: true } },
            model: { select: { name: true } },
          },
        },
        service: true,
        booking: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // -------------------------------------------------------------
  // FORMATTERS & NEXT ACTION RESOLVER
  // -------------------------------------------------------------
  private formatRequestSummary(r: any) {
    const nextAction = this.deriveNextAction(r.status, r.booking?.status);

    return {
      id: r.id,
      status: r.status,
      issueSummary: r.issueSummary,
      preferredDatetime: r.preferredDatetime,
      emirate: r.emirate,
      createdAt: r.createdAt,
      customer: {
        id: r.user.id,
        name: r.user.fullName || 'عميل منصة مفتاح',
        phone: r.user.phoneE164,
        email: r.user.email,
      },
      vehicle: {
        id: r.vehicle.id,
        plateNumber: r.vehicle.plateNumber,
        brand: r.vehicle.brand?.name,
        model: r.vehicle.model?.name,
        year: r.vehicle.year,
        mileage: r.vehicle.mileage,
      },
      service: {
        id: r.service.id,
        code: r.service.code,
        nameAr: r.service.nameAr,
        nameEn: r.service.nameEn,
        category: r.service.category?.nameAr || r.service.category?.code,
      },
      booking: r.booking,
      hasActiveJob: Boolean(r.jobs && r.jobs.length > 0),
      jobId: r.jobs?.[0]?.id || null,
      nextAction,
    };
  }

  private formatRequestDetail(r: any) {
    const summary = this.formatRequestSummary(r);
    return {
      ...summary,
      aiSummary: r.aiClassification?.issueSummary || null,
      riskLevel: r.aiClassification?.riskLevel || 'NORMAL',
      quoteFamily: r.quoteFamily || null,
      timeline: this.buildRequestTimeline(r),
    };
  }

  private deriveNextAction(requestStatus: ServiceRequestStatus, bookingStatus?: BookingStatus): {
    code: string;
    labelAr: string;
    labelEn: string;
    priority: 'HIGH' | 'NORMAL' | 'LOW';
  } {
    if (requestStatus === ServiceRequestStatus.SUBMITTED) {
      return {
        code: 'ACCEPT_OR_PROPOSE_TIME',
        labelAr: 'قبول الطلب أو اقتراح موعد بديل',
        labelEn: 'Accept Request or Propose Time',
        priority: 'HIGH',
      };
    }

    if (bookingStatus === BookingStatus.TIME_PROPOSED) {
      return {
        code: 'WAITING_CUSTOMER_TIME_CONFIRMATION',
        labelAr: 'بانتظار موافقة العميل على الموعد المقترح',
        labelEn: 'Waiting for Customer Time Confirmation',
        priority: 'NORMAL',
      };
    }

    if (bookingStatus === BookingStatus.CONFIRMED) {
      return {
        code: 'AWAITING_VEHICLE_ARRIVAL',
        labelAr: 'الموعد مؤكد — بانتظار وصول المركبة للورشة',
        labelEn: 'Confirmed — Awaiting Vehicle Arrival',
        priority: 'NORMAL',
      };
    }

    if (bookingStatus === BookingStatus.VEHICLE_ARRIVED) {
      return {
        code: 'START_INSPECTION_OR_QUOTE',
        labelAr: 'السيارة في الورشة — مطلوب بدء الفحص الفني أو تجهيز عرض السعر',
        labelEn: 'Vehicle Arrived — Start Inspection or Prepare Quote',
        priority: 'HIGH',
      };
    }

    if (requestStatus === ServiceRequestStatus.REJECTED) {
      return {
        code: 'REQUEST_REJECTED',
        labelAr: 'تم رفض الطلب',
        labelEn: 'Request Rejected',
        priority: 'LOW',
      };
    }

    return {
      code: 'IN_PROGRESS',
      labelAr: 'الطلب قيد المتابعة والتشغيل',
      labelEn: 'In Progress',
      priority: 'NORMAL',
    };
  }

  private buildRequestTimeline(r: any) {
    const timeline = [];

    timeline.push({
      event: 'REQUEST_SUBMITTED',
      titleAr: 'تم تقديم طلب الصيانة',
      timestamp: r.createdAt,
      detail: `موعد مفضل: ${new Date(r.preferredDatetime).toLocaleString('ar-AE')}`,
    });

    if (r.status === ServiceRequestStatus.ACCEPTED) {
      timeline.push({
        event: 'REQUEST_ACCEPTED',
        titleAr: 'تم قبول الطلب من الورشة',
        timestamp: r.updatedAt,
        detail: r.booking?.confirmedStartAt
          ? `موعد مؤكد: ${new Date(r.booking.confirmedStartAt).toLocaleString('ar-AE')}`
          : 'بانتظار تأكيد الموعد',
      });
    }

    if (r.booking?.status === BookingStatus.TIME_PROPOSED && r.booking.proposedStartAt) {
      timeline.push({
        event: 'TIME_PROPOSED',
        titleAr: 'اقترحت الورشة موعداً بديلاً',
        timestamp: r.booking.updatedAt,
        detail: `الموعد المقترح: ${new Date(r.booking.proposedStartAt).toLocaleString('ar-AE')}`,
      });
    }

    if (r.booking?.status === BookingStatus.VEHICLE_ARRIVED && r.booking.arrivedAt) {
      timeline.push({
        event: 'VEHICLE_ARRIVED',
        titleAr: 'وصلت المركبة إلى الورشة',
        timestamp: r.booking.arrivedAt,
        detail: 'تم استلام المركبة وتوثيق العداد وحالة الهيكل',
      });
    }

    if (r.status === ServiceRequestStatus.REJECTED) {
      timeline.push({
        event: 'REQUEST_REJECTED',
        titleAr: 'اعتذرت الورشة عن قبول الطلب',
        timestamp: r.updatedAt,
      });
    }

    return timeline;
  }
}
