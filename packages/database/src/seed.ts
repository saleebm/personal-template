import { prisma } from './index.js';

export async function seedDatabase() {
  console.log('🌱 Starting database seed...');

  try {
    // Clean existing data
    await prisma.logEntry.deleteMany();

    console.log('🧹 Cleaned existing data');

    // Create sample log entries
    await prisma.logEntry.createMany({
      data: [
        {
          level: 'INFO',
          message: 'Database seeding started',
          source: 'seed.ts',
        },
        {
          level: 'DEBUG',
          message: 'Creating test data',
          source: 'seed.ts',
          data: { timestamp: new Date().toISOString() },
        },
        {
          level: 'INFO',
          message: 'Application started successfully',
          source: 'app.ts',
          duration: 1250,
        },
        {
          level: 'WARN',
          message: 'High memory usage detected',
          source: 'monitor.ts',
          memory: BigInt(1024 * 1024 * 512), // 512MB
        },
        {
          level: 'ERROR',
          message: 'Failed to connect to external service',
          source: 'api-client.ts',
          stack: 'Error: Connection timeout\n    at connectToService (api-client.ts:42)',
          duration: 5000,
        },
      ],
    });

    console.log('📊 Created sample log entries');

    // Summary
    const counts = {
      logs: await prisma.logEntry.count(),
    };

    console.log('\n📊 Seed Summary:');
    console.log(`   Log Entries: ${counts.logs}`);

    console.log('\n✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seed if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}