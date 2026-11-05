const dotenv = require('dotenv');
dotenv.config();

const { PrismaClient, AuthProvider, UserStatus, Role, AdminRole, WorkshopStaffRole, WorkshopStatus, Emirate, VehicleStatus } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedCleanData() {
  console.log('🌟 Seeding clean, realistic Miftah 360 demo data for Wave 2.5...');

  const passwordHash = await bcrypt.hash('ReviewPass123!', 10);

  // 1. Setup Admin Account
  const adminEmail = 'admin@miftah.local';
  let admin = await prisma.user.findFirst({ where: { email: adminEmail } });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email: adminEmail,
        fullName: 'عبدالله المهيري (مدير المنصة)',
        status: UserStatus.ACTIVE,
        preferredLanguage: 'ar',
      },
    });
  } else {
    await prisma.user.update({
      where: { id: admin.id },
      data: { fullName: 'عبدالله المهيري (مدير المنصة)' },
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
      userId: admin.id,
      provider: AuthProvider.EMAIL_PASSWORD,
      providerSubject: adminEmail,
      passwordHash,
    },
  });

  await prisma.adminAccount.upsert({
    where: { userId: admin.id },
    update: {
      adminRole: AdminRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      mfaRequired: true,
    },
    create: {
      userId: admin.id,
      adminRole: AdminRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      mfaRequired: true,
    },
  });

  // 2. Setup Primary Workshop & Owner
  const ownerEmail = 'owner@workshop.local';
  let owner = await prisma.user.findFirst({ where: { email: ownerEmail } });
  if (!owner) {
    owner = await prisma.user.create({
      data: {
        email: ownerEmail,
        fullName: 'راشد بن حميد النعيمي',
        status: UserStatus.ACTIVE,
        preferredLanguage: 'ar',
      },
    });
  } else {
    await prisma.user.update({
      where: { id: owner.id },
      data: { fullName: 'راشد بن حميد النعيمي' },
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
      userId: owner.id,
      provider: AuthProvider.EMAIL_PASSWORD,
      providerSubject: ownerEmail,
      passwordHash,
    },
  });

  // Clean, realistic workshops definition
  const demoWorkshops = [
    {
      legalName: 'Miftah Al Emarat Auto Care LLC',
      displayNameAr: 'كراج مفتاح الإمارات لصيانة السيارات',
      displayNameEn: 'Miftah Al Emarat Auto Care',
      emirate: Emirate.DUBAI,
      addressText: 'منطقة القوز الصناعية 3، شارع 18، دبي',
      primaryPhone: '+97143415566',
      primaryEmail: 'info@miftah-care.ae',
      status: WorkshopStatus.ACTIVE,
      marketplaceParticipation: true,
      allBrands: true,
      latitude: 25.1384,
      longitude: 55.2341,
      verifiedAt: new Date(),
      descriptionAr: 'مركز صيانة شامل يقدم خدمات الميكانيكا والكهرباء والتكييف والصيانة الدورية بأحدث أجهزة الفحص الكمبيوتري والكوادر المعتمدة.',
      descriptionEn: 'Full-service automotive facility specializing in mechanical, electrical, AC, and scheduled periodic maintenance with computerized diagnostics.',
      isPrimary: true,
    },
    {
      legalName: 'Al Quoz German Specialists LLC',
      displayNameAr: 'مركز القوز المتخصص للسيارات الألمانية',
      displayNameEn: 'Al Quoz German Auto Specialists',
      emirate: Emirate.DUBAI,
      addressText: 'منطقة القوز الصناعية 1، خلف تايمز سكوير، دبي',
      primaryPhone: '+97143389922',
      primaryEmail: 'service@german-quoz.ae',
      status: WorkshopStatus.ACTIVE,
      marketplaceParticipation: true,
      allBrands: false,
      latitude: 25.145,
      longitude: 55.228,
      verifiedAt: new Date(Date.now() - 30 * 86400000),
      descriptionAr: 'متخصصون في صيانة وبرمجة السيارات الألمانية والأوروبية، فرامل، فحص محركات وأنظمة التعليق الهوائي.',
      descriptionEn: 'Premier workshop for German and European marques with factory-certified diagnostic equipment.',
    },
    {
      legalName: 'Sharjah Motor Works & Tuning LLC',
      displayNameAr: 'شركة الشارقة الميكانيكية لخدمات المركبات',
      displayNameEn: 'Sharjah Motor Works & Service',
      emirate: Emirate.SHARJAH,
      addressText: 'المنطقة الصناعية 4، قرب جسر النهدة، الشارقة',
      primaryPhone: '+97165331188',
      primaryEmail: 'support@sharjah-motors.ae',
      status: WorkshopStatus.ACTIVE,
      marketplaceParticipation: true,
      allBrands: true,
      latitude: 25.321,
      longitude: 55.405,
      verifiedAt: new Date(Date.now() - 60 * 86400000),
      descriptionAr: 'خدمات سريعة لتبديل الإطارات، زيوت المحرك، صيانة المكيف، وتجهيز الفحص الفني الدوري لتجديد الملكية.',
      descriptionEn: 'Rapid automotive service hub for tyres, periodic lube, air conditioning, and RTA vehicle testing prep.',
    },
    {
      legalName: 'Al Barsha Precision Auto Workshop LLC',
      displayNameAr: 'ورشة البرشاء الدقيقة لصيانة السيارات',
      displayNameEn: 'Al Barsha Precision Auto Workshop',
      emirate: Emirate.DUBAI,
      addressText: 'منطقة البرشاء جنوب، شارع أم سقيم، دبي',
      primaryPhone: '+97143997711',
      primaryEmail: 'contact@barsha-precision.ae',
      status: WorkshopStatus.UNDER_REVIEW,
      marketplaceParticipation: false,
      allBrands: true,
      latitude: 25.092,
      longitude: 55.215,
      verifiedAt: null,
      descriptionAr: 'طلب ترخيص جديد - ورشة متطورة في البرشاء بانتظار استكمال مراجعة عقد الإيجار ومطابقة رخصة الدفاع المدني.',
      descriptionEn: 'New applicant workshop undergoing operational review and civil defense compliance audit.',
    },
    {
      legalName: 'Deira Modern Auto Repairing LLC',
      displayNameAr: 'ورشة ديرة الحديثة لتصليح السيارات',
      displayNameEn: 'Deira Modern Auto Repairing',
      emirate: Emirate.DUBAI,
      addressText: 'ديرة، منطقة بور سعيد، شارع آل مكتوم، دبي',
      primaryPhone: '+97142958844',
      primaryEmail: 'info@deiramodern.ae',
      status: WorkshopStatus.SUBMITTED,
      marketplaceParticipation: false,
      allBrands: true,
      latitude: 25.261,
      longitude: 55.334,
      verifiedAt: null,
      descriptionAr: 'طلب ورشة جديد مقدم للتحقق من الرخصة التجارية والسجل التجاري لدائرة التنمية الاقتصادية بدبي.',
      descriptionEn: 'Newly registered garage application pending initial DED license validation.',
    },
    {
      legalName: 'Emirates Auto Tuning & Performance LLC',
      displayNameAr: 'مركز الإمارات الهندسي وضبط المركبات',
      displayNameEn: 'Emirates Engineering & Tuning Hub',
      emirate: Emirate.SHARJAH,
      addressText: 'المنطقة الصناعية 12، الشارقة',
      primaryPhone: '+97165442233',
      primaryEmail: 'tuning@emirates-hub.ae',
      status: WorkshopStatus.CHANGES_REQUESTED,
      marketplaceParticipation: false,
      allBrands: true,
      latitude: 25.295,
      longitude: 55.431,
      verifiedAt: null,
      descriptionAr: 'تم طلب تعديل بيانات: مطلوب توضيح سياسة فحص السيارات ذات النقل الميكانيكي وتعديل نطاق الضمان.',
      descriptionEn: 'Clarification requested on mechanical inspection policies and warranty terms.',
    },
    {
      legalName: 'Gulf Stars Auto Maintenance LLC',
      displayNameAr: 'نجوم الخليج لصيانة وفحص السيارات',
      displayNameEn: 'Gulf Stars Auto Maintenance',
      emirate: Emirate.DUBAI,
      addressText: 'منطقة رأس الخور الصناعية 2، دبي',
      primaryPhone: '+97143336677',
      primaryEmail: 'gulfstars@autocare.ae',
      status: WorkshopStatus.SUSPENDED,
      marketplaceParticipation: false,
      allBrands: true,
      latitude: 25.182,
      longitude: 55.362,
      verifiedAt: new Date(Date.now() - 120 * 86400000),
      descriptionAr: 'ورشة معلقة مؤقتاً لانتهاء صلاحية الرخصة التجارية وتجديد شهادة التفتيش البلدي.',
      descriptionEn: 'Temporarily suspended due to expired trade license pending renewal submission.',
    },
  ];

  let primaryWorkshopId = null;

  for (const w of demoWorkshops) {
    let ws = await prisma.workshop.findFirst({ where: { legalName: w.legalName } });
    if (!ws) {
      ws = await prisma.workshop.create({
        data: {
          ownerUserId: owner.id,
          legalName: w.legalName,
          displayNameAr: w.displayNameAr,
          displayNameEn: w.displayNameEn,
          emirate: w.emirate,
          addressText: w.addressText,
          primaryPhone: w.primaryPhone,
          primaryEmail: w.primaryEmail,
          status: w.status,
          marketplaceParticipation: w.marketplaceParticipation,
          latitude: w.latitude,
          longitude: w.longitude,
          verifiedAt: w.verifiedAt,
          descriptionAr: w.descriptionAr,
          descriptionEn: w.descriptionEn,
        },
      });
    } else {
      await prisma.workshop.update({
        where: { id: ws.id },
        data: {
          displayNameAr: w.displayNameAr,
          displayNameEn: w.displayNameEn,
          emirate: w.emirate,
          addressText: w.addressText,
          primaryPhone: w.primaryPhone,
          primaryEmail: w.primaryEmail,
          status: w.status,
          marketplaceParticipation: w.marketplaceParticipation,
          descriptionAr: w.descriptionAr,
          descriptionEn: w.descriptionEn,
        },
      });
    }

    // Set supported brands
    await prisma.workshopBrand.deleteMany({ where: { workshopId: ws.id } });
    if (w.allBrands) {
      await prisma.workshopBrand.create({
        data: {
          workshopId: ws.id,
          allBrands: true,
          brandId: null,
        },
      });
    }

    if (w.isPrimary) {
      primaryWorkshopId = ws.id;

      // Link Owner as WORKSHOP_OWNER
      await prisma.workshopStaff.upsert({
        where: {
          workshopId_userId: {
            workshopId: ws.id,
            userId: owner.id,
          },
        },
        update: {
          role: WorkshopStaffRole.WORKSHOP_OWNER,
          status: UserStatus.ACTIVE,
        },
        create: {
          workshopId: ws.id,
          userId: owner.id,
          role: WorkshopStaffRole.WORKSHOP_OWNER,
          status: UserStatus.ACTIVE,
        },
      });

      // Add clean staff members to primary workshop
      const staffMembers = [
        { email: 'advisor@workshop.local', name: 'طارق الهاشمي', role: WorkshopStaffRole.SERVICE_ADVISOR, phone: '+971502223344' },
        { email: 'reception@workshop.local', name: 'مريم الكعبي', role: WorkshopStaffRole.RECEPTION, phone: '+971503334455' },
        { email: 'tech1@workshop.local', name: 'أحمد شاهين (كبير الفنيين)', role: WorkshopStaffRole.TECHNICIAN, phone: '+971504445566' },
      ];

      for (const sm of staffMembers) {
        let u = await prisma.user.findFirst({ where: { email: sm.email } });
        if (!u) {
          u = await prisma.user.create({
            data: { email: sm.email, fullName: sm.name, phoneE164: sm.phone, status: UserStatus.ACTIVE, preferredLanguage: 'ar' },
          });
        }
        await prisma.authIdentity.upsert({
          where: { provider_providerSubject: { provider: AuthProvider.EMAIL_PASSWORD, providerSubject: sm.email } },
          update: { passwordHash },
          create: { userId: u.id, provider: AuthProvider.EMAIL_PASSWORD, providerSubject: sm.email, passwordHash },
        });
        await prisma.workshopStaff.upsert({
          where: { workshopId_userId: { workshopId: ws.id, userId: u.id } },
          update: { role: sm.role, status: UserStatus.ACTIVE },
          create: { workshopId: ws.id, userId: u.id, role: sm.role, status: UserStatus.ACTIVE },
        });
      }

      // Add 7-day schedule
      const defaultHours = [
        { weekday: 0, openTime: '08:00', closeTime: '19:00', isClosed: false },
        { weekday: 1, openTime: '08:00', closeTime: '19:00', isClosed: false },
        { weekday: 2, openTime: '08:00', closeTime: '19:00', isClosed: false },
        { weekday: 3, openTime: '08:00', closeTime: '19:00', isClosed: false },
        { weekday: 4, openTime: '08:00', closeTime: '19:00', isClosed: false },
        { weekday: 5, openTime: '08:00', closeTime: '12:00', isClosed: true }, // Friday closed
        { weekday: 6, openTime: '08:30', closeTime: '17:30', isClosed: false },
      ];

      for (const h of defaultHours) {
        await prisma.workshopHours.upsert({
          where: { workshopId_weekday: { workshopId: ws.id, weekday: h.weekday } },
          update: { openTime: h.openTime, closeTime: h.closeTime, isClosed: h.isClosed },
          create: { workshopId: ws.id, weekday: h.weekday, openTime: h.openTime, closeTime: h.closeTime, isClosed: h.isClosed },
        });
      }
    }

    // Ensure Module Entitlements
    const modCore = await prisma.module.findUnique({ where: { code: 'CORE' } });
    const modMarketplace = await prisma.module.findUnique({ where: { code: 'MARKETPLACE_PACK' } });

    if (modCore) {
      await prisma.workshopModuleEntitlement.upsert({
        where: { workshopId_moduleId: { workshopId: ws.id, moduleId: modCore.id } },
        update: { state: 'ENABLED' },
        create: { workshopId: ws.id, moduleId: modCore.id, state: 'ENABLED' },
      });
    }

    if (modMarketplace) {
      await prisma.workshopModuleEntitlement.upsert({
        where: { workshopId_moduleId: { workshopId: ws.id, moduleId: modMarketplace.id } },
        update: { state: w.marketplaceParticipation ? 'ENABLED' : 'DISABLED' },
        create: { workshopId: ws.id, moduleId: modMarketplace.id, state: w.marketplaceParticipation ? 'ENABLED' : 'DISABLED' },
      });
    }
  }

  // 3. Setup Car Owner & Garage Vehicles
  const carOwnerEmail = 'user@carowner.local';
  let carOwner = await prisma.user.findFirst({ where: { email: carOwnerEmail } });
  if (!carOwner) {
    carOwner = await prisma.user.create({
      data: {
        email: carOwnerEmail,
        fullName: 'منصور محمد المنصوري',
        phoneE164: '+971501112233',
        status: UserStatus.ACTIVE,
        preferredLanguage: 'ar',
      },
    });
  } else {
    await prisma.user.update({
      where: { id: carOwner.id },
      data: { fullName: 'منصور محمد المنصوري' },
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
      userId: carOwner.id,
      provider: AuthProvider.EMAIL_PASSWORD,
      providerSubject: carOwnerEmail,
      passwordHash,
    },
  });

  // Fetch Brands to associate vehicles
  const brandToyota = await prisma.vehicleBrand.findFirst({ where: { code: 'TOYOTA' }, include: { models: true } });
  const brandNissan = await prisma.vehicleBrand.findFirst({ where: { code: 'NISSAN' }, include: { models: true } });
  const brandPorsche = await prisma.vehicleBrand.findFirst({ where: { code: 'PORSCHE' }, include: { models: true } });

  const vehiclesToSeed = [
    {
      brand: brandToyota,
      year: 2023,
      mileage: 24500,
      trim: 'VXR V8 Platinum Executive',
      fuelType: 'PETROL',
      transmission: 'AUTOMATIC',
      plateNumber: 'A 12345',
      emirate: Emirate.DUBAI,
      vin: 'JTMCY7AJ4P4098231',
      status: VehicleStatus.ACTIVE,
      regDays: 140,
      insDays: 140,
      notes: 'السيارة الأساسية للعائلة - صيانة الوكالة الدورية حتى 20 ألف كم.',
    },
    {
      brand: brandNissan,
      year: 2022,
      mileage: 48000,
      trim: 'Titanium V8 5.6L',
      fuelType: 'PETROL',
      transmission: 'AUTOMATIC',
      plateNumber: 'S 98765',
      emirate: Emirate.SHARJAH,
      vin: 'JN8AY2NC7N9182374',
      status: VehicleStatus.ACTIVE,
      regDays: 45,
      insDays: 50,
      notes: 'سيارة الرحلات والاستخدام اليومي - تحتاج فحص المكيف قبل بداية الصيف.',
    },
    {
      brand: brandPorsche,
      year: 2024,
      mileage: 8200,
      trim: 'Turbo GT Coupe',
      fuelType: 'PETROL',
      transmission: 'AUTOMATIC',
      plateNumber: 'K 77777',
      emirate: Emirate.DUBAI,
      vin: 'WP1AA2AY9RDA12345',
      status: VehicleStatus.ACTIVE,
      regDays: 310,
      insDays: 310,
      notes: 'مركبة رياضية - حماية طلاء كاملة PPF وسيراميك.',
    },
  ];

  for (const v of vehiclesToSeed) {
    if (v.brand && v.brand.models.length > 0) {
      const model = v.brand.models[0];
      const existing = await prisma.vehicle.findFirst({
        where: { ownerUserId: carOwner.id, plateNumber: v.plateNumber },
      });
      if (!existing) {
        await prisma.vehicle.create({
          data: {
            ownerUserId: carOwner.id,
            brandId: v.brand.id,
            modelId: model.id,
            year: v.year,
            mileage: v.mileage,
            trim: v.trim,
            fuelType: v.fuelType,
            transmission: v.transmission,
            plateNumber: v.plateNumber,
            emirate: v.emirate,
            vin: v.vin,
            registrationExpiry: new Date(Date.now() + v.regDays * 86400000),
            insuranceExpiry: new Date(Date.now() + v.insDays * 86400000),
            notes: v.notes,
            status: v.status,
          },
        });
      }
    }
  }

  // 4. Configure enabled canonical services with realistic AED Starting Prices for primary workshop
  if (primaryWorkshopId) {
    const canonicalServices = await prisma.service.findMany({ where: { active: true } });
    const pricingMap = {
      'MAINT_OIL_CHANGE': 180,
      'MAINT_FILTERS': 95,
      'MAINT_MINOR_SERVICE': 350,
      'MAINT_MAJOR_SERVICE': 850,
      'MECH_ENGINE_INSPECTION': 200,
      'MECH_BRAKES': 150,
      'MECH_SUSPENSION': 250,
      'ELEC_BATTERY': 280,
      'ELEC_ALTERNATOR': 320,
      'ELEC_ELECTRONICS': 180,
      'AC_INSPECTION': 120,
      'AC_GAS_REFILL': 150,
      'AC_COMPRESSOR': 450,
      'TYRE_REPLACEMENT': 50,
      'TYRE_BALANCING': 80,
      'TYRE_ALIGNMENT': 120,
      'TYRE_PUNCTURE': 35,
      'CARE_WASH': 45,
      'CARE_DETAILING': 350,
      'CARE_POLISHING': 250,
      'CARE_CERAMIC': 1200,
      'CARE_TINT': 400,
    };

    for (const s of canonicalServices) {
      const price = pricingMap[s.code] || 150;
      await prisma.workshopService.upsert({
        where: { workshopId_serviceId: { workshopId: primaryWorkshopId, serviceId: s.id } },
        update: { enabled: true, startingPriceAmount: price, currency: 'AED' },
        create: { workshopId: primaryWorkshopId, serviceId: s.id, enabled: true, startingPriceAmount: price, currency: 'AED' },
      });
    }
  }

  console.log('🎉 Clean realistic demo dataset seeded successfully!');
  await prisma['$disconnect']();
}

seedCleanData().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
