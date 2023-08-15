import { getOrThrow } from "../utils/ts_util";

export class MiniTocoError {
  readonly value!: string;
  readonly msg!: string;
  readonly param?: string;
  readonly location?: string;

  /**
   * Base creation function for a {@link MiniTocoError}
   * @param value The bad value, if applicable
   * @param msg the message to send
   * @param param the name of the parameter that had the bad value, if applicable
   * @param location the optional location of the bad value
   * @returns A {@link MiniTocoError}
   */
  static create(value: string, msg: string, param?: string, location?: string): MiniTocoError {
    return new MiniTocoError(value, msg, param, location);
  }

  /**
   * @param value The bad value, if it exists
   * @returns Standard error for when an auth token is either expired or not present
   */
  static loginRequired(token?: string): MiniTocoError {
    return MiniTocoError.create(token || "", "authentication required", "Authorization", "header");
  }

  /**
   * creates an MiniToco error for when the service encounters an unrecoverable problem
   * @returns MiniTocoError
   */
  static internalServer(): MiniTocoError {
    return MiniTocoError.create("", "Internal ServerError")
  }

  /**
   * 
   * @param initial_error The first error to be returned
   * @param errors subsequent errors
   * @returns a typical error body to send as a response that will be a 
   * consistent format for the client.
   */
  static errorsBody(initial_error: MiniTocoError, ...errors: Array<MiniTocoError>): { errors: Array<MiniTocoError> } {
    const actual_errors = new Array<MiniTocoError>(errors.length + 1);
    actual_errors[0] = initial_error;
    errors.forEach((error: MiniTocoError, index: number) => {
      actual_errors[index + 1] = error;
    });
    return { errors: actual_errors }
  }

  private constructor(value: string, msg: string, param?: string, location?: string) {
    this.value = value;
    this.msg = msg;
    this.param = param;
    this.location = location;
  }

  newBuilder(): MiniTocoErrorBuilder {
    return MiniTocoErrorBuilder.create(this);
  }
}

export class MiniTocoErrorBuilder {
  private _value?: string;
  private _msg?: string;
  private _param?: string;
  private _location?: string;

  static create(from?: MiniTocoError): MiniTocoErrorBuilder {
    const builder = new MiniTocoErrorBuilder();
    if (from) {
      builder.value(from.value);
      builder.msg(from.msg);
      builder.param(from.param);
      builder.location(from.location);
    }
    return builder;
  }

  static ofBody(field_name: string): MiniTocoErrorBuilder {
    return MiniTocoErrorBuilder.create().location("body").param(field_name);
  }

  static ofQuery(query_parameter_name: string): MiniTocoErrorBuilder {
    return MiniTocoErrorBuilder.create().location("query").param(query_parameter_name);
  }

  static ofHeader(header_name: string): MiniTocoErrorBuilder {
    return MiniTocoErrorBuilder.create().location("header").param(header_name);
  }

  private constructor() { }

  value(value: string): MiniTocoErrorBuilder {
    this._value = value;
    return this;
  }
  msg(msg: string): MiniTocoErrorBuilder {
    this._msg = msg;
    return this;
  }
  param(param: string | undefined): MiniTocoErrorBuilder {
    this._param = param;
    return this;
  }
  location(location: string | undefined): MiniTocoErrorBuilder {
    this._location = location;
    return this;
  }

  build(): MiniTocoError {
    return MiniTocoError.create(
      getOrThrow(this._value, "value"),
      getOrThrow(this._msg, "msg"),
      this._param,
      this._location
    );
  }
}