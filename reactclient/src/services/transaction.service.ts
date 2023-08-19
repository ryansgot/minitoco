import axios from "axios";
import tokenData from "./token.data";
import { MiniTocoTransactionResult } from "../io_models/MiniTocoTransaction";

// TODO: read from environment
const API_URL = "http://localhost:3050/transactions/";

class TransactionService {
  async createTransaction(amount: bigint, to_user_email: string): Promise<MiniTocoTransactionResult | undefined> {
    const token_data = tokenData()
    if (token_data === undefined) {
      return undefined;
    }

    console.log("Sending transaction", amount, to_user_email, token_data.access_token);

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
    const transaction: MiniTocoTransactionResult = await axios(options);
    return transaction;
  }
}

export default new TransactionService();