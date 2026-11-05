import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient, InspectionPolicy, ModuleLayer } from '@prisma/client';
import { CANONICAL_SERVICE_TAXONOMY_V1 } from '@miftah/contracts';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Miftah 360 Phase 1 database seeding...');

  // 1. Seed Service Categories & Services from Canonical Taxonomy V1
  console.log('📦 Seeding Service Categories and Services...');
  const categoriesMap = new Map<string, string>();

  for (const def of CANONICAL_SERVICE_TAXONOMY_V1) {
    if (!categoriesMap.has(def.categoryCode)) {
      const category = await prisma.serviceCategory.upsert({
        where: { code: def.categoryCode },
        update: {
          nameEn: def.categoryNameEn,
          nameAr: def.categoryNameAr,
          active: true,
        },
        create: {
          code: def.categoryCode,
          nameEn: def.categoryNameEn,
          nameAr: def.categoryNameAr,
          active: true,
        },
      });
      categoriesMap.set(def.categoryCode, category.id);
    }

    const categoryId = categoriesMap.get(def.categoryCode)!;

    await prisma.service.upsert({
      where: { code: def.serviceCode },
      update: {
        nameEn: def.nameEn,
        nameAr: def.nameAr,
        preliminaryQuoteAllowed: def.preliminaryQuoteAllowed,
        inspectionPolicy: def.inspectionPolicy as InspectionPolicy,
        taxonomyVersion: 1,
        active: true,
      },
      create: {
        categoryId,
        code: def.serviceCode,
        nameEn: def.nameEn,
        nameAr: def.nameAr,
        preliminaryQuoteAllowed: def.preliminaryQuoteAllowed,
        inspectionPolicy: def.inspectionPolicy as InspectionPolicy,
        taxonomyVersion: 1,
        active: true,
      },
    });
  }

  // 2. Seed Vehicle Brands & Models
  console.log('🚗 Seeding Vehicle Brands and Popular Models...');
  const initialBrands = [
    {
      code: 'TOYOTA',
      name: 'Toyota',
      models: ['Land Cruiser', 'Prado', 'Corolla', 'Camry', 'RAV4', 'Hilux', 'Yaris'],
    },
    {
      code: 'NISSAN',
      name: 'Nissan',
      models: ['Patrol', 'Altima', 'Sunny', 'X-Trail', 'Pathfinder', 'Kicks', 'Maxima'],
    },
    {
      code: 'LEXUS',
      name: 'Lexus',
      models: ['LX', 'GX', 'RX', 'ES', 'IS', 'NX'],
    },
    {
      code: 'MERCEDES_BENZ',
      name: 'Mercedes-Benz',
      models: ['G-Class', 'E-Class', 'C-Class', 'S-Class', 'GLC', 'GLE'],
    },
    {
      code: 'BMW',
      name: 'BMW',
      models: ['X5', 'X6', '3 Series', '5 Series', '7 Series', 'X3', '4 Series'],
    },
    {
      code: 'FORD',
      name: 'Ford',
      models: ['F-150', 'Explorer', 'Mustang', 'Expedition', 'Edge', 'Ranger'],
    },
    {
      code: 'HYUNDAI',
      name: 'Hyundai',
      models: ['Tucson', 'Elantra', 'Santa Fe', 'Sonata', 'Creta', 'Accent'],
    },
  ];

  for (const b of initialBrands) {
    const brand = await prisma.vehicleBrand.upsert({
      where: { code: b.code },
      update: { name: b.name, active: true },
      create: { code: b.code, name: b.name, active: true },
    });

    for (const modelName of b.models) {
      const existingModel = await prisma.vehicleModel.findFirst({
        where: { brandId: brand.id, name: modelName },
      });
      if (!existingModel) {
        await prisma.vehicleModel.create({
          data: { brandId: brand.id, name: modelName, active: true },
        });
      }
    }
  }

  // 3. Seed Platform Modules
  console.log('🧩 Seeding Platform Modules...');
  await prisma.module.upsert({
    where: { code: 'CORE' },
    update: {
      layer: ModuleLayer.CORE,
      implemented: true,
      active: true,
      nameEn: 'Workshop Core OS',
      nameAr: 'نظام الورشة الأساسي',
    },
    create: {
      code: 'CORE',
      layer: ModuleLayer.CORE,
      implemented: true,
      active: true,
      nameEn: 'Workshop Core OS',
      nameAr: 'نظام الورشة الأساسي',
    },
  });

  await prisma.module.upsert({
    where: { code: 'MARKETPLACE_PACK' },
    update: {
      layer: ModuleLayer.MARKETPLACE_PACK,
      implemented: true,
      active: true,
      nameEn: 'Marketplace Pack',
      nameAr: 'حزمة السوق المفتوح',
    },
    create: {
      code: 'MARKETPLACE_PACK',
      layer: ModuleLayer.MARKETPLACE_PACK,
      implemented: true,
      active: true,
      nameEn: 'Marketplace Pack',
      nameAr: 'حزمة السوق المفتوح',
    },
  });

  // 4. Optional Admin Bootstrap (ONLY from Environment Variables - ZERO HARDCODED SECRETS)
  const adminEmail = process.env.ADMIN_BOOTSTRAP_EMAIL;
  const adminPasswordHash = process.env.ADMIN_BOOTSTRAP_PASSWORD_HASH;
  const adminFullName = process.env.ADMIN_BOOTSTRAP_FULLNAME || 'Platform Super Admin';

  if (adminEmail && adminPasswordHash) {
    console.log(`🔐 Bootstrapping initial admin account from environment (${adminEmail})...`);
    let user = await prisma.user.findUnique({ where: { email: adminEmail } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          fullName: adminFullName,
          email: adminEmail,
          preferredLanguage: 'ar',
          authIdentities: {
            create: {
              provider: 'EMAIL_PASSWORD',
              providerSubject: adminEmail,
              passwordHash: adminPasswordHash,
              verifiedAt: new Date(),
            },
          },
          adminAccount: {
            create: {
              adminRole: 'SUPER_ADMIN',
              mfaRequired: true,
            },
          },
        },
      });
      console.log(`✅ Admin bootstrapped: ${user.id}`);
    }
  } else {
    console.log('ℹ️ No ADMIN_BOOTSTRAP_EMAIL provided. Skipping admin creation (Roles & Master Data seeded).');
  }

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

