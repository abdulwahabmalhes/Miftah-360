const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function run() {
  const user = await prisma.user.findUnique({
    where: { email: 'owner@workshop.local' },
    include: {
      staffMemberships: {
        include: {
          workshop: {
            include: {
              entitlements: {
                include: {
                  module: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const w = user.staffMemberships[0].workshop;
  console.log('Workshop ID:', w.id);
  console.log('Workshop Name:', w.nameAr);
  console.log('Entitlements count:', w.entitlements.length);
  for (const e of w.entitlements) {
    console.log(`- ${e.module.code}: ${e.state}`);
  }
  await prisma.$disconnect();
}

run().catch(console.error);

