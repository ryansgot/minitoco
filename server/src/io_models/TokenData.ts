import { getOrThrow } from "../utils/ts_util";

export class TokenData {

  readonly access_token!: string;
  readonly refresh_token!: string;
  readonly expires_in!: number;
  readonly token_type!: string;

  static create(access_token: string, refresh_token: string, expires_in: number): TokenData {
    return new TokenData(access_token, refresh_token, expires_in);
  }

  private constructor(
    access_token: string,
    refresh_token: string,
    expires_in: number,
    token_type: string = 'bearer'
  ) {
    this.access_token = access_token;
    this.refresh_token = refresh_token;
    this.expires_in = expires_in;
    this.token_type = token_type;
  }
}

export class TokenDataBuilder {
  
    private _access_token?: string;
    private _refresh_token?: string;
    private _expires_in?: number;
  
    static create(): TokenDataBuilder {
      return new TokenDataBuilder();
    }
  
    accessToken(access_token: string): TokenDataBuilder {
      this._access_token = access_token;
      return this;
    }
    refreshToken(refresh_token: string): TokenDataBuilder {
      this._refresh_token = refresh_token;
      return this;
    }
    expiresIn(expires_in: number): TokenDataBuilder {
      this._expires_in = expires_in;
      return this;
    }
  
    build(): TokenData {
      return TokenData.create(
        getOrThrow(this._access_token, "access_token"),
        getOrThrow(this._refresh_token, "refresh_token"),
        getOrThrow(this._expires_in, "expires_in")
      );
    }
}