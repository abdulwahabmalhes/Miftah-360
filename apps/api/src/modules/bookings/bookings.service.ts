import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CheckInVehicleDto,
  ConfirmBookingDto,
  MarkNoShowDto,
  CancelBookingDto,
  AcceptProposedTimeDto,
  QueryBookingsDto,
} from './dto/bookings.dto';
import {
  BookingStatus,
  JobStatus,
  InspectionStatus,
  ServiceRequestStatus,
  Prisma,
  InspectionPolicy,
} from '@prisma/client';
import { Role } from '@miftah/contracts';
import { randomUUID } from 'crypto';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // -------------------------------------------------------------
  // WORKSHOP ACTIONS
  // -------------------------------------------------------------
  async listWorkshopBookings(workshopId: string, query?: QueryBookingsDto) {
    const where: Prisma.BookingWhereInput = {
      workshopId,
      ...(query?.status ? { status: query.status } : {}),
    };

    if (query?.date) {
      const startOfDay = new Date(`${query.date}T00:00:00.000Z`);
      const endOfDay = new Date(`${query.date}T23:59:59.999Z`);
      where.OR = [
        { confirmedStartAt: { gte: startOfDay, lte: endOfDay } },
        { requestedStartAt: { gte: startOfDay, lte: endOfDay } },
      ];
    }

    if (query?.search && query.search.trim()) {
      const q = query.search.trim();
      where.serviceRequest = {
        OR: [
          { user: { fullName: { contains: q, mode: 'insensitive' } } },
          { user: { phoneE164: { contains: q } } },
          { vehicle: { plateNumber: { contains: q, mode: 'insensitive' } } },
          { vehicle: { brand: { name: { contains: q, mode: 'insensitive' } } } },
        ],
      };
    }

    const bookings = await this.prisma.booking.findMany({
      where,
      include: {
        serviceRequest: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                phoneE164: true,
                email: true,
              },
            },
            vehicle: {
              include: {
                brand: { select: { name: true } },
                model: { select: { name: true } },
              },
            },
            service: {
              include: {
                category: { select: { code: true, nameAr: true, nameEn: true } },
              },
            },
          },
        },
        job: {
          select: {
            id: true,
            status: true,
            startedAt: true,
            completedAt: true,
            assignedTechnicianUserId: true,
          },
        },
        inspections: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: [
        { confirmedStartAt: 'asc' },
        { requestedStartAt: 'asc' },
        { createdAt: 'desc' },
      ],
      take: 60,
    });

    return bookings.map((b) => this.formatBookingSummary(b));
  }

  async getWorkshopBookingById(workshopId: string, bookingId: string) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, workshopId },
      include: {
        serviceRequest: {
          include: {
            user: true,
            vehicle: {
              include: {
                brand: true,
                model: true,
              },
            },
            service: {
              include: {
                category: true,
              },
            },
            aiClassification: true,
          },
        },
        job: {
          include: {
            notes: { orderBy: { createdAt: 'desc' } },
            authorizedQuoteRevision: {
              include: { items: true },
            },
          },
        },
        inspections: {
          include: {
            findings: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('الحجز غير موجود أو لا يتبع لهذه الورشة');
    }

    return this.formatBookingDetail(booking);
  }

  async confirmBooking(
    workshopId: string,
    bookingId: string,
    dto: ConfirmBookingDto,
    actorUserId?: string,
  ) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, workshopId },
      include: { serviceRequest: true },
    });

    if (!booking) {
      throw new NotFoundException('الحجز غير موجود');
    }

    if (
      booking.status !== BookingStatus.PENDING &&
      booking.status !== BookingStatus.ACCEPTED &&
      booking.status !== BookingStatus.TIME_PROPOSED
    ) {
      throw new BadRequestException(
        `لا يمكن تأكيد الحجز وهو بالحالة الحالية: ${booking.status}`,
      );
    }

    const confirmedStartAt = dto.startAt
      ? new Date(dto.startAt)
      : booking.proposedStartAt || booking.requestedStartAt;

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CONFIRMED,
          confirmedStartAt,
        },
      });

      await tx.serviceRequest.update({
        where: { id: booking.serviceRequestId },
        data: { status: ServiceRequestStatus.ACCEPTED },
      });

      return updatedBooking;
    });

    if (actorUserId) {
      await this.auditService.record({
        actorUserId,
        actorRole: Role.WORKSHOP_OWNER,
        tenantId: workshopId,
        entityType: 'Booking',
        entityId: bookingId,
        action: 'BOOKING_CONFIRMED',
        fromState: booking.status,
        toState: BookingStatus.CONFIRMED,
        correlationId: randomUUID(),
        metadata: { confirmedStartAt },
      });
    }

    return result;
  }

  async checkInVehicle(
    workshopId: string,
    bookingId: string,
    dto: CheckInVehicleDto,
    actorUserId?: string,
  ) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, workshopId },
      include: {
        serviceRequest: {
          include: {
            service: true,
            vehicle: true,
          },
        },
        job: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('الحجز غير موجود');
    }

    if (
      booking.status !== BookingStatus.CONFIRMED &&
      booking.status !== BookingStatus.ACCEPTED
    ) {
      throw new BadRequestException(
        `لا يمكن تسجيل وصول المركبة إلا بعد تأكيد الحجز (الحالة الحالية: ${booking.status})`,
      );
    }

    const arrivalTime = new Date();

    return this.prisma.$transaction(async (tx) => {
      // 1. Update Booking Status
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.VEHICLE_ARRIVED,
          arrivedAt: arrivalTime,
        },
      });

      // 2. Update Vehicle Odometer
      await tx.vehicle.update({
        where: { id: booking.serviceRequest.vehicleId },
        data: { mileage: dto.arrivalMileage },
      });

      // 3. Determine Initial Job Status based on Taxonomy Policy
      const inspectionPolicy =
        booking.serviceRequest.service.inspectionPolicy ||
        InspectionPolicy.CONDITIONAL;

      const initialJobStatus =
        inspectionPolicy === InspectionPolicy.REQUIRED
          ? JobStatus.INSPECTION
          : JobStatus.CREATED;

      // 4. Create or Update Canonical Job Card Hub
      let job = booking.job;
      if (!job) {
        job = await tx.job.create({
          data: {
            bookingId,
            serviceRequestId: booking.serviceRequestId,
            workshopId,
            vehicleId: booking.serviceRequest.vehicleId,
            status: initialJobStatus,
          },
        });
      } else {
        job = await tx.job.update({
          where: { id: job.id },
          data: { status: initialJobStatus },
        });
      }

      // 5. Append Check-in Observation Note
      const noteBody = [
        `[استلام المركبة / Vehicle Check-in]`,
        `العداد عند الوصول: ${dto.arrivalMileage.toLocaleString()} كم`,
        dto.fuelLevel ? `مستوى الوقود: ${dto.fuelLevel}` : null,
        dto.conditionNotes ? `ملاحظات الهيكل: ${dto.conditionNotes}` : null,
        dto.handoverNotes ? `تسليم المفتاح والأغراض: ${dto.handoverNotes}` : null,
      ]
        .filter(Boolean)
        .join(' | ');

      await tx.jobNote.create({
        data: {
          jobId: job.id,
          authorUserId: actorUserId || booking.userId,
          visibility: 'INTERNAL',
          body: noteBody,
        },
      });

      // 6. If Inspection is REQUIRED, automatically initialize Inspection entity
      let inspection = null;
      if (inspectionPolicy === InspectionPolicy.REQUIRED) {
        inspection = await tx.inspection.create({
          data: {
            bookingId,
            jobId: job.id,
            status: InspectionStatus.NOT_STARTED,
            createdByUserId: actorUserId || booking.userId,
          },
        });
      }

      if (actorUserId) {
        await this.auditService.record({
          actorUserId,
          actorRole: Role.WORKSHOP_OWNER,
          tenantId: workshopId,
          entityType: 'Booking',
          entityId: bookingId,
          action: 'VEHICLE_CHECK_IN',
          fromState: booking.status,
          toState: BookingStatus.VEHICLE_ARRIVED,
          correlationId: randomUUID(),
          metadata: {
            arrivalMileage: dto.arrivalMileage,
            jobId: job.id,
            initialJobStatus,
          },
        });
      }

      return {
        booking: updatedBooking,
        job,
        inspection,
      };
    });
  }

  async markNoShow(
    workshopId: string,
    bookingId: string,
    dto: MarkNoShowDto,
    actorUserId?: string,
  ) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, workshopId },
    });

    if (!booking) {
      throw new NotFoundException('الحجز غير موجود');
    }

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException('يمكن تسجيل التخلف (No-Show) للحجوزات المؤكدة فقط');
    }

    const noShowAt = new Date();

    const result = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.NO_SHOW,
        noShowAt,
      },
    });

    if (actorUserId) {
      await this.auditService.record({
        actorUserId,
        actorRole: Role.WORKSHOP_OWNER,
        tenantId: workshopId,
        entityType: 'Booking',
        entityId: bookingId,
        action: 'BOOKING_NO_SHOW',
        fromState: booking.status,
        toState: BookingStatus.NO_SHOW,
        correlationId: randomUUID(),
        metadata: { notes: dto.notes },
      });
    }

    return result;
  }

  async cancelBooking(
    workshopId: string,
    bookingId: string,
    dto: CancelBookingDto,
    actorUserId?: string,
  ) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, workshopId },
    });

    if (!booking) {
      throw new NotFoundException('الحجز غير موجود');
    }

    if (
      booking.status === BookingStatus.COMPLETED ||
      booking.status === BookingStatus.VEHICLE_ARRIVED ||
      booking.status === BookingStatus.IN_PROGRESS
    ) {
      throw new BadRequestException(
        `لا يمكن إلغاء الحجز بعد وصول المركبة أو بدء الصيانة (الحالة: ${booking.status})`,
      );
    }

    const cancelledAt = new Date();

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CANCELLED,
          cancelledAt,
          cancellationReason: dto.reason,
        },
      });

      await tx.serviceRequest.update({
        where: { id: booking.serviceRequestId },
        data: { status: ServiceRequestStatus.CANCELLED },
      });

      return updatedBooking;
    });

    if (actorUserId) {
      await this.auditService.record({
        actorUserId,
        actorRole: Role.WORKSHOP_OWNER,
        tenantId: workshopId,
        entityType: 'Booking',
        entityId: bookingId,
        action: 'BOOKING_CANCELLED',
        fromState: booking.status,
        toState: BookingStatus.CANCELLED,
        correlationId: randomUUID(),
        metadata: { reason: dto.reason },
      });
    }

    return result;
  }

  // -------------------------------------------------------------
  // CAR OWNER ACTIONS
  // -------------------------------------------------------------
  async acceptProposedTime(
    userId: string,
    bookingId: string,
    dto?: AcceptProposedTimeDto,
  ) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, userId },
      include: { serviceRequest: true },
    });

    if (!booking) {
      throw new NotFoundException('الحجز غير موجود لهذا المستخدم');
    }

    if (booking.status !== BookingStatus.TIME_PROPOSED || !booking.proposedStartAt) {
      throw new BadRequestException('لا يوجد موعد بديل بانتظار الموافقة لهذا الحجز');
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CONFIRMED,
          confirmedStartAt: booking.proposedStartAt,
        },
      });

      await tx.serviceRequest.update({
        where: { id: booking.serviceRequestId },
        data: { status: ServiceRequestStatus.ACCEPTED },
      });

      return updatedBooking;
    });
  }

  // -------------------------------------------------------------
  // FORMATTERS
  // -------------------------------------------------------------
  private formatBookingSummary(b: any) {
    const sr = b.serviceRequest;
    const nextAction = this.deriveBookingNextAction(b.status);

    return {
      id: b.id,
      status: b.status,
      requestedStartAt: b.requestedStartAt,
      proposedStartAt: b.proposedStartAt,
      confirmedStartAt: b.confirmedStartAt,
      arrivedAt: b.arrivedAt,
      serviceRequestId: b.serviceRequestId,
      customer: {
        id: sr.user.id,
        name: sr.user.fullName || 'عميل منصة مفتاح',
        phone: sr.user.phoneE164,
        email: sr.user.email,
      },
      vehicle: {
        id: sr.vehicle.id,
        plateNumber: sr.vehicle.plateNumber,
        brand: sr.vehicle.brand?.name,
        model: sr.vehicle.model?.name,
        year: sr.vehicle.year,
        mileage: sr.vehicle.mileage,
      },
      service: {
        id: sr.service.id,
        code: sr.service.code,
        nameAr: sr.service.nameAr,
        nameEn: sr.service.nameEn,
        category: sr.service.category?.nameAr || sr.service.category?.code,
      },
      job: b.job,
      inspectionsCount: b.inspections?.length || 0,
      nextAction,
    };
  }

  private formatBookingDetail(b: any) {
    const summary = this.formatBookingSummary(b);
    return {
      ...summary,
      fullJob: b.job,
      inspections: b.inspections,
    };
  }

  private deriveBookingNextAction(status: BookingStatus) {
    switch (status) {
      case BookingStatus.PENDING:
      case BookingStatus.ACCEPTED:
        return {
          code: 'CONFIRM_BOOKING',
          labelAr: 'تأكيد الموعد النهائي',
          labelEn: 'Confirm Appointment Time',
          priority: 'HIGH',
        };
      case BookingStatus.TIME_PROPOSED:
        return {
          code: 'WAITING_USER_APPROVAL',
          labelAr: 'بانتظار موافقة العميل على الموعد المقترح',
          labelEn: 'Awaiting Customer Approval',
          priority: 'NORMAL',
        };
      case BookingStatus.CONFIRMED:
        return {
          code: 'CHECK_IN_VEHICLE',
          labelAr: 'تسجيل وصول المركبة واستلام المفتاح',
          labelEn: 'Check In Vehicle & Record Mileage',
          priority: 'HIGH',
        };
      case BookingStatus.VEHICLE_ARRIVED:
        return {
          code: 'PROCEED_TO_JOB_CARD',
          labelAr: 'المركبة في الورشة — فتح كرت الصيانة وبدء الفحص',
          labelEn: 'Vehicle In Workshop — Open Job Card Hub',
          priority: 'HIGH',
        };
      case BookingStatus.NO_SHOW:
        return {
          code: 'CLIENT_NO_SHOW',
          labelAr: 'تخلف العميل عن الحضور',
          labelEn: 'Client No Show',
          priority: 'LOW',
        };
      case BookingStatus.CANCELLED:
        return {
          code: 'CANCELLED',
          labelAr: 'الحجز ملغى',
          labelEn: 'Cancelled',
          priority: 'LOW',
        };
      default:
        return {
          code: 'IN_SERVICE',
          labelAr: 'المركبة قيد الصيانة بالورشة',
          labelEn: 'In Service',
          priority: 'NORMAL',
        };
    }
  }
}
