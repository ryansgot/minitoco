import { MiniTocoTransaction, MiniTocoTransactionResult } from "../io_models/MiniTocoTransaction";

export interface ITransactionService {
  createTransaction(amount: bigint, from_user_id: string, to_user_id: string): Promise<MiniTocoTransactionResult>;
}

export class TransactionInsufficientFundsError extends Error {
  readonly user_id: string;
  readonly amount: bigint;
  constructor(user_id: string, amount: bigint) {
    super("Transaction cannot be completed because the from-user does not have sufficient funds: " + user_id);
    this.user_id = user_id;
    this.amount = amount;
    this.name = "TransactionInsufficientFundsError";
  }
}