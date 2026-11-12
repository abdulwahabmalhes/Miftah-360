const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: 'owner@workshop.local' },
    include: {
      ownedWorkshops: true,
      staffMemberships: { include: { workshop: true } }
    }
  });

  console.log('User:', user?.id, user?.email);
  console.log('Owned Workshops:');
  user?.ownedWorkshops.forEach(w => console.log(' -', w.id, w.displayNameAr));
  console.log('Staff Memberships:');
  user?.staffMemberships.forEach(s => console.log(' - role:', s.role, 'ws:', s.workshopId, s.workshop?.displayNameAr));
}

main().catch(console.error).finally(() => prisma.$disconnect());
