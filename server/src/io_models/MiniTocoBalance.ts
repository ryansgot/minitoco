import { getOrThrow } from "../utils/ts_util";

/**
 * Represents the balance of an account at a point in time.
 */
export class MiniTocoBalance {
  readonly value: bigint;
  readonly updated_at: Date;

  static create(value: bigint, updated_at: Date): MiniTocoBalance {
    return new MiniTocoBalance(value, updated_at);
  }

  private constructor(value: bigint, updated_at: Date) {
    this.value = value;
    this.updated_at = updated_at;
  }

  toJSON() {
    return {
      value: this.value.toString(),
      updated_at: this.updated_at
    }
  }

  newBuilder(): MiniTocoBalanceBuilder {
    return MiniTocoBalanceBuilder.create(this);
  }
}

export class MiniTocoBalanceBuilder {

  private _value?: bigint;
  private _updated_at?: Date;

  static create(from?: MiniTocoBalance): MiniTocoBalanceBuilder {
    const ret = new MiniTocoBalanceBuilder();
    if (from) {
      ret.value(from.value);
      ret.updatedAt(from.updated_at);
    }
    return ret;
  }

  private constructor() {}

  value(value: bigint): MiniTocoBalanceBuilder {
    this._value = value;
    return this;
  }
  updatedAt(updated_at: Date): MiniTocoBalanceBuilder {
    this._updated_at = updated_at;
    return this;
  }

  build(): MiniTocoBalance {
    return MiniTocoBalance.create(getOrThrow(this._value, "value"), getOrThrow(this._updated_at, "updated_at"));
  }
}