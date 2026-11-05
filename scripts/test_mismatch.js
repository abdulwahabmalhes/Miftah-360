const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

async function run() {
  const token = jwt.sign(
    {
      sub: '6bc6f9f8-5794-4aa8-8d92-14a582b03368',
      role: 'WORKSHOP_OWNER',
      workshop_id: '2f0af9cc-127d-4c03-8e3b-bd68b26ae3a0',
      workshop_staff_role: 'WORKSHOP_OWNER',
      token_version: 0
    },
    process.env.JWT_SECRET || 'dev_secret_miftah_360_replace_in_prod',
    { expiresIn: '1h' }
  );

  const shockId = '729ccb5c-b305-40ea-b4db-a6c598e496a6';
  // Job from 61ee:
  const jobFromOtherWs = '3db75d19-43fa-493c-ad0a-af07f30fcf1c';

  const res = await fetch(`http://localhost:3000/api/v1/workshop/inventory/items/${shockId}/reserve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      jobId: jobFromOtherWs,
      quantity: 1,
      unitPrice: 460
    })
  });
  console.log('Status with job from other WS:', res.status);
  console.log('Body:', await res.json());
}

run().catch(console.error).finally(() => prisma.$disconnect());

