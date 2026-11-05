require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CANONICAL_MODULES = [
  {
    code: 'CORE',
    layer: 'CORE',
    nameAr: 'النظام الأساسي للورشة (Workshop Core OS)',
    nameEn: 'Workshop Core OS',
    implemented: true,
    active: true,
    descriptionAr: 'الملف التعريفي، ساعات العمل، الماركات، الخدمات، إدارة الموظفين، وسجلات العملاء والمركبات. مفعل دائماً ولا يمكن تعطيله.',
  },
  {
    code: 'MARKETPLACE_PACK',
    layer: 'MARKETPLACE_PACK',
    nameAr: 'حزمة سوق مفتاح والمطابقة (Marketplace Pack)',
    nameEn: 'Miftah Marketplace Pack',
    implemented: true,
    active: true,
    descriptionAr: 'استقبال طلبات الصيانة من أصحاب السيارات، عروض الأسعار، الحجوزات، بطاقات العمل، الفواتير، والتقييمات.',
  },
  {
    code: 'INVENTORY',
    layer: 'OPTIONAL',
    nameAr: 'إدارة المخزون وقطع الغيار',
    nameEn: 'Inventory & Spare Parts',
    implemented: true,
    active: true,
    descriptionAr: 'تتبع كميات قطع الغيار، أرقام القطع OEM، تنبيهات حد الطلب، وإدارة المستودعات.',
  },
  {
    code: 'WARRANTY',
    layer: 'OPTIONAL',
    nameAr: 'إدارة الضمانات وشهادات الصيانة',
    nameEn: 'Warranty & Service Guarantees',
    implemented: true,
    active: true,
    descriptionAr: 'إصدار وتتبع شهادات الضمان الرقمية للقطع وشغل اليد مع التنبيهات التلقائية.',
  },
  {
    code: 'SUPPLIERS',
    layer: 'OPTIONAL',
    nameAr: 'إدارة الموردين وفواتير الشراء',
    nameEn: 'Suppliers & Purchase Invoices',
    implemented: true,
    active: true,
    descriptionAr: 'دليل موردي قطع الغيار، طلبات الشراء، وحسابات الموردين والدفعات الآجلة.',
  },
  {
    code: 'POS',
    layer: 'OPTIONAL',
    nameAr: 'نقطة البيع والدفع السريع',
    nameEn: 'Point of Sale (POS)',
    implemented: true,
    active: true,
    descriptionAr: 'إصدار الفواتير الفورية عند الاستقبال ودعم الدفع السريع والشبكة والبطاقات.',
  },
  {
    code: 'ADVANCED_CRM',
    layer: 'OPTIONAL',
    nameAr: 'إدارة علاقات العملاء المتقدمة والولاء',
    nameEn: 'Advanced CRM & Customer Loyalty',
    implemented: true,
    active: true,
    descriptionAr: 'سجلات تواصل العملاء، برامج نقاط الولاء، والتذكير التلقائي بمواعيد الصيانة الدورية.',
  },
  {
    code: 'TASKS',
    layer: 'OPTIONAL',
    nameAr: 'إدارة المهام وجدولة الفنيين',
    nameEn: 'Technician Tasks & Scheduling',
    implemented: true,
    active: true,
    descriptionAr: 'توزيع المهام اليومية على الفنيين، قياس كفاءة وساعات العمل، وتتبع الإنجاز.',
  },
  {
    code: 'CONTRACTS',
    layer: 'OPTIONAL',
    nameAr: 'عقود صيانة الشركات والأساطيل',
    nameEn: 'Fleet & Corporate Contracts',
    implemented: true,
    active: true,
    descriptionAr: 'إدارة اتفاقيات الصيانة المجمعة لشركات تأجير السيارات والأساطيل التجارية.',
  },
  {
    code: 'HR',
    layer: 'OPTIONAL',
    nameAr: 'شؤون الموظفين والورديات',
    nameEn: 'Staff HR & Shifts Management',
    implemented: true,
    active: true,
    descriptionAr: 'جدولة الورديات، تسجيل الحضور والانصراف، وإدارة الإجازات للفريق الفني والإداري.',
  },
  {
    code: 'ADVANCED_REPORTS',
    layer: 'OPTIONAL',
    nameAr: 'التقارير التحليلية والمالية المتقدمة',
    nameEn: 'Advanced Financial & Operational Analytics',
    implemented: true,
    active: true,
    descriptionAr: 'تحليلات الأرباح والخسائر، أكثر الخدمات طلباً، وتقارير أداء الورشة التنفيذية.',
  },
];

async function seedModules() {
  console.log('Seeding canonical platform modules...');

  for (const mod of CANONICAL_MODULES) {
    await prisma.module.upsert({
      where: { code: mod.code },
      update: {
        layer: mod.layer,
        nameAr: mod.nameAr,
        nameEn: mod.nameEn,
        implemented: mod.implemented,
        active: mod.active,
      },
      create: {
        code: mod.code,
        layer: mod.layer,
        nameAr: mod.nameAr,
        nameEn: mod.nameEn,
        implemented: mod.implemented,
        active: mod.active,
      },
    });
    console.log(`  ✓ Module: ${mod.code} (${mod.nameAr})`);
  }

  // Ensure all existing workshops have CORE enabled
  const coreModule = await prisma.module.findUnique({ where: { code: 'CORE' } });
  const marketModule = await prisma.module.findUnique({ where: { code: 'MARKETPLACE_PACK' } });
  const inventoryModule = await prisma.module.findUnique({ where: { code: 'INVENTORY' } });
  const warrantyModule = await prisma.module.findUnique({ where: { code: 'WARRANTY' } });

  const workshops = await prisma.workshop.findMany({ select: { id: true, displayNameAr: true } });

  console.log(`\nChecking entitlements for ${workshops.length} workshops...`);
  for (const ws of workshops) {
    if (coreModule) {
      await prisma.workshopModuleEntitlement.upsert({
        where: {
          workshopId_moduleId: {
            workshopId: ws.id,
            moduleId: coreModule.id,
          },
        },
        update: { state: 'ENABLED' },
        create: {
          workshopId: ws.id,
          moduleId: coreModule.id,
          state: 'ENABLED',
          reason: 'INITIAL_CORE_PROVISION',
        },
      });
    }

    if (marketModule) {
      await prisma.workshopModuleEntitlement.upsert({
        where: {
          workshopId_moduleId: {
            workshopId: ws.id,
            moduleId: marketModule.id,
          },
        },
        update: {},
        create: {
          workshopId: ws.id,
          moduleId: marketModule.id,
          state: 'ENABLED',
          reason: 'ADMIN_MARKETPLACE_PROVISION',
        },
      });
    }

    // Provision demo optional modules (Inventory + Warranty) for demo workshop
    if (inventoryModule) {
      await prisma.workshopModuleEntitlement.upsert({
        where: {
          workshopId_moduleId: {
            workshopId: ws.id,
            moduleId: inventoryModule.id,
          },
        },
        update: {},
        create: {
          workshopId: ws.id,
          moduleId: inventoryModule.id,
          state: 'ENABLED',
          reason: 'DEMO_PROVISION_INVENTORY',
        },
      });
    }
  }

  console.log('✅ Canonical modules seeded successfully!');
}

seedModules()
  .catch((e) => {
    console.error('Failed to seed modules:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

