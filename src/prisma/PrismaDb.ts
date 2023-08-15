import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

export type PrismaContext = {
  prisma: PrismaClient
}

export const default_prisma_context: PrismaContext = { prisma: prisma };
