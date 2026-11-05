import * as dotenv from 'dotenv';
dotenv.config();

import { JwtService } from '@nestjs/jwt';
import {
  Role,
  WorkshopStaffRole,
  AdminRole,
  ModuleEntitlementState,
  VehicleStatus,
  StaffStatus,
  Emirate,
  WorkshopStatus,
  UserStatus,
} from '@miftah/contracts';
import { PrismaService } from '../../apps/api/src/prisma/prisma.service';
import { AuditService } from '../../apps/api/src/modules/audit/audit.service';
import { AdminService } from '../../apps/api/src/modules/admin/admin.service';
import { WorkshopService } from '../../apps/api/src/modules/workshop/workshop.service';
import { VehiclesService } from '../../apps/api/src/modules/vehicles/vehicles.service';

describe('Wave 2 Integration Tests (Admin, Workshop Core, Garage)', () => {
  let prisma: PrismaService;
  let jwtService: JwtService;
  let auditService: AuditService;
  let adminService: AdminService;
  let workshopService: WorkshopService;
  let vehiclesService: VehiclesService;

  const runId = Date.now();

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();

    jwtService = new JwtService({ secret: process.env.JWT_SECRET || 'test_jwt_secret_miftah_360' });
    auditService = new AuditService(prisma);
    adminService = new AdminService(prisma, auditService);
    workshopService = new WorkshopService(prisma, auditService);
    vehiclesService = new VehiclesService(prisma, auditService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // -------------------------------------------------------------
  // 1. ADMIN WORKSHOP LIFECYCLE & ENTITLEMENTS
  // -------------------------------------------------------------
  describe('Admin Operations (Agent B)', () => {
    let workshopId: string;
    let adminUserId: string;

    beforeAll(async () => {
      // Create admin user
      const admin = await prisma.user.create({
        data: {
          fullName: `Admin ${runId}`,
          email: `admin_${runId}@miftah.ae`,
          adminAccount: {
            create: {
              adminRole: AdminRole.OPERATIONS_ADMIN,
              mfaRequired: true,
            },
          },
        },
      });
      adminUserId = admin.id;

      // Create owner & pending workshop
      const owner = await prisma.user.create({
        data: { fullName: `Owner Wave2 ${runId}`, email: `owner_w2_${runId}@test.ae` },
      });

      const ws = await prisma.workshop.create({
        data: {
          ownerUserId: owner.id,
          legalName: `Wave2 Workshop ${runId} LLC`,
          displayNameEn: `Wave2 Workshop ${runId}`,
          displayNameAr: `ورشة الموجة 2`,
          status: WorkshopStatus.PENDING_VERIFICATION,
          emirate: Emirate.DUBAI,
          addressText: 'Al Quoz, Dubai',
          latitude: 25.12,
          longitude: 55.22,
          primaryPhone: '+97140001122',
          primaryEmail: `ws_${runId}@test.ae`,
        },
      });
      workshopId = ws.id;
    });

    it('approves a pending workshop to ACTIVE and records verification timestamp', async () => {
      const approved = await adminService.approveWorkshop(workshopId, adminUserId, 'test-corr');
      expect(approved.status).toBe(WorkshopStatus.ACTIVE);
      expect(approved.verifiedAt).toBeDefined();

      const details = await adminService.getWorkshopDetails(workshopId);
      expect(details.status).toBe(WorkshopStatus.ACTIVE);
    });

    it('toggles module entitlements and strictly prevents disabling CORE module', async () => {
      // 1. Enable MARKETPLACE_PACK
      const enabledPack = await adminService.updateModuleEntitlement(
        workshopId,
        'MARKETPLACE_PACK',
        { state: ModuleEntitlementState.ENABLED, reason: 'Approved for launch' },
        adminUserId,
        'test-corr',
      );
      expect(enabledPack.state).toBe(ModuleEntitlementState.ENABLED);

      // 2. Attempt to disable CORE module -> MUST FAIL
      await expect(
        adminService.updateModuleEntitlement(
          workshopId,
          'CORE',
          { state: ModuleEntitlementState.DISABLED, reason: 'Test invalid action' },
          adminUserId,
          'test-corr',
        ),
      ).rejects.toThrow();
    });

    it('suspends and reactivates an active workshop with audit trail', async () => {
      const suspended = await adminService.suspendWorkshop(
        workshopId,
        'COMPLIANCE_REVIEW',
        adminUserId,
        'test-corr',
      );
      expect(suspended.status).toBe(WorkshopStatus.SUSPENDED);

      const reactivated = await adminService.reactivateWorkshop(workshopId, adminUserId, 'test-corr');
      expect(reactivated.status).toBe(WorkshopStatus.ACTIVE);
    });
  });

  // -------------------------------------------------------------
  // 2. WORKSHOP CORE & STAFF MANAGEMENT (Agent C)
  // -------------------------------------------------------------
  describe('Workshop OS Operations (Agent C)', () => {
    let workshopId: string;
    let ownerUserId: string;

    beforeAll(async () => {
      const owner = await prisma.user.create({
        data: { fullName: `Owner OS ${runId}`, email: `owner_os_${runId}@ws.ae` },
      });
      ownerUserId = owner.id;

      const ws = await prisma.workshop.create({
        data: {
          ownerUserId: owner.id,
          legalName: `OS WS ${runId}`,
          displayNameEn: `OS Workshop ${runId}`,
          displayNameAr: `ورشة تشغيل`,
          status: WorkshopStatus.ACTIVE,
          emirate: Emirate.DUBAI,
          addressText: 'Dubai',
          latitude: 25.1,
          longitude: 55.2,
          primaryPhone: '+97148889900',
          primaryEmail: `os_${runId}@ws.ae`,
        },
      });
      workshopId = ws.id;
    });

    it('updates working hours and supported brands', async () => {
      // 1. Working hours
      const hours = await workshopService.updateWorkingHours(
        workshopId,
        {
          hours: [
            { weekday: 0, openTime: '08:00', closeTime: '18:00', isClosed: false },
            { weekday: 5, openTime: '00:00', closeTime: '00:00', isClosed: true }, // Friday closed
          ],
        },
        ownerUserId,
        'test-corr',
      );
      expect(hours.length).toBe(2);

      // 2. Supported brands (Toyota & BMW)
      const brands = await prisma.vehicleBrand.findMany({ take: 2 });
      const updatedBrands = await workshopService.updateSupportedBrands(
        workshopId,
        { allBrands: false, brandIds: brands.map((b) => b.id) },
        ownerUserId,
        'test-corr',
      );
      expect(updatedBrands.length).toBe(2);
    });

    it('configures service from central taxonomy with non-binding Starting From price', async () => {
      const oilService = await prisma.service.findUniqueOrThrow({
        where: { code: 'MAINT_OIL_CHANGE' },
      });

      const config = await workshopService.updateWorkshopService(
        workshopId,
        oilService.id,
        { enabled: true, startingPriceAmount: 180.0, notes: 'Includes synthetic oil' },
        ownerUserId,
        'test-corr',
      );

      expect(config.enabled).toBe(true);
      expect(Number(config.startingPriceAmount)).toBe(180.0);
    });

    it('manages fixed staff roles: invite, role change, and disable', async () => {
      // 1. Invite Service Advisor
      const staff = await workshopService.inviteStaff(
        workshopId,
        {
          fullName: 'Tariq Advisor',
          email: `tariq_${runId}@ws.ae`,
          role: WorkshopStaffRole.SERVICE_ADVISOR,
        },
        ownerUserId,
        'test-corr',
      );
      expect(staff.role).toBe(WorkshopStaffRole.SERVICE_ADVISOR);
      expect(staff.status).toBe(StaffStatus.ACTIVE);

      // 2. Change role to Reception
      const updatedStaff = await workshopService.updateStaffRole(
        workshopId,
        staff.id,
        { role: WorkshopStaffRole.RECEPTION },
        ownerUserId,
        'test-corr',
      );
      expect(updatedStaff.role).toBe(WorkshopStaffRole.RECEPTION);

      // 3. Disable staff member
      const disabledStaff = await workshopService.setStaffStatus(
        workshopId,
        staff.id,
        StaffStatus.DISABLED,
        ownerUserId,
        'test-corr',
      );
      expect(disabledStaff.status).toBe(StaffStatus.DISABLED);
    });
  });

  // -------------------------------------------------------------
  // 3. CAR OWNER GARAGE (Agent D)
  // -------------------------------------------------------------
  describe('Car Owner Garage & Vehicles (Agent D)', () => {
    let carOwnerId: string;
    let otherUserId: string;
    let brandId: string;
    let modelId: string;

    beforeAll(async () => {
      const owner = await prisma.user.create({
        data: { fullName: `Car Owner ${runId}`, email: `carowner_${runId}@user.ae` },
      });
      carOwnerId = owner.id;

      const other = await prisma.user.create({
        data: { fullName: `Other User ${runId}`, email: `other_${runId}@user.ae` },
      });
      otherUserId = other.id;

      const brand = await prisma.vehicleBrand.findFirstOrThrow({
        where: { code: 'TOYOTA' },
        include: { models: true },
      });
      brandId = brand.id;
      modelId = brand.models[0].id;
    });

    it('creates vehicle with required and optional fields per PO-002', async () => {
      const vehicle = await vehiclesService.createVehicle(
        carOwnerId,
        {
          brandId,
          modelId,
          year: 2023,
          mileage: 25000,
          plateNumber: 'A 12345',
          emirate: Emirate.DUBAI,
          registrationExpiry: new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString(),
          insuranceExpiry: new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString(),
          trim: 'VXR',
          fuelType: 'Petrol',
          transmission: 'Automatic',
        },
        'test-corr',
      );

      expect(vehicle.id).toBeDefined();
      expect(vehicle.year).toBe(2023);
      expect(vehicle.mileage).toBe(25000);
      expect(vehicle.status).toBe(VehicleStatus.ACTIVE);

      // Verify reminders calculated
      const reminders = await vehiclesService.getVehicleReminders(vehicle.id, carOwnerId);
      expect(reminders.length).toBeGreaterThanOrEqual(2); // Registration + Oil change interval
    });

    it('enforces vehicle ownership: other users cannot access or edit vehicle', async () => {
      const vehicle = await vehiclesService.createVehicle(
        carOwnerId,
        {
          brandId,
          modelId,
          year: 2022,
          mileage: 40000,
        },
        'test-corr',
      );

      // Owner can access
      const details = await vehiclesService.getVehicleDetails(vehicle.id, carOwnerId);
      expect(details.id).toBe(vehicle.id);

      // Other user is forbidden
      await expect(vehiclesService.getVehicleDetails(vehicle.id, otherUserId)).rejects.toThrow();
      await expect(
        vehiclesService.updateVehicle(vehicle.id, otherUserId, { mileage: 50000 }, 'test-corr'),
      ).rejects.toThrow();
    });

    it('archives and unarchives vehicle while preserving data in garage', async () => {
      const vehicle = await vehiclesService.createVehicle(
        carOwnerId,
        {
          brandId,
          modelId,
          year: 2021,
          mileage: 70000,
        },
        'test-corr',
      );

      // Archive
      const archived = await vehiclesService.setVehicleStatus(
        vehicle.id,
        carOwnerId,
        VehicleStatus.ARCHIVED,
        'test-corr',
      );
      expect(archived.status).toBe(VehicleStatus.ARCHIVED);

      // List active vehicles -> should NOT include archived
      const activeList = await vehiclesService.listUserVehicles(carOwnerId, VehicleStatus.ACTIVE);
      expect(activeList.some((v) => v.id === vehicle.id)).toBe(false);

      // List archived vehicles -> should include it
      const archivedList = await vehiclesService.listUserVehicles(carOwnerId, VehicleStatus.ARCHIVED);
      expect(archivedList.some((v) => v.id === vehicle.id)).toBe(true);

      // Unarchive
      const unarchived = await vehiclesService.setVehicleStatus(
        vehicle.id,
        carOwnerId,
        VehicleStatus.ACTIVE,
        'test-corr',
      );
      expect(unarchived.status).toBe(VehicleStatus.ACTIVE);
    });
  });
});
