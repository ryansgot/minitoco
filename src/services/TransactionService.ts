import { Prisma } from "@prisma/client";
import { MiniTocoTransactionBuilder, MiniTocoTransactionResult, MiniTocoTransactionResultBuilder } from "../io_models/MiniTocoTransaction";
import { PrismaContext } from "../prisma/PrismaDb"
import { fieldNameOfForeignKeyConstraintError, isPrismaForeignKeyConstraintError, isPrismaRecordNotFoundError } from "../prisma/prisma_util";
import { ITransactionService, TransactionInsufficientFundsError } from "./ITransactionService"
import { UserIDNotFoundError } from "./IUserService";

export const createTransactionService = (prisma_context: PrismaContext): ITransactionService => new TransactionService(prisma_context);

class TransactionService implements ITransactionService {

  private readonly prisma_context: PrismaContext;

  constructor(prisma_context: PrismaContext) {
    this.prisma_context = prisma_context;
  }
  
  async createTransaction(amount: bigint, from_user_id: string, to_user_id: string): Promise<MiniTocoTransactionResult> {
    return this.prisma_context.prisma.$transaction(async (tx) => {
      let found_sender = false; // <-- for identifying the user that was not found, should a balance update fail.
      try {
        // Decrement amount from the sender.
        const sender_balance = await tx.balance.update(
          {
            where: {
              user_id: from_user_id,
            },
            data: {
              value: {
                decrement: amount
              },
            }
          }
        );
        found_sender = true;
    
        // Increment the recipient's balance by amount
        await tx.balance.update(
          {
            where: {
              user_id: to_user_id,
            },
            data: {
              value: {
                increment: amount
              }
            },
          }
        );
  
        // Record the transaction.
        const db_transaction = await tx.transaction.create(
          {
            data: {
              amount: amount,
              from_user_id: from_user_id,
              to_user_id: to_user_id
            }
          }
        );

        const transaction_builder = MiniTocoTransactionBuilder.create();
        transaction_builder.amount(amount);
        transaction_builder.fromUserId(from_user_id);
        transaction_builder.toUserId(to_user_id);
        transaction_builder.id(db_transaction.id);
        const transaction = transaction_builder.build()

        const builder = MiniTocoTransactionResultBuilder.create();
        builder.transaction(transaction);
        builder.finalBalance(sender_balance.value);
        const result = builder.build();
        return result;
      } catch (error) {
        if (isPrismaRecordNotFoundError(error)) {
          throw new UserIDNotFoundError(found_sender ? to_user_id : from_user_id);
        }
        if (error instanceof Prisma.PrismaClientUnknownRequestError) {
          // The most common cause of this error will be a negative balance.
          if (error.message.includes("balance_nonnegative_check")) {
            throw new TransactionInsufficientFundsError(from_user_id, amount);
          }
        }
  
        // Unexpected error, log and rethrow
        logTransactionService("createTransaction", "Error creating transaction", error);
        throw error;
      }
    });
  }
}


const logTransactionService = (context: string, msg: string, ...additional_values: any) => {
  console.log(`[Transactionservice:${context}]: ${msg}`, additional_values);
}