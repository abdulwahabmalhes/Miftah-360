require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const ws = await prisma.workshop.findFirst({
    where: { displayNameAr: { contains: 'مفتاح' } },
  });

  if (!ws) {
    console.error('Demo workshop not found');
    return;
  }

  console.log(`Configuring services for workshop: ${ws.displayNameAr} (${ws.id})`);

  // Canonical services to enable for demo workshop
  const serviceConfigs = [
    { code: 'MAINT_OIL_CHANGE', price: 150, notes: 'يشمل زيت تخليقي 5W-30 وفلتر أصلي وكشف 20 نقطة' },
    { code: 'MAINT_MINOR_SERVICE', price: 250, notes: 'صيانة دورية خفيفة مع فحص السوائل والفلاتر' },
    { code: 'MAINT_MAJOR_SERVICE', price: 650, notes: 'صيانة دورية شاملة مع استبدال البواجي وسيور المحرك' },
    { code: 'MECH_BRAKES', price: 220, notes: 'فحص وتبديل سفايف الفرامل الأمامية أو الخلفية' },
    { code: 'AC_GAS_REFILL', price: 280, notes: 'فحص تسريب دورة التكييف وتعبئة غاز R134a أصلي' },
    { code: 'TYRE_ALIGNMENT', price: 180, notes: 'ميزان إلكتروني ليزري ثلاثي الأبعاد لزوايا العجلات' },
    { code: 'CARE_POLISHING', price: 350, notes: 'تلميع ساطع خارجي وغسيل داخلي بالبخار' },
    { code: 'CARE_CERAMIC', price: 1200, notes: 'نانو سيراميك 9H ثلاث طبقات مع ضمان سنة' },
    { code: 'CARE_TINT', price: 450, notes: 'تظليل عازل للحرارة معتمد مع ضمان 5 سنوات' },
  ];

  for (const conf of serviceConfigs) {
    const srv = await prisma.service.findUnique({ where: { code: conf.code } });
    if (srv) {
      await prisma.workshopService.upsert({
        where: {
          workshopId_serviceId: {
            workshopId: ws.id,
            serviceId: srv.id,
          },
        },
        update: {
          enabled: true,
          startingPriceAmount: conf.price,
          currency: 'AED',
          notes: conf.notes,
        },
        create: {
          workshopId: ws.id,
          serviceId: srv.id,
          enabled: true,
          startingPriceAmount: conf.price,
          currency: 'AED',
          notes: conf.notes,
        },
      });
      console.log(`  ✓ Enabled service: ${srv.nameAr} (${conf.code}) - Starting from ${conf.price} AED`);
    } else {
      console.warn(`  ✗ Service code not found: ${conf.code}`);
    }
  }

  console.log('✅ Demo workshop services configured successfully!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
