import { Prisma, PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

export type MockPrismaContext = {
  prisma: DeepMockProxy<PrismaClient>
}

export const createMockPrismaContext = (): MockPrismaContext => {
  return {
    prisma: mockDeep<PrismaClient>(),
  }
}

export const createKnownRequestErrorRecordNotFound = (
  message: string = "RecordNotFound",
  client_version: string = "5.1.1"
): Prisma.PrismaClientKnownRequestError => new Prisma.PrismaClientKnownRequestError(
  message,
  {
    code: "P2025",
    clientVersion: client_version
  }
);

export const createUniqueConstraintError = (constraint: string, client_version: string = "5.1.1"): Prisma.PrismaClientKnownRequestError => new Prisma.PrismaClientKnownRequestError(
  `Unique constraint failed on the ${constraint}`,
  {
    code: "P2002",
    clientVersion: client_version
  }
)

export const createForeignKeyConstraintError = (field_name: string, client_version: string = "5.1.1"): Prisma.PrismaClientKnownRequestError => new Prisma.PrismaClientKnownRequestError(
  `Foreign key constraint failed on the field: ${field_name}`,
  {
    code: "P2003",
    clientVersion: client_version
  }
)