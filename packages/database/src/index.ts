import { PrismaClient } from "../generated/client/index.js";

// Create a singleton instance of Prisma Client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env["NODE_ENV"] === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env["NODE_ENV"] !== "production") {
  globalForPrisma.prisma = prisma;
}

// Export all Prisma types and enums
export * from "../generated/client/index.js";

// Export utility functions
export { seedDatabase } from "./seed.js";
export { vectorUtils } from "./vector-utils.js";

// Database connection utilities
export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  console.log("Database disconnected");
}

// Health check
export async function checkDatabaseHealth(): Promise<{
  connected: boolean;
  version?: string;
  error?: string;
}> {
  try {
    const result = await prisma.$queryRaw<
      [{ version: string }]
    >`SELECT version()`;
    return {
      connected: true,
      version: result[0].version,
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// pgvector extension check
export async function checkPgVectorExtension(): Promise<{
  installed: boolean;
  version?: string;
}> {
  try {
    const result = await prisma.$queryRaw<[{ extversion: string }]>`
      SELECT extversion FROM pg_extension WHERE extname = 'vector'
    `;
    return {
      installed: true,
      version: result[0]?.extversion,
    };
  } catch {
    return {
      installed: false,
    };
  }
}

// Enable pgvector extension (requires superuser privileges)
export async function enablePgVector(): Promise<boolean> {
  try {
    await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS vector`;
    console.log("✅ pgvector extension enabled");
    return true;
  } catch (error) {
    console.error("❌ Failed to enable pgvector:", error);
    return false;
  }
}
