import { getOrThrow } from "../utils/ts_util"

export abstract class CreateTokenRequest {

  readonly grant_type: string

  protected constructor(grant_type: string) {
    this.grant_type = grant_type
  }
}

export abstract class CreateTokenRequestBuilder<R extends CreateTokenRequest, B extends CreateTokenRequestBuilder<R, B>> {
    abstract build(): R
    protected abstract self(): B
}

export class CreateTokenWithPasswordRequest extends CreateTokenRequest {
  readonly username: string
  readonly password: string

  static create(username: string, password: string): CreateTokenWithPasswordRequest {
    return new CreateTokenWithPasswordRequest(username, password)
  }

  private constructor(username: string, password: string) {
    super("password")
    this.username = username
    this.password = password
  }
}

export class CreateTokenWithPasswordRequestBuilder extends CreateTokenRequestBuilder<CreateTokenWithPasswordRequest, CreateTokenWithPasswordRequestBuilder> {
    
      private _username?: string
      private _password?: string
    
      static create(from?: CreateTokenWithPasswordRequest): CreateTokenWithPasswordRequestBuilder {
        const ret = new CreateTokenWithPasswordRequestBuilder()
        if (from) {
          ret.username(from.username);
          ret.password(from.password);
        }
        return ret
      }

      private constructor() {
        super()
      }
    
      username(username: string): CreateTokenWithPasswordRequestBuilder {
        this._username = username
        return this
      }
      password(password: string): CreateTokenWithPasswordRequestBuilder {
        this._password = password
        return this
      }
    
      build(): CreateTokenWithPasswordRequest {
        return CreateTokenWithPasswordRequest.create(getOrThrow(this._username, "username"), getOrThrow(this._password, "password"))
      }
    
      self(): CreateTokenWithPasswordRequestBuilder {
        return this
      }
}

export class CreateTokenWithRefreshTokenRequest extends CreateTokenRequest {
  readonly refresh_token: string

  static create(refresh_token: string): CreateTokenWithRefreshTokenRequest {
    return new CreateTokenWithRefreshTokenRequest(refresh_token)
  }

  private constructor(refresh_token: string) {
    super("refresh_token")
    this.refresh_token = refresh_token
  }
}

export class CreateTokenWithRefreshTokenRequestBuilder extends CreateTokenRequestBuilder<CreateTokenWithRefreshTokenRequest, CreateTokenWithRefreshTokenRequestBuilder> {
      
  private _refresh_token?: string

  static create(from?: CreateTokenWithRefreshTokenRequest): CreateTokenWithRefreshTokenRequestBuilder {
    const ret = new CreateTokenWithRefreshTokenRequestBuilder()
    if (from) {
      ret.refresh_token(from.refresh_token);
    }
    return ret
  }
  
  private constructor() {
    super()
  }

  refresh_token(refresh_token: string): CreateTokenWithRefreshTokenRequestBuilder {
    this._refresh_token = refresh_token
    return this
  }

  build(): CreateTokenWithRefreshTokenRequest {
    return CreateTokenWithRefreshTokenRequest.create(getOrThrow(this._refresh_token, "refresh_token"))
  }

  self(): CreateTokenWithRefreshTokenRequestBuilder {
    return this
  }
}