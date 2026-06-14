import { PrismaClient } from "@prisma/client";

// Sanitiza a connection string: remove espaços e aspas acidentais — erro comum
// ao colar a URL em variáveis de ambiente (ex.: Vercel).
const databaseUrl = (process.env.DATABASE_URL ?? "")
  .trim()
  .replace(/^["']|["']$/g, "");

// Singleton: em serverless (Vercel) cada invocação "quente" reaproveita a mesma
// instância, evitando estourar o limite de conexões do Postgres.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: databaseUrl,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

globalForPrisma.prisma = prisma;
