const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

const workshopIds = [
  '61ee4a0f-8a4d-4d1a-bb75-4d75d058c228',
  '2f0af9cc-127d-4c03-8e3b-bd68b26ae3a0',
];

const categoriesData = [
  {
    nameAr: 'الفرامل',
    nameEn: 'Brakes',
    icon: 'disc',
    sortOrder: 1,
    subcategories: [
      {
        nameAr: 'فحمات الفرامل',
        nameEn: 'Brake Pads',
        sortOrder: 1,
        items: [
          {
            sku: 'BRK-CAM-01',
            oemPartNumber: '04465-33471',
            nameAr: 'فحمات أمامية لكامري',
            nameEn: 'Front Brake Pads Camry',
            brand: 'Toyota Genuine / Akebono',
            qualityTier: 'OEM',
            unit: 'طقم',
            onHandQty: 10,
            reservedQty: 3,
            reorderLevel: 4,
            costPrice: 120,
            sellingPrice: 220,
            location: 'مستودع أ - رف 1',
            compatibleVehicles: 'Toyota Camry 2018-2024, Avalon 2019+',
            descriptionAr: 'فحمات سيراميك أصلية توفر أداء كبح عالي وثابت دون ضوضاء أو غبار أسود.',
            supplierName: 'مجموعة الفطيم لقطع الغيار الأصلية',
            warrantyMonths: 12,
          },
        ],
      },
      {
        nameAr: 'أقراص الفرامل',
        nameEn: 'Brake Rotors',
        sortOrder: 2,
        items: [
          {
            sku: 'ROT-LC-01',
            oemPartNumber: '43512-60191',
            nameAr: 'قرص فرامل أمامي مهوى لاندكروزر',
            nameEn: 'Front Ventilated Brake Rotor LC300',
            brand: 'Toyota Genuine',
            qualityTier: 'OEM',
            unit: 'قطعة',
            onHandQty: 6,
            reservedQty: 1,
            reorderLevel: 2,
            costPrice: 240,
            sellingPrice: 390,
            location: 'مستودع أ - رف 2',
            compatibleVehicles: 'Toyota Land Cruiser LC200 / LC300, Lexus LX570',
            descriptionAr: 'هوب فرامل أصلي معالج حرارياً لمقاومة الاعوجاج وتبديد الحرارة بكفاءة.',
            supplierName: 'مجموعة الفطيم لقطع الغيار الأصلية',
            warrantyMonths: 12,
          },
        ],
      },
    ],
  },
  {
    nameAr: 'الفلاتر',
    nameEn: 'Filters',
    icon: 'filter',
    sortOrder: 2,
    subcategories: [
      {
        nameAr: 'فلاتر الزيت',
        nameEn: 'Oil Filters',
        sortOrder: 1,
        items: [
          {
            sku: 'FLT-OIL-01',
            oemPartNumber: '04152-YZZA1',
            nameAr: 'فلتر زيت للمحرك V6 / V8',
            nameEn: 'Engine Oil Filter Cartridge',
            brand: 'Toyota Denso',
            qualityTier: 'OEM',
            unit: 'قطعة',
            onHandQty: 24,
            reservedQty: 4,
            reorderLevel: 8,
            costPrice: 28,
            sellingPrice: 55,
            location: 'مستودع أ - رف 4',
            compatibleVehicles: 'Camry, Avalon, RAV4, Land Cruiser, Prado',
            descriptionAr: 'فلتر زيت أصلي مزود بربلات إحكام أصلية لحماية المحرك من الرواسب الدقيقة.',
            supplierName: 'مجموعة الفطيم لقطع الغيار الأصلية',
            warrantyMonths: 6,
          },
        ],
      },
      {
        nameAr: 'فلاتر الهواء والمكيف',
        nameEn: 'Air & Cabin Filters',
        sortOrder: 2,
        items: [
          {
            sku: 'FLT-CAB-02',
            oemPartNumber: '87139-50100',
            nameAr: 'فلتر مكيف كربون نشط مضاد للبكتيريا',
            nameEn: 'Active Carbon Cabin Filter',
            brand: 'Bosch Premium',
            qualityTier: 'AFTERMARKET_PREMIUM',
            unit: 'قطعة',
            onHandQty: 12,
            reservedQty: 2,
            reorderLevel: 4,
            costPrice: 45,
            sellingPrice: 95,
            location: 'مستودع أ - رف 5',
            compatibleVehicles: 'Toyota, Lexus معظم الموديلات الحديثة',
            descriptionAr: 'فلتر كربون نشط يمتص الروائح والغازات العادمة بنقاء 99%.',
            supplierName: 'الرستماني لقطع الغيار',
            warrantyMonths: 6,
          },
        ],
      },
    ],
  },
  {
    nameAr: 'الزيوت والسوائل',
    nameEn: 'Oils & Fluids',
    icon: 'droplet',
    sortOrder: 3,
    subcategories: [
      {
        nameAr: 'زيت المحرك',
        nameEn: 'Engine Oil',
        sortOrder: 1,
        items: [
          {
            sku: 'OIL-5W30-01',
            oemPartNumber: 'CAS-5W30-4L',
            nameAr: 'زيت محرك 5W-30 تخليقي كامل (Castrol EDGE)',
            nameEn: 'Full Synthetic Engine Oil 5W-30',
            brand: 'Castrol EDGE',
            qualityTier: 'OEM',
            unit: 'لتر',
            onHandQty: 48,
            reservedQty: 8,
            reorderLevel: 10,
            costPrice: 85,
            sellingPrice: 150,
            location: 'مستودع ب - قسم الزيوت',
            compatibleVehicles: 'كافة محركات البنزين الحديثة ذات التيربو والحقن المباشر',
            descriptionAr: 'زيت تخليقي فائق معزز بتقنية Fluid TITANIUM لأقصى حماية عند الضغط العالي.',
            supplierName: 'الشركة العربية لتجارة وتوزيع الزيوت',
            warrantyMonths: 6,
          },
        ],
      },
    ],
  },
  {
    nameAr: 'الكهرباء',
    nameEn: 'Electrical',
    icon: 'zap',
    sortOrder: 4,
    subcategories: [
      {
        nameAr: 'البطاريات',
        nameEn: 'Batteries',
        sortOrder: 1,
        items: [
          {
            sku: 'BAT-65AH-01',
            oemPartNumber: '28800-YZZJA',
            nameAr: 'بطارية 65Ah أصلية بتقنية AGM',
            nameEn: 'Automotive AGM Battery 65Ah',
            brand: 'VARTA / GS Yuasa',
            qualityTier: 'OEM',
            unit: 'قطعة',
            onHandQty: 7,
            reservedQty: 1,
            reorderLevel: 3,
            costPrice: 260,
            sellingPrice: 420,
            location: 'قسم البطاريات - منصة 1',
            compatibleVehicles: 'سيدان وسيارات SUV متوسطة الحجم بنظام Start-Stop',
            descriptionAr: 'بطارية جافة عالية القدرة على بدء التشغيل في درجات حرارة الخليج القصوى مع ضمان استبدال سنتين.',
            supplierName: 'الرستماني لقطع الغيار',
            warrantyMonths: 24,
          },
        ],
      },
    ],
  },
  {
    nameAr: 'التعليق والتوجيه',
    nameEn: 'Suspension & Steering',
    icon: 'activity',
    sortOrder: 5,
    subcategories: [
      {
        nameAr: 'المساعدات',
        nameEn: 'Shock Absorbers',
        sortOrder: 1,
        items: [
          {
            sku: 'SHK-FR-01',
            oemPartNumber: '48510-80542',
            nameAr: 'مساعد أمامي يمين غاز وهيدروليك',
            nameEn: 'Front Right Gas Shock Absorber',
            brand: 'KYB Excel-G',
            qualityTier: 'OES',
            unit: 'قطعة',
            onHandQty: 4,
            reservedQty: 1,
            reorderLevel: 2,
            costPrice: 280,
            sellingPrice: 460,
            location: 'مستودع أ - رف ثقيل 1',
            compatibleVehicles: 'Toyota Camry 2018+, Avalon 2019+',
            descriptionAr: 'مساعد غاز معتمد يعيد ثبات وتوازن المصنع للسيارة.',
            supplierName: 'مجموعة الفطيم لقطع الغيار الأصلية',
            warrantyMonths: 12,
          },
        ],
      },
    ],
  },
];

async function seed() {
  console.log('Seeding real production inventory structure...');

  for (const workshopId of workshopIds) {
    const workshop = await prisma.workshop.findUnique({
      where: { id: workshopId },
      include: { jobs: { take: 2, include: { vehicle: true } } },
    });
    if (!workshop) {
      console.log(`Workshop ${workshopId} not found, skipping.`);
      continue;
    }

    console.log(`\n======================================================`);
    console.log(`Setting up inventory for workshop: ${workshop.displayNameAr} (${workshop.id})`);
    console.log(`======================================================`);

    for (const catData of categoriesData) {
      const category = await prisma.inventoryCategory.upsert({
        where: {
          workshopId_nameAr: {
            workshopId,
            nameAr: catData.nameAr,
          },
        },
        update: {
          nameEn: catData.nameEn,
          icon: catData.icon,
          sortOrder: catData.sortOrder,
          isArchived: false,
        },
        create: {
          workshopId,
          nameAr: catData.nameAr,
          nameEn: catData.nameEn,
          icon: catData.icon,
          sortOrder: catData.sortOrder,
        },
      });

      console.log(`📁 Category: ${category.nameAr} (${category.id})`);

      for (const subcatData of catData.subcategories) {
        const subcategory = await prisma.inventorySubcategory.upsert({
          where: {
            workshopId_categoryId_nameAr: {
              workshopId,
              categoryId: category.id,
              nameAr: subcatData.nameAr,
            },
          },
          update: {
            nameEn: subcatData.nameEn,
            sortOrder: subcatData.sortOrder,
            isArchived: false,
          },
          create: {
            workshopId,
            categoryId: category.id,
            nameAr: subcatData.nameAr,
            nameEn: subcatData.nameEn,
            sortOrder: subcatData.sortOrder,
          },
        });

        console.log(`  📂 Subcategory: ${subcategory.nameAr} (${subcategory.id})`);

        for (const itemData of subcatData.items) {
          const item = await prisma.inventoryItem.upsert({
            where: {
              workshopId_sku: {
                workshopId,
                sku: itemData.sku,
              },
            },
            update: {
              categoryId: category.id,
              subcategoryId: subcategory.id,
              oemPartNumber: itemData.oemPartNumber,
              nameAr: itemData.nameAr,
              nameEn: itemData.nameEn,
              brand: itemData.brand,
              qualityTier: itemData.qualityTier,
              unit: itemData.unit,
              onHandQty: itemData.onHandQty,
              reservedQty: itemData.reservedQty,
              reorderLevel: itemData.reorderLevel,
              costPrice: itemData.costPrice,
              sellingPrice: itemData.sellingPrice,
              location: itemData.location,
              compatibleVehicles: itemData.compatibleVehicles,
              descriptionAr: itemData.descriptionAr,
              supplierName: itemData.supplierName,
              warrantyMonths: itemData.warrantyMonths,
              status: 'ACTIVE',
            },
            create: {
              workshopId,
              categoryId: category.id,
              subcategoryId: subcategory.id,
              sku: itemData.sku,
              oemPartNumber: itemData.oemPartNumber,
              nameAr: itemData.nameAr,
              nameEn: itemData.nameEn,
              brand: itemData.brand,
              qualityTier: itemData.qualityTier,
              unit: itemData.unit,
              onHandQty: itemData.onHandQty,
              reservedQty: itemData.reservedQty,
              reorderLevel: itemData.reorderLevel,
              costPrice: itemData.costPrice,
              sellingPrice: itemData.sellingPrice,
              location: itemData.location,
              compatibleVehicles: itemData.compatibleVehicles,
              descriptionAr: itemData.descriptionAr,
              supplierName: itemData.supplierName,
              warrantyMonths: itemData.warrantyMonths,
              status: 'ACTIVE',
            },
          });

          console.log(`    📦 Item: ${item.nameAr} [SKU: ${item.sku}] (On Hand: ${item.onHandQty}, Reserved: ${item.reservedQty}, Available: ${Number(item.onHandQty) - Number(item.reservedQty)})`);

          // Create Initial Stock movement if not present
          const existingMovement = await prisma.inventoryMovement.findFirst({
            where: { workshopId, itemId: item.id, movementType: 'INITIAL_STOCK' },
          });

          if (!existingMovement) {
            await prisma.inventoryMovement.create({
              data: {
                workshopId,
                itemId: item.id,
                movementType: 'INITIAL_STOCK',
                quantity: itemData.onHandQty,
                previousOnHand: 0,
                newOnHand: itemData.onHandQty,
                previousReserved: 0,
                newReserved: 0,
                unitCost: itemData.costPrice,
                unitPrice: itemData.sellingPrice,
                referenceType: 'INITIAL',
                referenceId: 'OPENING_BALANCE',
                notes: 'رصيد افتتاحي معتمد عند إطلاق المنظومة',
              },
            });
            console.log(`      📝 Recorded INITIAL_STOCK movement (${itemData.onHandQty})`);
          }

          // If workshop has jobs and this item has reserved qty > 0, create a JobPartReservation
          if (workshop.jobs.length > 0 && itemData.reservedQty > 0) {
            const targetJob = workshop.jobs[0];
            const existingRes = await prisma.jobPartReservation.findFirst({
              where: { workshopId, jobId: targetJob.id, itemId: item.id },
            });

            if (!existingRes) {
              const res = await prisma.jobPartReservation.create({
                data: {
                  workshopId,
                  jobId: targetJob.id,
                  itemId: item.id,
                  requestedQty: itemData.reservedQty,
                  reservedQty: itemData.reservedQty,
                  dispensedQty: 0,
                  returnedQty: 0,
                  shortageQty: 0,
                  unitPrice: itemData.sellingPrice,
                  status: 'RESERVED',
                  notes: `حجز معتمد لصيانة سيارة ${targetJob.vehicle?.plateNumber || 'العميل'}`,
                },
              });

              await prisma.inventoryMovement.create({
                data: {
                  workshopId,
                  itemId: item.id,
                  movementType: 'JOB_RESERVATION',
                  quantity: itemData.reservedQty,
                  previousOnHand: itemData.onHandQty,
                  newOnHand: itemData.onHandQty,
                  previousReserved: 0,
                  newReserved: itemData.reservedQty,
                  unitPrice: itemData.sellingPrice,
                  referenceType: 'JOB',
                  referenceId: targetJob.id,
                  notes: `حجز ${itemData.reservedQty} قطعة لأمر صيانة #${targetJob.id.slice(0, 8)}`,
                },
              });
              console.log(`      🔒 Job reservation created for Job #${targetJob.id.slice(0, 8)}`);
            }
          }
        }
      }
    }
  }

  console.log('\n✅ Demo inventory successfully seeded and verified!');
  await prisma.$disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

