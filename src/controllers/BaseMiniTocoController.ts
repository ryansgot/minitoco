import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { sendJSONAndSignal } from "../utils/express_util";
import { getOrThrow } from "../utils/ts_util";
import { RequestAuthUser } from "../io_models/RequestAuthUser";

/**
 * The base controller interface used to handle requests
 */
export interface IBaseController {}

/**
 * The base controller class used to handle requests. Of note is the
 * {@link validationFailureWasSent} function that can be used as a guard to
 * know whether the express-validators attached to the route have caught
 * a problem with the request.
 */
export abstract class BaseController {
  
  protected readonly req!: Request;
  protected readonly res!: Response;
  
  protected constructor(req: Request, res: Response) {
    this.req = req;
    this.res = res;
  }

  protected user(): RequestAuthUser {
    return this.req.user as RequestAuthUser;
  }

  /**
   * @param signalComplete 
   * @returns `true` if the express-validator attached to the route has caught
   * a problem with the request, `false` otherwise.
   */
  protected validationFailureWasSent = (signalComplete: () => void): boolean => {
    const errors = validationResult(this.req);
    if (!errors.isEmpty()) {
      sendJSONAndSignal(this.res, 400, { errors: errors.array() }, signalComplete);
      return true;
    }
    return false;
  }
  
  protected abstract logEndpointError(endpoint: string, err: Error): void
}

/**
 * A buildre for the base controller class used to handle requests. Your 
 * specific controller builder should extend this builder.
 */
export abstract class BaseControllerBuilder<C extends IBaseController, CB extends BaseControllerBuilder<C, CB>> {
  
  protected _req?: Request;
  protected _res?: Response;

  protected constructor() {}

  req(req: Request): CB {
    this._req = req;
    return this.self();
  }
  res(res: Response): CB {
    this._res = res;
    return this.self();
  }

  /**
   * Implementations must return the `this` reference.
   */
  protected abstract self(): CB

  protected reqOrThrow(): Request {
    return getOrThrow(this._req, "req")
  }
  protected resOrThrow(): Response {
    return getOrThrow(this._res, "res")
  }

  abstract build(): C
}