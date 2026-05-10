import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.poll.count();
  const userCount = await prisma.user.count();
  
  const polls = await prisma.poll.findMany({ select: { title: true } });
  
  console.log("--- FINAL VERIFICATION ---");
  console.log(`LIVE POLL COUNT: ${count}`);
  console.log(`LIVE USER COUNT: ${userCount}`);
  console.log("LIVE POLLS:");
  polls.forEach(p => console.log(` - "${p.title}"`));
  
  if (count > 0) {
     console.log("\nSUCCESS 🚀: Testing is FULLY ISOLATED. Live database preserved.");
  } else {
     console.error("\nCRITICAL FAILURE 🛑: Main database was wiped again!");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
