const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const ws1 = await prisma.workshop.findUnique({
    where: { id: '2f0af9cc-127d-4c03-8e3b-bd68b26ae3a0' },
    include: {
      owner: { select: { id: true, email: true, fullName: true } },
      staff: { include: { user: { select: { id: true, email: true, fullName: true } } } }
    }
  });
  console.log('=== WORKSHOP 2f0af9cc-127d-4c03-8e3b-bd68b26ae3a0 ===', JSON.stringify(ws1, null, 2));

  const ws2 = await prisma.workshop.findUnique({
    where: { id: '61ee4a0f-8a4d-4d1a-bb75-4d75d058c228' },
    include: {
      owner: { select: { id: true, email: true, fullName: true } },
      staff: { include: { user: { select: { id: true, email: true, fullName: true } } } }
    }
  });
  console.log('=== WORKSHOP 61ee4a0f-8a4d-4d1a-bb75-4d75d058c228 ===', JSON.stringify(ws2, null, 2));
}

run().catch(console.error).finally(() => prisma.$disconnect());
