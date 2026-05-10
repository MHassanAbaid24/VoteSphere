import { PrismaClient } from '@prisma/client';

// Connect to default 'postgres' database rather than 'votesphere'
// to ensure we have permission to create other databases.
const mainDbUrl = "postgresql://postgres:password123@localhost:5432/postgres?schema=public";
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: mainDbUrl
    }
  }
});

async function main() {
  const dbName = 'votesphere_test';
  
  console.log(`Checking if database "${dbName}" exists...`);
  
  const result = await prisma.$queryRawUnsafe<{ datname: string }[]>(
    `SELECT datname FROM pg_database WHERE datname = '${dbName}'`
  );
  
  if (result.length > 0) {
    console.log(`Database "${dbName}" already exists. Skipping creation.`);
  } else {
    console.log(`Creating database "${dbName}"...`);
    // Note: CREATE DATABASE cannot run inside a transaction block. 
    // Prisma normally runs queryRaw without an explicit transaction unless wrapped.
    await prisma.$executeRawUnsafe(`CREATE DATABASE ${dbName}`);
    console.log(`Database "${dbName}" created successfully.`);
  }
}

main()
  .catch(e => {
    console.error('Error creating database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
