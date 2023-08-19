import { Request, Response } from "express";
import { BaseController, BaseControllerBuilder, IBaseController } from "./BaseMiniTocoController"
import { IUserService, UserAlreadyExistsError, UserEmailNotFoundError, UserIDNotFoundError } from "../services/IUserService";
import { getOrThrow } from "../utils/ts_util";
import { sendAndSignal, sendAndSignalInternalServerError, sendEmptyAndSignal } from "../utils/express_util";
import { MiniTocoError, MiniTocoErrorBuilder } from "../io_models/MiniTocoError";
import { RequestAuthUser } from "../io_models/RequestAuthUser";
import { ITokenService } from "../services/ITokenService";
import { IPasswordService } from "../services/IPasswordService";
import { MiniTocoUser, MiniTocoUserDetail, MiniTocoUserToCreateBuilder } from "../io_models/MiniTocoUser";
import { CreateTokenWithPasswordRequestBuilder, CreateTokenWithRefreshTokenRequest, CreateTokenWithRefreshTokenRequestBuilder } from "../io_models/CreateTokenRequest";


export interface IUserController extends IBaseController {
  createUser(signalComplete: () => void): void;
  logInUser(signalComplete: () => void): void;
  refreshToken(signalComplete: () => void): void;
  fetchUser(signalComplete: () => void): void;
  me(signalComplete: () => void): void;
}

export class UserControllerBuilder extends BaseControllerBuilder<IUserController, UserControllerBuilder> {

  private _user_service?: IUserService;
  private _password_service?: IPasswordService;
  private _token_service?: ITokenService;

  static create(): UserControllerBuilder {
    return new UserControllerBuilder();
  }

  private constructor() {
    super();
  }

  userService(sample_service: IUserService): UserControllerBuilder {
    this._user_service = sample_service;
    return this;
  }
  passwordService(password_service: IPasswordService): UserControllerBuilder {
    this._password_service = password_service;
    return this;
  }
  tokenService(token_service: ITokenService): UserControllerBuilder {
    this._token_service = token_service;
    return this;
  }

  protected self(): UserControllerBuilder {
    return this;
  }

  build(): IUserController {
    return new UserController(
      this.reqOrThrow(),
      this.resOrThrow(),
      getOrThrow(this._user_service, "user_service"),
      getOrThrow(this._password_service, "password_service"),
      getOrThrow(this._token_service, "token_service")
    );
  }
}
class UserController extends BaseController implements IUserController {

  private user_service: IUserService;
  private password_service: IPasswordService;
  private token_service: ITokenService;

  constructor(req: Request, res: Response, user_service: IUserService, password_service: IPasswordService, token_service: ITokenService) {
    super(req, res);
    this.user_service = user_service;
    this.password_service = password_service;
    this.token_service = token_service;
  }

  async createUser(signalComplete: () => void): Promise<void> {
    if (this.validationFailureWasSent(signalComplete)) {
      return;
    }

    const res: Response = this.res;
    const req: Request = this.req;
    const user_to_create = MiniTocoUserToCreateBuilder.create(req.body).build();  // <-- validator guarantees valid 

    let pw_hash: string;
    try {
      pw_hash = await this.password_service.createPasswordHash(user_to_create.password);
    } catch (error) {
      logUserEndpointError("createUser", error as Error);
      sendAndSignalInternalServerError(res, signalComplete);
      return;
    }

    let created_user: MiniTocoUser;
    try {
      created_user = await this.user_service.createUser(user_to_create, pw_hash, BigInt(1000));
    } catch (error) {
      if (error instanceof UserAlreadyExistsError) {
        const error_to_return = MiniTocoErrorBuilder.ofBody("email")
          .msg("User already exists")
          .value(user_to_create.email)
          .build();
        sendAndSignal(res, 409, MiniTocoError.errorsBody(error_to_return), signalComplete);
        return;
      }
      logUserEndpointError("createUser", error as Error);
      sendAndSignalInternalServerError(res, signalComplete);
      return;
    }

    try {
      const token_data = await this.token_service.createTokenData(created_user.id, created_user.email);
      sendAndSignal(res, 200, token_data, signalComplete);
    } catch (error) {
      logUserEndpointError("createUser", error as Error);
      sendAndSignalInternalServerError(res, signalComplete);
    }
  }

  async logInUser(signalComplete: () => void): Promise<void> {
    if (this.validationFailureWasSent(signalComplete)) {
      return;
    }

    const res: Response = this.res;
    const req: Request = this.req;
    // const request_user: RequestAuthUser = this.req.user as RequestAuthUser // <-- validator guarantees this exists.
    // const auth_header = req.header('Authorization') as string;

    if (req.body.grant_type !== "password") {
      const error_to_return = MiniTocoErrorBuilder.ofBody("grant_type")
        .msg("unsupported grant_type")
        .value(req.body.grant_type || "")
        .build();
      logUserEndpointError("logInUser", new Error("attempted log in with unsupported grant_type: " + req.body.grant_type));
      sendAndSignal(res, 400, MiniTocoError.errorsBody(error_to_return), signalComplete);
      return;
    }

    const create_token_request = CreateTokenWithPasswordRequestBuilder.create(req.body).build();  // <-- validator guarantees valid
  
    let user_detail: MiniTocoUserDetail;
    try {
      user_detail = await this.user_service.findUserByEmail(create_token_request.username);
    } catch (error) {
      if (error instanceof UserEmailNotFoundError) {
        const error_to_return = MiniTocoErrorBuilder.ofBody("email or password")
        .msg("email or password incorrect")
        .value(create_token_request.username)
        .build();
        sendAndSignal(res, 401, MiniTocoError.errorsBody(error_to_return), signalComplete);
        return;
      }

      logUserEndpointError("logInUser", error as Error);
      sendAndSignalInternalServerError(res, signalComplete);
      return;
    }

    try {
      const is_password_match = await this.password_service.isPasswordMatch(create_token_request.password, user_detail.user.pw_hash);
      if (!is_password_match) {
        const error_to_return = MiniTocoErrorBuilder.ofBody("email or password")
          .msg("email or password incorrect")
          .value(create_token_request.username)
          .build();
        sendAndSignal(res, 401, MiniTocoError.errorsBody(error_to_return), signalComplete);
        return;
      }
    } catch (error) {
      logUserEndpointError("logInUser", error as Error);
      const error_to_return = MiniTocoErrorBuilder.ofBody("email or password")
        .msg("email or password incorrect")
        .value(create_token_request.username)
        .build();
      sendAndSignal(res, 401, MiniTocoError.errorsBody(error_to_return), signalComplete);
      return;
    }

    try {
      const token_data = await this.token_service.createTokenData(user_detail.user.id, user_detail.user.email);
      sendAndSignal(res, 200, token_data, signalComplete);
    } catch (error) {
      logUserEndpointError("logInUser", error as Error);
      sendAndSignalInternalServerError(res, signalComplete);
    }
  }

  // TODO: refresh token tests
  async refreshToken(signalComplete: () => void): Promise<void> {
    if (this.validationFailureWasSent(signalComplete)) {
      return;
    }

    const res: Response = this.res;
    const req: Request = this.req;

    if (req.body.grant_type !== "refresh_token") {
      const error_to_return = MiniTocoErrorBuilder.ofBody("grant_type")
        .msg("unsupported grant_type")
        .value(req.body.grant_type || "")
        .build();
      logUserEndpointError("refreshToken", new Error("attempted log in with unsupported grant_type: " + req.body.grant_type));
      sendAndSignal(res, 400, MiniTocoError.errorsBody(error_to_return), signalComplete);
      return;
    }


    const create_token_request = CreateTokenWithRefreshTokenRequestBuilder.create(req.body).build();  // <-- validator guarantees valid

    let user_in_token: { user_id: string, email: string };
    try {
      user_in_token = await this.token_service.verifyToken(create_token_request.refresh_token);
    } catch (error) {
      const error_to_return = MiniTocoErrorBuilder.ofBody("refresh_token")
        .msg("invalid refresh_token")
        .value(create_token_request.refresh_token)
        .build();
      logUserEndpointError("refreshToken", error as Error);
      sendAndSignal(res, 401, MiniTocoError.errorsBody(error_to_return), signalComplete);
      return;
    }

    let user_detail: MiniTocoUserDetail;
    try {
      user_detail = await this.user_service.findUserById(user_in_token.user_id);
    } catch (error) {
      if (error instanceof UserIDNotFoundError) {
        const error_to_return = MiniTocoErrorBuilder.ofBody("refresh_token")
        .msg("User not found")
        .value(user_in_token.user_id)
        .build();
        sendAndSignal(res, 401, MiniTocoError.errorsBody(error_to_return), signalComplete);
        return;
      }

      logUserEndpointError("refreshToken", error as Error);
      sendAndSignalInternalServerError(res, signalComplete);
      return;
    }

    try {
      const token_data = await this.token_service.createTokenData(user_detail.user.id, user_detail.user.email);
      sendAndSignal(res, 200, token_data, signalComplete);
    } catch (error) {
      logUserEndpointError("logInUser", error as Error);
      sendAndSignalInternalServerError(res, signalComplete);
    }
  }
  
  async fetchUser(signalComplete: () => void): Promise<void> {
    if (this.validationFailureWasSent(signalComplete)) {
      return;
    }

    const res: Response = this.res;
    const req: Request = this.req;
    const request_user: RequestAuthUser = req.user as RequestAuthUser // <-- validator guarantees this exists.
    const requested_user_id: string = req.params.user_id;             // <-- validator guarantees this exists and is a uuid

    if (request_user.id !== requested_user_id) {
      const error_to_return = MiniTocoErrorBuilder.ofPath("user_id")
        .msg("Only the currently-logged in user can fetch their own user details")
        .value(requested_user_id)
        .build();
      sendAndSignal(res, 403, MiniTocoError.errorsBody(error_to_return), signalComplete);
      return;
    }

    await this.me(signalComplete);
  }

  async me(signalComplete: () => void): Promise<void> {
    if (this.validationFailureWasSent(signalComplete)) {
      return;
    }

    const res: Response = this.res;
    const req: Request = this.req;
    const request_user: RequestAuthUser = req.user as RequestAuthUser // <-- validator guarantees this exists.

    try {
      const user_detail = await this.user_service.findUserById(request_user.id);
      sendAndSignal(res, 200, user_detail, signalComplete);
    } catch (error) {
      if (error instanceof UserIDNotFoundError) {
        // This should not be possible because we know at this point that the
        // logged in user is the requested user.
        const error_to_return = MiniTocoErrorBuilder.ofPath("user_id")
          .msg("User not found")
          .value(request_user.id)
          .build();
        sendAndSignal(res, 404, MiniTocoError.errorsBody(error_to_return), signalComplete);
        return;
      }
      logUserEndpointError("fetchUser", error as Error);
      sendAndSignalInternalServerError(res, signalComplete);
    }
  }

  protected logEndpointError(endpoint: string, err: Error): void {
    logUserEndpointError(endpoint, err);
  }
}


const logUserEndpointError = (endpoint: string, err: Error) => {
  logUserEndpointErrorMessage(endpoint, err.toString());
}
const logUserEndpointErrorMessage = (endpoint: string, message: string) => {
  console.log(`[sample/${endpoint}] ${message}`);
}
