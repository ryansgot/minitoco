import { getOrThrow } from "../utils/ts_util";

/**
 * Used as to identify the user making the request.
 */
export class RequestAuthUser implements Express.User {
  readonly id!: string;
  readonly email!: string;

  static create(id: string, email: string): RequestAuthUser {
    return new RequestAuthUser(id, email);
  }

  private constructor(id: string, email: string) {
    this.id = id;
    this.email = email;
  }

  newBuilder(): RequestAuthUserBuilder {
    return RequestAuthUserBuilder.create(this);
  }
}

export class RequestAuthUserBuilder {
  private _id?: string;
  private _email?: string;

  static create(from?: RequestAuthUser): RequestAuthUserBuilder {
    const ret = new RequestAuthUserBuilder();
    if (from) {
      ret.id(from.id);
      ret.email(from.email);
    }
    return ret;
  }

  private constructor() {}

  id(id: string): RequestAuthUserBuilder {
    this._id = id;
    return this;
  }
  email(email: string): RequestAuthUserBuilder {
    this._email = email;
    return this;
  }

  build(): RequestAuthUser {
    return RequestAuthUser.create(
      getOrThrow(this._id, "id"),
      getOrThrow(this._email, "email")
    )
  }
}