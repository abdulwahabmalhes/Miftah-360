import { ServiceRequestsService } from '../../apps/api/src/modules/service-requests/service-requests.service';
import { BookingsService } from '../../apps/api/src/modules/bookings/bookings.service';
import {
  ServiceRequestStatus,
  BookingStatus,
  JobStatus,
  InspectionPolicy,
  Emirate,
} from '@prisma/client';

describe('Core Service Journey - Phase A: Service Requests & Bookings (E2E Verification)', () => {
  let serviceRequestsService: ServiceRequestsService;
  let bookingsService: BookingsService;
  let mockPrisma: any;
  let mockAudit: any;

  const workshopId = '61ee4a0f-8a4d-4d1a-bb75-4d75d058c228';
  const customerId = 'cust-user-12345';
  const vehicleId = 'veh-land-cruiser-2023';
  const serviceId = 'srv-major-maintenance-40k';
  const requestId = 'req-778899';
  const bookingId = 'book-112233';

  beforeEach(() => {
    mockAudit = {
      record: jest.fn().mockResolvedValue({ id: 'audit-log-uuid' }),
    };

    mockPrisma = {
      $transaction: jest.fn(async (cb) => cb(mockPrisma)),
      serviceRequest: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      booking: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      vehicle: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      workshop: {
        findUnique: jest.fn(),
      },
      service: {
        findUnique: jest.fn(),
      },
      job: {
        create: jest.fn(),
        update: jest.fn(),
      },
      jobNote: {
        create: jest.fn(),
      },
      inspection: {
        create: jest.fn(),
      },
    };

    serviceRequestsService = new ServiceRequestsService(mockPrisma, mockAudit);
    bookingsService = new BookingsService(mockPrisma, mockAudit);
  });

  it('1. Customer creates direct Service Request targeting workshop', async () => {
    mockPrisma.vehicle.findFirst.mockResolvedValue({
      id: vehicleId,
      ownerUserId: customerId,
    });
    mockPrisma.workshop.findUnique.mockResolvedValue({
      id: workshopId,
      status: 'ACTIVE',
    });
    mockPrisma.service.findUnique.mockResolvedValue({
      id: serviceId,
      nameAr: 'صيانة كبرى 40,000 كم',
      inspectionPolicy: InspectionPolicy.REQUIRED,
    });

    const prefDate = '2026-11-10T09:00:00.000Z';
    mockPrisma.serviceRequest.create.mockResolvedValue({
      id: requestId,
      userId: customerId,
      vehicleId,
      workshopId,
      serviceId,
      status: ServiceRequestStatus.SUBMITTED,
      preferredDatetime: new Date(prefDate),
      emirate: Emirate.DUBAI,
      issueSummary: 'صيانة دورية وتغيير الفحمات',
    });

    mockPrisma.booking.create.mockResolvedValue({
      id: bookingId,
      serviceRequestId: requestId,
      workshopId,
      userId: customerId,
      status: BookingStatus.PENDING,
      requestedStartAt: new Date(prefDate),
    });

    const result = await serviceRequestsService.createRequest(customerId, {
      vehicleId,
      workshopId,
      serviceId,
      preferredDatetime: prefDate,
      emirate: Emirate.DUBAI,
      issueSummary: 'صيانة دورية وتغيير الفحمات',
    });

    expect(result.id).toBe(requestId);
    expect(result.status).toBe(ServiceRequestStatus.SUBMITTED);
    expect(result.booking.status).toBe(BookingStatus.PENDING);
  });

  it('2. Workshop accepts request -> Booking becomes CONFIRMED', async () => {
    mockPrisma.serviceRequest.findFirst.mockResolvedValue({
      id: requestId,
      workshopId,
      userId: customerId,
      status: ServiceRequestStatus.SUBMITTED,
      preferredDatetime: new Date('2026-11-10T09:00:00.000Z'),
      booking: {
        id: bookingId,
        status: BookingStatus.PENDING,
      },
    });

    mockPrisma.serviceRequest.update.mockResolvedValue({
      id: requestId,
      status: ServiceRequestStatus.ACCEPTED,
    });

    mockPrisma.booking.update.mockResolvedValue({
      id: bookingId,
      status: BookingStatus.CONFIRMED,
      confirmedStartAt: new Date('2026-11-10T09:00:00.000Z'),
    });

    const res = await serviceRequestsService.acceptRequest(
      workshopId,
      requestId,
      {},
      'owner-user-id',
    );

    expect(res.request.status).toBe(ServiceRequestStatus.ACCEPTED);
    expect(res.booking.status).toBe(BookingStatus.CONFIRMED);
    expect(mockAudit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'REQUEST_ACCEPTED',
        entityId: requestId,
        toState: ServiceRequestStatus.ACCEPTED,
      }),
    );
  });

  it('3. Vehicle Arrival Check-In -> Records mileage & initializes Job Card', async () => {
    const arrivalMileage = 25400;
    mockPrisma.booking.findFirst.mockResolvedValue({
      id: bookingId,
      workshopId,
      userId: customerId,
      serviceRequestId: requestId,
      status: BookingStatus.CONFIRMED,
      serviceRequest: {
        vehicleId,
        service: {
          inspectionPolicy: InspectionPolicy.REQUIRED,
        },
      },
      job: null,
    });

    mockPrisma.booking.update.mockResolvedValue({
      id: bookingId,
      status: BookingStatus.VEHICLE_ARRIVED,
      arrivedAt: new Date(),
    });

    mockPrisma.vehicle.update.mockResolvedValue({
      id: vehicleId,
      mileage: arrivalMileage,
    });

    const newJobId = 'job-hub-9988';
    mockPrisma.job.create.mockResolvedValue({
      id: newJobId,
      bookingId,
      serviceRequestId: requestId,
      workshopId,
      vehicleId,
      status: JobStatus.INSPECTION,
    });

    mockPrisma.jobNote.create.mockResolvedValue({ id: 'note-1' });
    mockPrisma.inspection.create.mockResolvedValue({
      id: 'insp-1',
      jobId: newJobId,
      status: 'NOT_STARTED',
    });

    const checkInResult = await bookingsService.checkInVehicle(
      workshopId,
      bookingId,
      {
        arrivalMileage,
        conditionNotes: 'خدش بسيط في الصدام الخلفي',
        handoverNotes: 'تم استلام المفتاح الأصلي',
        fuelLevel: '1/2',
      },
      'receptionist-id',
    );

    expect(checkInResult.booking.status).toBe(BookingStatus.VEHICLE_ARRIVED);
    expect(checkInResult.job.status).toBe(JobStatus.INSPECTION);
    expect(mockPrisma.vehicle.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { mileage: arrivalMileage },
      }),
    );
    expect(mockPrisma.jobNote.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          jobId: newJobId,
          visibility: 'INTERNAL',
        }),
      }),
    );
  });

  it('4. Booking transition guard: cannot check in a cancelled or pending booking', async () => {
    mockPrisma.booking.findFirst.mockResolvedValue({
      id: bookingId,
      workshopId,
      status: BookingStatus.PENDING,
      serviceRequest: { vehicleId, service: {} },
    });

    await expect(
      bookingsService.checkInVehicle(
        workshopId,
        bookingId,
        { arrivalMileage: 10000 },
        'staff-id',
      ),
    ).rejects.toThrow('لا يمكن تسجيل وصول المركبة إلا بعد تأكيد الحجز');
  });
});

