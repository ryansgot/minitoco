import { getOrThrow } from "../utils/ts_util"

export class MiniTocoUserToCreate {
  readonly email: string;
  readonly first_name: string;
  readonly last_name: string;
  readonly password: string

  static create(
    email: string,
    first_name: string,
    last_name: string,
    password: string
  ): MiniTocoUserToCreate {
    return new MiniTocoUserToCreate(email, first_name, last_name, password);
  }

  private constructor(
    email: string,
    first_name: string,
    last_name: string,
    password: string
  ) {
    this.email = email;
    this.first_name = first_name;
    this.last_name = last_name;
    this.password = password;
  }
}

export class MiniTocoUserToCreateBuilder {
  private _email?: string;
  private _first_name?: string;
  private _last_name?: string;
  private _password?: string;

  static create(from?: MiniTocoUserToCreate): MiniTocoUserToCreateBuilder {
    const ret = new MiniTocoUserToCreateBuilder();
    if (from) {
      ret.email(from.email);
      ret.firstName(from.first_name);
      ret.lastName(from.last_name);
      ret.password(from.password);
    }
    return ret;
  }

  private constructor() {}

  email(email: string): MiniTocoUserToCreateBuilder {
    this._email = email;
    return this;
  }
  firstName(first_name: string): MiniTocoUserToCreateBuilder {
    this._first_name = first_name;
    return this;
  }
  lastName(last_name: string): MiniTocoUserToCreateBuilder {
    this._last_name = last_name;
    return this;
  }
  password(password: string): MiniTocoUserToCreateBuilder {
    this._password = password;
    return this;
  }

  build(): MiniTocoUserToCreate {
    return MiniTocoUserToCreate.create(
      getOrThrow(this._email, "email"),
      getOrThrow(this._first_name, "first_name"),
      getOrThrow(this._last_name, "last_name"),
      getOrThrow(this._password, "password")
    );
  }
}

/**
 * Represents a user of the minitocos app. The properties that may be undefined
 * are so because the client application may be the one creating the user object,
 * in which case, the user object will not have a password hash, created_at, or
 * updated_at.
 */
export class MiniTocoUser {
  readonly id: string;
  readonly pw_hash: string;
  readonly email: string;
  readonly first_name: string;
  readonly last_name: string;
  readonly created_at: Date;
  readonly updated_at: Date;

  static create(
    id: string,
    pw_hash: string,
    email: string,
    first_name: string,
    last_name: string,
    created_at: Date,
    updated_at: Date
  ): MiniTocoUser {
    return new MiniTocoUser(
      id,
      pw_hash,
      email,
      first_name,
      last_name,
      created_at,
      updated_at
    );
  }

  private constructor(
    id: string,
    pw_hash: string,
    email: string,
    first_name: string,
    last_name: string,
    created_at: Date,
    updated_at: Date
  ) {
    this.id = id;
    this.pw_hash = pw_hash;
    this.email = email;
    this.first_name = first_name;
    this.last_name = last_name;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }

  /**
   * @returns a JSON object that represents the user without any of the
   * password hash or sensitive information
   */
  toJSON() {
    return {
      id: this.id,
      email: this.email,
      first_name: this.first_name,
      last_name: this.last_name,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}


export class MiniTocoUserBuilder {
  private _id?: string;
  private _pw_hash?: string;
  private _email?: string;
  private _first_name?: string;
  private _last_name?: string;
  private _created_at?: Date;
  private _updated_at?: Date;

  static create(from?: MiniTocoUser): MiniTocoUserBuilder {
    const ret = new MiniTocoUserBuilder();
    if (from) {
      ret.id(from.id);
      ret.pwHash(from.pw_hash);
      ret.email(from.email);
      ret.firstName(from.first_name);
      ret.lastName(from.last_name);
      ret.createdAt(from.created_at);
      ret.updatedAt(from.updated_at);
    }
    return ret;
  }

  private constructor() {}

  id(id: string): MiniTocoUserBuilder {
    this._id = id;
    return this;
  }
  pwHash(pw_hash: string): MiniTocoUserBuilder {
    this._pw_hash = pw_hash;
    return this;
  }
  email(email: string): MiniTocoUserBuilder {
    this._email = email;
    return this;
  }
  firstName(first_name: string): MiniTocoUserBuilder {
    this._first_name = first_name;
    return this;
  }
  lastName(last_name: string): MiniTocoUserBuilder {
    this._last_name = last_name;
    return this;
  }
  createdAt(created_at: Date): MiniTocoUserBuilder {
    this._created_at = created_at;
    return this;
  }
  updatedAt(updated_at: Date): MiniTocoUserBuilder {
    this._updated_at = updated_at;
    return this;
  }

  build(): MiniTocoUser {
    return MiniTocoUser.create(
      getOrThrow(this._id, "id"),
      getOrThrow(this._pw_hash, "pw_hash"),
      getOrThrow(this._email, "email"),
      getOrThrow(this._first_name, "first_name"),
      getOrThrow(this._last_name, "last_name"),
      getOrThrow(this._created_at, "created_at"),
      getOrThrow(this._updated_at, "updated_at")
    );
  }
}