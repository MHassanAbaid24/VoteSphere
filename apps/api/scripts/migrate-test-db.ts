import { spawnSync } from 'child_process';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load and FORCE OVERRIDE any existing environment variables with the .env.test values
const envPath = path.resolve(__dirname, '../.env.test');
dotenv.config({ path: envPath, override: true });

// Enforce critical vars
process.env.NODE_ENV = 'test';
// Double check URL was loaded
if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.includes('votesphere_test')) {
   console.error("🚨 SECURITY FAULT: Target database does not point to votesphere_test!");
   console.error(`URL resolved to: ${process.env.DATABASE_URL}`);
   process.exit(1);
}

console.log('🔄 FORCING Test Database Environment Isolation...');
console.log(`🎯 TARGET DATABASE: ${process.env.DATABASE_URL}`);

try {
  console.log('\n🛠️  Step 1/2: Synchronizing test schema...');
  spawnSync('bunx prisma db push --accept-data-loss', {
    stdio: 'inherit',
    shell: true,
    env: process.env
  });

  const vitestArgs = process.argv.slice(2);
  const command = vitestArgs.length > 0 ? `vitest ${vitestArgs.join(' ')}` : `vitest run`;

  console.log(`\n🚀 Step 2/2: Launching test suite... (${command})`);
  const testResult = spawnSync(`bunx ${command}`, {
    stdio: 'inherit',
    shell: true,
    env: process.env // MUST be passed here to force inheritance
  });
  
  process.exit(testResult.status ?? 0);
} catch (error) {
  console.error('❌ Execution aborted due to error.');
  process.exit(1);
}
