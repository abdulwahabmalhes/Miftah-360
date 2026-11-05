require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const ws = await prisma.workshop.findFirst({ where: { displayNameAr: { contains: 'مفتاح' } } });
  if (!ws) {
    console.log('No workshop found with مفتاح in displayNameAr');
    return;
  }
  console.log(`Workshop: ${ws.displayNameAr} (ID: ${ws.id})`);

  const svcs = await prisma.workshopService.findMany({
    where: { workshopId: ws.id },
    include: { service: true },
  });
  console.log(`Services configured for this workshop: ${svcs.length}`);
  svcs.forEach(s => {
    console.log(` - ${s.service.nameAr} (${s.service.code}): enabled=${s.enabled}, price=${s.startingPriceAmount}`);
  });

  const ents = await prisma.workshopModuleEntitlement.findMany({
    where: { workshopId: ws.id },
    include: { module: true },
  });
  console.log(`\nModules for this workshop: ${ents.length}`);
  ents.forEach(e => {
    console.log(` - ${e.module.code} (${e.module.nameAr}): state=${e.state}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
