import { prisma } from './index.js';
import { vectorUtils } from './vector-utils.js';
import type { Prisma } from './index.js';

export async function seedDatabase() {
  console.log('🌱 Starting database seed...');

  try {
    // Clean existing data
    await prisma.promptCategory.deleteMany();
    await prisma.workflow.deleteMany();
    await prisma.prompt.deleteMany();
    await prisma.category.deleteMany();
    await prisma.logEntry.deleteMany();
    await prisma.user.deleteMany();

    console.log('🧹 Cleaned existing data');

    // Create test user
    const testUser = await prisma.user.create({
      data: {
        email: 'test@ai-doctore.com',
        name: 'Test User',
        emailVerified: true,
      },
    });

    console.log('👤 Created test user');

    // Create categories with hierarchy
    const rootCategory = await prisma.category.create({
      data: {
        path: '/',
        namespace: 'general',
        metadata: {
          description: 'Root category for all prompts',
        },
        embedding: vectorUtils.toJson(vectorUtils.createTestVector(1)) as Prisma.InputJsonValue,
        userId: testUser.id,
      },
    });

    const techCategory = await prisma.category.create({
      data: {
        path: '/technology',
        namespace: 'general',
        parentId: rootCategory.id,
        metadata: {
          description: 'Technology and programming related prompts',
        },
        embedding: vectorUtils.toJson(vectorUtils.createTestVector(2)) as Prisma.InputJsonValue,
        userId: testUser.id,
      },
    });

    const bugCategory = await prisma.category.create({
      data: {
        path: '/technology/bugs',
        namespace: 'general',
        parentId: techCategory.id,
        metadata: {
          description: 'Bug fixes and debugging',
        },
        embedding: vectorUtils.toJson(vectorUtils.createTestVector(3)) as Prisma.InputJsonValue,
        userId: testUser.id,
      },
    });

    const featureCategory = await prisma.category.create({
      data: {
        path: '/technology/features',
        namespace: 'general',
        parentId: techCategory.id,
        metadata: {
          description: 'New features and enhancements',
        },
        embedding: vectorUtils.toJson(vectorUtils.createTestVector(4)) as Prisma.InputJsonValue,
        userId: testUser.id,
      },
    });

    console.log('📁 Created category hierarchy');

    // Create sample prompts
    const bugPrompt = await prisma.prompt.create({
      data: {
        rawPrompt: 'Fix the login bug where users cannot sign in',
        instruction: 'Debug and fix the authentication issue preventing users from signing in to the application',
        workflowType: 'bug',
        complexity: 'medium',
        score: 85,
        successCriteria: [
          'Users can successfully sign in',
          'Error handling is improved',
          'Tests are added to prevent regression',
        ],
        constraints: [
          'Maintain backward compatibility',
          'Do not break existing sessions',
        ],
        context: {
          files: ['auth/login.ts', 'auth/session.ts'],
          error: 'TypeError: Cannot read property of undefined',
        },
        embedding: vectorUtils.toJson(vectorUtils.createTestVector(10)) as Prisma.InputJsonValue,
        userId: testUser.id,
        categories: {
          create: [
            {
              categoryId: bugCategory.id,
              confidence: 0.95,
            },
          ],
        },
      },
    });

    const featurePrompt = await prisma.prompt.create({
      data: {
        rawPrompt: 'Add dark mode toggle to settings',
        instruction: 'Implement a dark mode toggle in the application settings that persists user preference',
        workflowType: 'feature',
        complexity: 'high',
        score: 92,
        successCriteria: [
          'Dark mode toggle is functional',
          'User preference is persisted',
          'All components support dark mode',
          'Smooth transition between modes',
        ],
        constraints: [
          'Use existing theme system',
          'Ensure accessibility compliance',
          'Support system preference detection',
        ],
        context: {
          components: ['Settings.tsx', 'ThemeProvider.tsx'],
          storage: 'localStorage',
        },
        embedding: vectorUtils.toJson(vectorUtils.createTestVector(20)) as Prisma.InputJsonValue,
        userId: testUser.id,
        categories: {
          create: [
            {
              categoryId: featureCategory.id,
              confidence: 0.88,
            },
          ],
        },
      },
    });

    console.log('📝 Created sample prompts');

    // Create workflow for feature prompt
    await prisma.workflow.create({
      data: {
        promptId: featurePrompt.id,
        name: 'Dark Mode Implementation',
        description: 'Multi-step workflow for implementing dark mode feature',
        status: 'PENDING',
        executionPlan: {
          steps: [
            { step: 1, task: 'Analyze existing theme system', duration: 30 },
            { step: 2, task: 'Design dark mode color palette', duration: 45 },
            { step: 3, task: 'Implement theme toggle component', duration: 60 },
            { step: 4, task: 'Update all components for dark mode', duration: 120 },
            { step: 5, task: 'Add persistence logic', duration: 30 },
            { step: 6, task: 'Write tests', duration: 45 },
          ],
        },
        agents: [
          { type: 'ui-engineer', priority: 'high', task: 'Component implementation' },
          { type: 'designer', priority: 'medium', task: 'Color palette design' },
        ],
        userId: testUser.id,
      },
    });

    console.log('🔄 Created sample workflow');

    // Create sample log entries
    await prisma.logEntry.createMany({
      data: [
        {
          level: 'INFO',
          message: 'Database seeding started',
          source: 'seed.ts',
          userId: testUser.id,
        },
        {
          level: 'DEBUG',
          message: 'Creating test data',
          source: 'seed.ts',
          data: { categories: 4, prompts: 2 },
        },
        {
          level: 'WARN',
          message: 'pgvector extension not detected, using JSON storage',
          source: 'vector-utils.ts',
        },
      ],
    });

    console.log('📊 Created sample log entries');

    // Check pgvector status
    const pgvectorCheck = await prisma.$queryRaw<[{ installed: boolean }]>`
      SELECT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'vector'
      ) as installed
    `;

    if (pgvectorCheck[0].installed) {
      console.log('✅ pgvector extension is installed');
    } else {
      console.log('⚠️  pgvector extension not found - using JSON storage for embeddings');
      console.log('   To enable pgvector, run: CREATE EXTENSION IF NOT EXISTS vector;');
    }

    // Summary
    const counts = {
      users: await prisma.user.count(),
      categories: await prisma.category.count(),
      prompts: await prisma.prompt.count(),
      workflows: await prisma.workflow.count(),
      logs: await prisma.logEntry.count(),
    };

    console.log('\n📊 Seed Summary:');
    console.log(`   Users: ${counts.users}`);
    console.log(`   Categories: ${counts.categories}`);
    console.log(`   Prompts: ${counts.prompts}`);
    console.log(`   Workflows: ${counts.workflows}`);
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