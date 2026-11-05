const dotenv = require('dotenv');
dotenv.config();

const { PrismaClient, AuthProvider, UserStatus, Role, AdminRole, WorkshopStaffRole, WorkshopStatus, Emirate, VehicleStatus } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createReviewAccounts() {
  console.log('🔧 Creating local review accounts...');

  const passwordHash = await bcrypt.hash('ReviewPass123!', 10);

  // 1. Admin Review Account
  const adminEmail = 'admin@miftah.local';
  let adminUser = await prisma.user.findFirst({ where: { email: adminEmail } });
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        fullName: 'Miftah Platform Admin',
        status: UserStatus.ACTIVE,
        preferredLanguage: 'ar',
      },
    });
  }

  await prisma.authIdentity.upsert({
    where: {
      provider_providerSubject: {
        provider: AuthProvider.EMAIL_PASSWORD,
        providerSubject: adminEmail,
      },
    },
    update: { passwordHash },
    create: {
      userId: adminUser.id,
      provider: AuthProvider.EMAIL_PASSWORD,
      providerSubject: adminEmail,
      passwordHash,
    },
  });

  await prisma.adminAccount.upsert({
    where: { userId: adminUser.id },
    update: {
      adminRole: AdminRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      mfaRequired: true,
    },
    create: {
      userId: adminUser.id,
      adminRole: AdminRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      mfaRequired: true,
    },
  });
  console.log('✅ Admin Account ready: admin@miftah.local / ReviewPass123! (MFA Code: 123456)');

  // 2. Workshop Owner Review Account
  const ownerEmail = 'owner@workshop.local';
  let ownerUser = await prisma.user.findFirst({ where: { email: ownerEmail } });
  if (!ownerUser) {
    ownerUser = await prisma.user.create({
      data: {
        email: ownerEmail,
        fullName: 'Rashid Al Nuaimi (Owner)',
        status: UserStatus.ACTIVE,
        preferredLanguage: 'ar',
      },
    });
  }

  await prisma.authIdentity.upsert({
    where: {
      provider_providerSubject: {
        provider: AuthProvider.EMAIL_PASSWORD,
        providerSubject: ownerEmail,
      },
    },
    update: { passwordHash },
    create: {
      userId: ownerUser.id,
      provider: AuthProvider.EMAIL_PASSWORD,
      providerSubject: ownerEmail,
      passwordHash,
    },
  });

  // Workshop
  let workshop = await prisma.workshop.findFirst({ where: { legalName: 'Miftah Al Emarat Garage LLC' } });
  if (!workshop) {
    workshop = await prisma.workshop.create({
      data: {
        ownerUserId: ownerUser.id,
        legalName: 'Miftah Al Emarat Garage LLC',
        displayNameEn: 'Miftah Al Emarat Auto Care',
        displayNameAr: 'كراج مفتاح الإمارات لصيانة السيارات',
        status: WorkshopStatus.ACTIVE,
        emirate: Emirate.DUBAI,
        addressText: 'Al Quoz Industrial Area 3, Street 18, Dubai',
        primaryPhone: '+97143334455',
        primaryEmail: ownerEmail,
        marketplaceParticipation: true,
        latitude: 25.1384,
        longitude: 55.2341,
        verifiedAt: new Date(),
      },
    });
  }

  // Staff Membership
  await prisma.workshopStaff.upsert({
    where: {
      workshopId_userId: {
        workshopId: workshop.id,
        userId: ownerUser.id,
      },
    },
    update: {
      role: WorkshopStaffRole.WORKSHOP_OWNER,
      status: UserStatus.ACTIVE,
    },
    create: {
      workshopId: workshop.id,
      userId: ownerUser.id,
      role: WorkshopStaffRole.WORKSHOP_OWNER,
      status: UserStatus.ACTIVE,
    },
  });
  console.log('✅ Workshop Owner ready: owner@workshop.local / ReviewPass123!');

  // 3. Car Owner Review Account
  const carOwnerEmail = 'user@carowner.local';
  let carOwnerUser = await prisma.user.findFirst({ where: { email: carOwnerEmail } });
  if (!carOwnerUser) {
    carOwnerUser = await prisma.user.create({
      data: {
        email: carOwnerEmail,
        phoneE164: '+971501112233',
        fullName: 'Mansoor Al Mansoori',
        status: UserStatus.ACTIVE,
        preferredLanguage: 'ar',
      },
    });
  }

  await prisma.authIdentity.upsert({
    where: {
      provider_providerSubject: {
        provider: AuthProvider.EMAIL_PASSWORD,
        providerSubject: carOwnerEmail,
      },
    },
    update: { passwordHash },
    create: {
      userId: carOwnerUser.id,
      provider: AuthProvider.EMAIL_PASSWORD,
      providerSubject: carOwnerEmail,
      passwordHash,
    },
  });

  // Seed 2 Vehicles for Car Owner
  const brandToyota = await prisma.vehicleBrand.findFirst({ where: { code: 'TOYOTA' }, include: { models: true } });
  const brandNissan = await prisma.vehicleBrand.findFirst({ where: { code: 'NISSAN' }, include: { models: true } });

  if (brandToyota && brandToyota.models.length > 0) {
    const existingVehicle = await prisma.vehicle.findFirst({ where: { ownerUserId: carOwnerUser.id, plateNumber: 'A 12345' } });
    if (!existingVehicle) {
      await prisma.vehicle.create({
        data: {
          ownerUserId: carOwnerUser.id,
          brandId: brandToyota.id,
          modelId: brandToyota.models[0].id,
          year: 2023,
          mileage: 24500,
          trim: 'VXR V8 Platinum',
          fuelType: 'PETROL',
          transmission: 'AUTOMATIC',
          plateNumber: 'A 12345',
          emirate: Emirate.DUBAI,
          status: VehicleStatus.ACTIVE,
        },
      });
    }
  }

  if (brandNissan && brandNissan.models.length > 0) {
    const existingVehicle2 = await prisma.vehicle.findFirst({ where: { ownerUserId: carOwnerUser.id, plateNumber: 'S 98765' } });
    if (!existingVehicle2) {
      await prisma.vehicle.create({
        data: {
          ownerUserId: carOwnerUser.id,
          brandId: brandNissan.id,
          modelId: brandNissan.models[0].id,
          year: 2022,
          mileage: 48000,
          trim: 'Titanium Edition',
          fuelType: 'PETROL',
          transmission: 'AUTOMATIC',
          plateNumber: 'S 98765',
          emirate: Emirate.SHARJAH,
          status: VehicleStatus.ACTIVE,
        },
      });
    }
  }
  console.log('✅ Car Owner ready: user@carowner.local / ReviewPass123! (Pre-loaded with 2 Garage Vehicles)');

  await prisma['$disconnect']();
}

createReviewAccounts().catch((err) => {
  console.error('Failed to create review accounts:', err);
  process.exit(1);
});

