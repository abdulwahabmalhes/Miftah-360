const path = require('path');
const EmbeddedPostgres = require('embedded-postgres').default || require('embedded-postgres');

async function main() {
  const dbDir = path.join(__dirname, '../data/db');
  console.log('🚀 Initializing real PostgreSQL server...');
  console.log(`📁 Database directory: ${dbDir}`);

  const pg = new EmbeddedPostgres({
    databaseDir: dbDir,
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    persistent: true,
    initdbFlags: ['--encoding=UTF8', '--locale=C'],
  });

  try {
    await pg.initialise();
    console.log('✅ PostgreSQL initialised successfully.');
  } catch (err) {
    console.log(`ℹ️ Initialise notice (likely already initialised): ${err.message}`);
  }

  await pg.start();
  console.log('🟢 Real PostgreSQL server running on port 5432!');

  try {
    await pg.createDatabase('miftah360');
    console.log('✅ Created database: miftah360');
  } catch (err) {
    console.log(`ℹ️ Database miftah360 already exists or notice: ${err.message}`);
  }

  console.log('🎉 Ready for Prisma migrations, seed, and NestJS API connections.');
  
  // Keep process alive
  setInterval(() => {}, 10000);
}

main().catch((err) => {
  console.error('❌ Failed to run PostgreSQL:', err);
  process.exit(1);
});
