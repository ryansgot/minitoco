import axios from "axios";
import { tokenData } from "./local.data";
import { MiniTocoTransaction, MiniTocoTransactionResult } from "../io_models/MiniTocoTransaction";

// TODO: read from environment
const API_URL = "http://localhost:3050/transactions/";

class TransactionService {
  async getTransactionHistory(): Promise<Array<MiniTocoTransaction> | undefined> {
    const token_data = tokenData()
    if (token_data === undefined) {
      return undefined;
    }

    const options = {
      method: 'GET',
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token_data.access_token}`
      },
      url: API_URL
    }
    const transactions = await axios(options);
    return transactions.data;
  }
  async createTransaction(amount: bigint, to_user_email: string): Promise<MiniTocoTransactionResult | undefined> {
    const token_data = tokenData()
    if (token_data === undefined) {
      return undefined;
    }

    const options = {
      method: 'POST',
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token_data.access_token}`
      },
      data: {
        amount: amount.toString(),
        to_user_email: to_user_email
      },
      url: API_URL
    }
    const transaction = await axios(options);
    return transaction.data;
  }
}

export default new TransactionService();