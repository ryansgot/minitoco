import { Prisma } from "@prisma/client";
import { MiniTocoTransaction, MiniTocoTransactionBuilder, MiniTocoTransactionResult, MiniTocoTransactionResultBuilder } from "../io_models/MiniTocoTransaction";
import { PrismaContext } from "../prisma/PrismaDb"
import { fieldNameOfForeignKeyConstraintError, isPrismaForeignKeyConstraintError } from "../prisma/prisma_util";
import { ITransactionService, TransactionInsufficientFundsError } from "./ITransactionService"
import { UserIDNotFoundError } from "./IUserService";

export const createTransactionService = (prisma_context: PrismaContext): ITransactionService => new TransactionService(prisma_context);

class TransactionService implements ITransactionService {

  private readonly prisma_context: PrismaContext;

  constructor(prisma_context: PrismaContext) {
    this.prisma_context = prisma_context;
  }
  
  async createTransaction(amount: bigint, from_user_id: string, to_user_id: string): Promise<MiniTocoTransactionResult> {
    try {
      return await this.prisma_context.prisma.$transaction(async (tx) => {
  
        // Record the transaction.
        const transaction = await tx.transaction.create(
          {
            data: {
              amount: amount,
              from_user_id: from_user_id,
              to_user_id: to_user_id
            }
          }
        );
        
        // Decrement amount from the sender.
        const sender_balance = await tx.balance.update(
          {
            where: {
              user_id: from_user_id,
            },
            data: {
              value: {
                decrement: amount,
              },
            }
          }
        );
    
        // Increment the recipient's balance by amount
        await tx.balance.update(
          {
            where: {
              user_id: to_user_id,
            },
            data: {
              value: {
                increment: amount,
              }
            },
          }
        );
    
        const builder = MiniTocoTransactionResultBuilder.create();
        builder.finalBalance(sender_balance.value);

        const transaction_builder = MiniTocoTransactionBuilder.create();
        transaction_builder.amount(amount);
        transaction_builder.fromUserId(from_user_id);
        transaction_builder.toUserId(to_user_id);
        transaction_builder.id(transaction.id);
        builder.transaction(transaction_builder.build());
        const result = builder.build();
        return result;
      })
    } catch (error) {
      // Can be foreign key constraint error or insufficient funds error or otherwise a constraint error
      if (isPrismaForeignKeyConstraintError(error)) {
        const field_name = fieldNameOfForeignKeyConstraintError(error);
        logTransactionService("createTransaction", "foreign key constraint error on field:", field_name);
        if (field_name === "from_user_id") {  // <-- should be rare because ostensibly the from-user is the logged in user.
          throw new UserIDNotFoundError(from_user_id);
        }
        if (field_name === "to_user_id") {
          throw new UserIDNotFoundError(to_user_id);
        }
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
  }
}


const logTransactionService = (context: string, msg: string, ...additional_values: any) => {
  console.log(`[Transactionservice:${context}]: ${msg}`, additional_values);
}