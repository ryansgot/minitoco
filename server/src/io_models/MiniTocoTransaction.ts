import { getOrThrow } from "../utils/ts_util";

export class MiniTocoTransactionResult {
  readonly transaction: MiniTocoTransaction;
  readonly final_balance: bigint;

  static create(transaction: MiniTocoTransaction, final_balance: bigint): MiniTocoTransactionResult {
    return new MiniTocoTransactionResult(transaction, final_balance);
  }

  private constructor(transaction: MiniTocoTransaction, final_balance: bigint) {
    this.transaction = transaction;
    this.final_balance = final_balance;
  }

  toJSON() {
    return {
      transaction: this.transaction,
      final_balance: this.final_balance.toString() // <-- avoids precision loss on serialization
    };
  }

  newBuilder(): MiniTocoTransactionResultBuilder {
    return MiniTocoTransactionResultBuilder.create(this);
  }
}

export class MiniTocoTransactionResultBuilder {
  private _transaction?: MiniTocoTransaction;
  private _final_balance?: bigint;

  static create(from?: MiniTocoTransactionResult): MiniTocoTransactionResultBuilder {
    const ret = new MiniTocoTransactionResultBuilder();
    if (from) {
      ret.transaction(MiniTocoTransactionBuilder.create(from.transaction).build());
      ret.finalBalance(from.final_balance);
    }
    return ret;
  }

  constructor() {}

  transaction(transaction: MiniTocoTransaction): MiniTocoTransactionResultBuilder {
    this._transaction = transaction;
    return this;
  }
  finalBalance(final_balance: bigint): MiniTocoTransactionResultBuilder {
    this._final_balance = final_balance;
    return this;
  }

  build(): MiniTocoTransactionResult {
    return MiniTocoTransactionResult.create(
      getOrThrow(this._transaction, "transaction"),
      getOrThrow(this._final_balance, "final_balance")
    );
  }
}

export class MiniTocoTransaction {
  readonly id: string;
  readonly amount: bigint;
  readonly from_user_id: string;
  readonly to_user_id: string;
  readonly date: Date;

  static create(id: string, amount: bigint, from_user_id: string, to_user_id: string, date: Date): MiniTocoTransaction {
    return new MiniTocoTransaction(id, amount, from_user_id, to_user_id, date);
  }

  private constructor(id: string, amount: bigint, from_user_id: string, to_user_id: string, date: Date) {
    this.id = id;
    this.amount = amount;
    this.from_user_id = from_user_id;
    this.to_user_id = to_user_id;
    this.date = date;
  }

  toJSON() {
    return {
      id: this.id,
      amount: this.amount.toString(), // <-- avoids precision loss on serialization
      from_user_id: this.from_user_id,
      to_user_id: this.to_user_id,
      date: this.date
    };
  }

  newBuilder(): MiniTocoTransactionBuilder {
    return MiniTocoTransactionBuilder.create(this);
  }
}

export class MiniTocoTransactionBuilder {
  private _id?: string;
  private _amount?: bigint;
  private _from_user_id?: string;
  private _to_user_id?: string;
  private _date?: Date;

  static create(from?: MiniTocoTransaction): MiniTocoTransactionBuilder {
    const ret = new MiniTocoTransactionBuilder();
    if (from) {
      ret.id(from.id);
      ret.amount(from.amount);
      ret.fromUserId(from.from_user_id);
      ret.toUserId(from.to_user_id);
      ret.date(from.date)
    }
    return ret;
  }

  constructor() {}

  id(id: string): MiniTocoTransactionBuilder {
    this._id = id;
    return this;
  }
  amount(amount: bigint): MiniTocoTransactionBuilder {
    this._amount = amount;
    return this;
  }
  fromUserId(from_user_id: string): MiniTocoTransactionBuilder {
    this._from_user_id = from_user_id;
    return this;
  }
  toUserId(to_user_id: string): MiniTocoTransactionBuilder {
    this._to_user_id = to_user_id;
    return this;
  }
  date(date: Date): MiniTocoTransactionBuilder {
    this._date = date;
    return this;
  }

  build(): MiniTocoTransaction {
    return MiniTocoTransaction.create(
      getOrThrow(this._id, "id"),
      getOrThrow(this._amount, "amount"),
      getOrThrow(this._from_user_id, "from_user_id"),
      getOrThrow(this._to_user_id, "to_user_id"),
      getOrThrow(this._date, "date")
    );
  }
}