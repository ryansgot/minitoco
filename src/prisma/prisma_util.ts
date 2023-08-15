import { Prisma } from "@prisma/client";
import { NotFoundError } from "@prisma/client/runtime/library";

export const isPrismaRecordNotFoundError = (error: any): boolean => {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
    return true;
  }
  // We're not supposed to check for this error, but we do it anyway 
  // because Prisma's documentation for update does not make it clear that
  // this will not be the error that is thrown. Additionally, I found this:
  // https://github.com/prisma/prisma/commit/73a21f7a4e71d91724206837585da81d1032e6aa
  // which indicates that this error will be thrown without being wrapped.
  // This came from the 4.7.0 release notes.
  if (error instanceof NotFoundError) {
    return true;
  }
  return false;
}

/**
 * @param error the object that was caught from the try/catch block
 * @returns true if the error is a unique constraint error a 
 * (PrismaClientKnownRequestError with code P2002)
 */
export const isPrismaUniqueConstraintError = (error: any): boolean => {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

/**
 * @param error the object that was caught from the try/catch block
 * @returns true if the error is a foreign key constraint error
 */
export const isPrismaForeignKeyConstraintError = (error: any): boolean => {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003";
}

/**
 * You have to extract the field name from the error message in order to know
 * which field's foreign key constraint was violated. This function parses the
 * error message and sends it back to you if the error object passed in is a
 * foreign key constraint error.
 * 
 * @param error the object that was caught from the try/catch block
 * @returns the field name that caused the foreign key constraint error
 */
export const fieldNameOfForeignKeyConstraintError = (error: any): string | undefined => {
  if (isPrismaForeignKeyConstraintError(error)) {
    const message: string = error.message;
    const field_name = message.split(" ").slice(-1)[0];
    return field_name;
  }
  return undefined;
}