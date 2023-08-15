import { RequestAuthUser } from "../../src/io_models/RequestAuthUser";

export class MockResponseBuilder {

  private _captureStatus: (status: number) => void = (status: number) => { throw new Error("Did you forget to configure the expected status?") };
  private _captureResponseBody: (body: object) => void = (body: object) => { throw new Error("Response body not expected, but got: " + JSON.stringify(body)) };
  private _captureRedirectURL: (redirect_url: string) => void = (redirect_url: string) => { throw new Error("Redirect unexpected, but got: " + redirect_url) };

  static create(): MockResponseBuilder {
    return new MockResponseBuilder();
  }

  private constructor() {}

  captureStatus(captureStatus: (status: number) => void): MockResponseBuilder {
    this._captureStatus = captureStatus;
    return this;
  }
  captureResponseBody(captureResponseBody: (body: object) => void): MockResponseBuilder {
    this._captureResponseBody = captureResponseBody;
    return this;
  }
  captureRedirectURL(captureRedirectURL: (redirect_url: string) => void): MockResponseBuilder {
    this._captureRedirectURL = captureRedirectURL;
    return this;
  }

  build(): Response {
    const captureResponseBody = this._captureResponseBody;
    const captureStatus = this._captureStatus;
    const captureRedirectURL = this._captureRedirectURL;
    const json_mock = jest.fn();
    const send_mock = jest.fn();
    const status_mock = jest.fn();
    const redirect_mock = jest.fn();
    let ret: Partial<Response>;
    ret = <Partial<Response>> <unknown> {
      json_mock: json_mock,
      send_mock: send_mock,
      status_mock: status_mock,
      redirect_mock: redirect_mock,
      json: json_mock.mockImplementation((actual_json_sent: object) => {
        captureResponseBody(actual_json_sent);
      }),
      send: send_mock.mockImplementation((actual_object_sent: object) => {
        captureResponseBody(actual_object_sent);
      }),
      status: status_mock.mockImplementation((code: number) => {
        captureStatus(code);
        return ret;
      }),
      redirect: redirect_mock.mockImplementation((code: number, redirect_url: string) => {
        captureStatus(code);
        captureRedirectURL(redirect_url);
      })
    }
    return ret;
  }
}

export class BasicMockResponse {

  actual_response_code: number = 0;
  actual_response_body: object = {};
  actual_redirect_url: string = "";

  static create(): BasicMockResponse {
    return new BasicMockResponse()
  }

  private constructor() {}

  createMockResponse(): Response {
    const builder = MockResponseBuilder.create()
      .captureStatus((status: number) => { this.actual_response_code = status; })
      .captureResponseBody((body: object) => { this.actual_response_body = body; })
      .captureRedirectURL((redirect_url: string) => { this.actual_redirect_url = redirect_url; })
    return builder.build();
  }
}

export class MockRequestBuilder {
  private _request_auth_user?: RequestAuthUser;
  private _body?: object | null;
  private _headers: Map<string, string> = new Map<string, string>();
  private _params: Map<string, string> = new Map<string, string>();
  private _query_params: Map<string, string> = new Map<string, string>();

  static create(): MockRequestBuilder {
    return new MockRequestBuilder();
  }

  private constructor() {}

  body(body: object | null): MockRequestBuilder {
    this._body = body;
    return this;
  }
  addHeader(key: string, value: string): MockRequestBuilder {
    this._headers.set(key, value);
    return this;
  }
  removeHeader(key: string): MockRequestBuilder {
    this._headers.delete(key);
    return this;
  }
  addParam(key: string, value: string): MockRequestBuilder {
    this._params.set(key, value);
    return this;
  }
  addQueryParam(key: string, value: string): MockRequestBuilder {
    this._query_params.set(key, value);
    return this;
  }
  removeParam(key: string): MockRequestBuilder {
    this._params.delete(key);
    return this;
  }
  user(request_auth_user: RequestAuthUser): MockRequestBuilder {
    this._request_auth_user = request_auth_user;
    return this;
  }

  build(): Request {
    const user = this._request_auth_user;
    const body = this._body;
    const header_map = this._headers;
    const query_params = Object.fromEntries(this._query_params);
    const params = Object.fromEntries(this._params);
    return <Request> <unknown> {
      header: jest.fn((name: string): string | undefined => header_map.get(name)),
      headers: header_map,
      body: body,
      params: params,
      query: query_params,
      user: user
    };
  }
}