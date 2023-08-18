import { Request, Response } from "express";
import { BaseController, BaseControllerBuilder, IBaseController } from "./BaseMiniTocoController"
import { ITransactionService, TransactionInsufficientFundsError } from "../services/ITransactionService";
import { getOrThrow } from "../utils/ts_util";
import { sendAndSignal, sendAndSignalInternalServerError } from "../utils/express_util";
import { MiniTocoError, MiniTocoErrorBuilder } from "../io_models/MiniTocoError";
import { RequestAuthUser } from "../io_models/RequestAuthUser";
import { IUserService, UserEmailNotFoundError, UserIDNotFoundError } from "../services/IUserService";
import { MiniTocoUser, MiniTocoUserDetail } from "../io_models/MiniTocoUser";

export class TransactionControllerBuilder extends BaseControllerBuilder<ITransactionController, TransactionControllerBuilder> {

  private _transaction_service?: ITransactionService;
  private _user_service?: IUserService;

  static create(): TransactionControllerBuilder {
    return new TransactionControllerBuilder();
  }

  private constructor() {
    super();
  }

  transactionService(transaction_service: ITransactionService): TransactionControllerBuilder {
    this._transaction_service = transaction_service;
    return this;
  }
  userService(user_service: IUserService): TransactionControllerBuilder {
    this._user_service = user_service;
    return this;
  }

  protected self(): TransactionControllerBuilder {
    return this;
  }

  build(): ITransactionController {
    return new TransactionController(
      this.reqOrThrow(),
      this.resOrThrow(),
      getOrThrow(this._transaction_service, "transaction_service"),
      getOrThrow(this._user_service, "user_service")
    );
  }
}

export interface ITransactionController extends IBaseController {
  createTransaction(signalComplete: () => void): void;
}

class TransactionController extends BaseController implements ITransactionController {

  private transaction_service: ITransactionService;
  private user_service: IUserService;

  constructor(req: Request, res: Response, transaction_service: ITransactionService, user_service: IUserService) {
    super(req, res);
    this.transaction_service = transaction_service;
    this.user_service = user_service;
  }

  async createTransaction(signalComplete: () => void): Promise<void> {
    if (this.validationFailureWasSent(signalComplete)) {
      return;
    }

    const res: Response = this.res;
    const req: Request = this.req;
    const requester: RequestAuthUser = this.req.user as RequestAuthUser // <-- validator guarantees this exists.
    const to_user_email: string = req.body.to_user_email;               // <-- validator guarantees this exists and is an email address that not the email address of the sender.
    const amount_str: string = req.body.amount;                         // <-- validator guarantees this exists and can be converted to bigint
    const amount = BigInt(amount_str);

    let to_user: MiniTocoUserDetail;
    try {
      to_user = await this.user_service.findUserByEmail(to_user_email);
    } catch (error) {
      if (error instanceof UserEmailNotFoundError) {
        const error_to_return = MiniTocoErrorBuilder.ofBody("to_user_email")
          .msg("to-user not found")
          .value(to_user_email)
          .build();
        sendAndSignal(res, 404, MiniTocoError.errorsBody(error_to_return), signalComplete);
        return;
      }

      logTransactionEndpointError("createTransaction", error as Error);
      sendAndSignalInternalServerError(res, signalComplete);
      return;
    }

    try {
      const transaction_result = await this.transaction_service.createTransaction(amount, requester.id, to_user.user.id);
      sendAndSignal(res, 200, transaction_result, signalComplete);
    } catch (error) {
      if (error instanceof TransactionInsufficientFundsError) {
        const error_to_return = MiniTocoErrorBuilder.ofBody("amount")
          .msg("insufficient funds")
          .value(amount.toString())
          .build();
        sendAndSignal(res, 409, MiniTocoError.errorsBody(error_to_return), signalComplete);
        return;
      }

      // We don't expect to ever get to this point and experience an error in
      // which the user is not found. Thus, we log that error, but return the
      // friendlier 404 error.
      logTransactionEndpointError("createTransaction", error as Error);
      if (error instanceof UserIDNotFoundError) {
        const error_to_return = MiniTocoErrorBuilder.ofBody("to_user_email")
          .msg("User not found")
          .value(error.user_id)
          .build();
        sendAndSignal(res, 404, MiniTocoError.errorsBody(error_to_return), signalComplete);
        return;
      }
      sendAndSignalInternalServerError(res, signalComplete);
    }
  }

  protected logEndpointError(endpoint: string, err: Error): void {
    logTransactionEndpointError(endpoint, err);
  }
}


const logTransactionEndpointError = (endpoint: string, err: Error) => {
  logTransactionEndpointErrorMessage(endpoint, err.toString());
}
const logTransactionEndpointErrorMessage = (endpoint: string, message: string) => {
  console.log(`[sample/${endpoint}] ${message}`);
}
