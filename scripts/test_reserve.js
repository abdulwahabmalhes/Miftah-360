const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  // Login as owner@workshop.local
  const loginRes = await fetch('http://localhost:3000/api/v1/auth/login/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner@workshop.local', password: 'ReviewPass123!' })
  });
  const loginData = await loginRes.json();
  console.log('Login status:', loginRes.status);
  console.log('User workshop_id:', loginData.user?.workshopId);

  const token = loginData.accessToken;

  // Find an active job in this workshop
  const jobsRes = await fetch('http://localhost:3000/api/v1/workshop/inventory/active-jobs', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const jobsData = await jobsRes.json();
  console.log('Active jobs count:', jobsData?.length, 'First job:', jobsData?.[0]);

  // Call reserve
  const itemId = '729ccb5c-b305-40ea-b4db-a6c598e496a6';
  const reserveRes = await fetch(`http://localhost:3000/api/v1/workshop/inventory/items/${itemId}/reserve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      jobId: jobsData?.[0]?.id || 'fake-job-id',
      quantity: 1,
      unitPrice: 460,
      notes: 'Test reserve'
    })
  });
  console.log('Reserve status:', reserveRes.status);
  const reserveData = await reserveRes.json();
  console.log('Reserve response:', JSON.stringify(reserveData, null, 2));
}

run().catch(console.error).finally(() => prisma.$disconnect());
