import { PrismaClient } from "@prisma/client";

// Singleton: em serverless (Vercel) cada invocação "quente" reaproveita a mesma
// instância, evitando estourar o limite de conexões do Postgres.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

globalForPrisma.prisma = prisma;
