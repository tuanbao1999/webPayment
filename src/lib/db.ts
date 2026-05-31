import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL ?? "";
  const isTurso =
    url.startsWith("libsql://") ||
    url.startsWith("https://") ||
    url.startsWith("http://");

  if (isTurso) {
    const { PrismaLibSQL } = require("@prisma/adapter-libsql") as typeof import("@prisma/adapter-libsql");
    const adapter = new PrismaLibSQL({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
