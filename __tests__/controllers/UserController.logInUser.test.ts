import { v4 as uuidv4 } from "uuid";
import { IUserController } from "../../src/controllers/UserController";
import { MiniTocoUserBuilder, MiniTocoUserDetailBuilder } from "../../src/io_models/MiniTocoUser";
import { TokenDataBuilder } from "../../src/io_models/TokenData";
import { CreateTokenWithPasswordRequest, CreateTokenWithPasswordRequestBuilder } from "../../src/io_models/CreateTokenRequest";
import { waitForControllerCompletion } from "../utils/async_utils";
import { baseUserControllerBuilder } from "../utils/controller_builders";
import { BasicMockResponse, MockRequestBuilder } from "../utils/express_util";
import { MockPasswordServiceBuilder, MockTokenServiceBuilder, MockUserServiceBuilder } from "../utils/mock_services";
import { MiniTocoError, MiniTocoErrorBuilder } from "../../src/io_models/MiniTocoError";
import { UserEmailNotFoundError } from "../../src/services/IUserService";
import { MiniTocoBalanceBuilder } from "../../src/io_models/MiniTocoBalance";

describe("Log in User", () => {

  let response: BasicMockResponse;

  const test_log_in_request: CreateTokenWithPasswordRequest = CreateTokenWithPasswordRequestBuilder.create()
    .username("email@example.com")
    .password("password")
    .build();

  const createMockRequest = (log_in_request: CreateTokenWithPasswordRequest = test_log_in_request): Request => {
    return MockRequestBuilder.create()
      .body(log_in_request)
      .build();
  }
  
  beforeEach(() => {
    jest.clearAllMocks();
    response = BasicMockResponse.create();
  });

  describe("Failure", () => {

    it("Should fail with 500 response when IUserService throws an unexpected error", async () => {
      const controller_under_test: IUserController = baseUserControllerBuilder()
        .req(createMockRequest())
        .res(response.createMockResponse())
        .userService(
          MockUserServiceBuilder.create()
            .findUserByEmail(new Error("Unexpected error"))
            .build()
        ).build();

      await waitForControllerCompletion((signalComplete: () => void) => {
        controller_under_test.logInUser(signalComplete);
      });

      expect(response.actual_response_code).toBe(500);
    });

    it("Should fail with 500 response when IUserService throws an unexpected error", async () => {
      const expected_error = MiniTocoErrorBuilder.ofBody("email or password")
        .msg("email or password incorrect")
        .value(test_log_in_request.username)
        .build();
      const expected_body = MiniTocoError.errorsBody(expected_error);
      const controller_under_test: IUserController = baseUserControllerBuilder()
        .req(createMockRequest())
        .res(response.createMockResponse())
        .userService(
          MockUserServiceBuilder.create()
            .findUserByEmail(new Error("Unexpected error"))
            .build()
        ).build();

      await waitForControllerCompletion((signalComplete: () => void) => {
        controller_under_test.logInUser(signalComplete);
      });

      expect(response.actual_response_code).toBe(500);
    });

    it("Should fail with 401 response when IUserService throws an UserEmailNotFoundError", async () => {
      const expected_error = MiniTocoErrorBuilder.ofBody("email or password")
        .msg("email or password incorrect")
        .value(test_log_in_request.username)
        .build();
      const expected_body = MiniTocoError.errorsBody(expected_error);
      const controller_under_test: IUserController = baseUserControllerBuilder()
        .req(createMockRequest())
        .res(response.createMockResponse())
        .userService(
          MockUserServiceBuilder.create()
            .findUserByEmail(new UserEmailNotFoundError(test_log_in_request.username))
            .build()
        ).build();

      await waitForControllerCompletion((signalComplete: () => void) => {
        controller_under_test.logInUser(signalComplete);
      });

      expect(response.actual_response_code).toBe(401);
      expect(response.actual_response_body).toStrictEqual(expected_body);
    });

    it("Should fail with 401 response when IPasswordService throws an error when checking password match", async () => {
      const found_user = MiniTocoUserBuilder.create()
        .id(uuidv4())
        .email(test_log_in_request.username)
        .firstName("First")
        .lastName("Last")
        .createdAt(new Date())
        .updatedAt(new Date())
        .pwHash("pw hash")
        .build()
      const expected_error = MiniTocoErrorBuilder.ofBody("email or password")
        .msg("email or password incorrect")
        .value(test_log_in_request.username)
        .build();
      const expected_body = MiniTocoError.errorsBody(expected_error);
      const controller_under_test: IUserController = baseUserControllerBuilder()
        .req(createMockRequest())
        .res(response.createMockResponse())
        .userService(
          MockUserServiceBuilder.create()
            .findUserByEmail(found_user)
            .build()
        ).passwordService(
          MockPasswordServiceBuilder.create()
            .isPasswordMatch(new Error("Problem generating the password hash"))
            .build()
        ).build();

      await waitForControllerCompletion((signalComplete: () => void) => {
        controller_under_test.logInUser(signalComplete);
      });

      expect(response.actual_response_code).toBe(401);
      expect(response.actual_response_body).toStrictEqual(expected_body);
    });

    it("Should fail with 401 response when IPasswordService returns not a match", async () => {
      const found_user = MiniTocoUserBuilder.create()
        .id(uuidv4())
        .email(test_log_in_request.username)
        .firstName("First")
        .lastName("Last")
        .createdAt(new Date())
        .updatedAt(new Date())
        .pwHash("pw hash")
        .build()
      const expected_error = MiniTocoErrorBuilder.ofBody("email or password")
        .msg("email or password incorrect")
        .value(test_log_in_request.username)
        .build();
      const expected_body = MiniTocoError.errorsBody(expected_error);
      const controller_under_test: IUserController = baseUserControllerBuilder()
        .req(createMockRequest())
        .res(response.createMockResponse())
        .userService(
          MockUserServiceBuilder.create()
            .findUserByEmail(found_user)
            .build()
        ).passwordService(
          MockPasswordServiceBuilder.create()
            .isPasswordMatch(false)
            .build()
        ).build();

      await waitForControllerCompletion((signalComplete: () => void) => {
        controller_under_test.logInUser(signalComplete);
      });

      expect(response.actual_response_code).toBe(401);
      expect(response.actual_response_body).toStrictEqual(expected_body);
    });

    it("Should fail with 500 response when ITokenService fails to create TokenDAta", async () => {
      const found_user = MiniTocoUserBuilder.create()
        .id(uuidv4())
        .email(test_log_in_request.username)
        .firstName("First")
        .lastName("Last")
        .createdAt(new Date())
        .updatedAt(new Date())
        .pwHash("pw hash")
        .build()
      const found_balance = MiniTocoBalanceBuilder.create()
        .updatedAt(new Date())
        .value(BigInt(100))
        .build();
      const found_user_and_balance = MiniTocoUserDetailBuilder.create()
        .user(found_user)
        .balance(found_balance)
        .build();
      const expected_error = MiniTocoErrorBuilder.ofBody("email or password")
        .msg("email or password incorrect")
        .value(test_log_in_request.username)
        .build();
      const expected_body = MiniTocoError.errorsBody(expected_error);
      const controller_under_test: IUserController = baseUserControllerBuilder()
        .req(createMockRequest())
        .res(response.createMockResponse())
        .userService(
          MockUserServiceBuilder.create()
            .findUserByEmail(found_user_and_balance)
            .build()
        ).passwordService(
          MockPasswordServiceBuilder.create()
            .isPasswordMatch(true)
            .build()
        ).tokenService(
          MockTokenServiceBuilder.create()
            .createTokenData(new Error("Problem generating the token"))
            .build()
        ).build();

      await waitForControllerCompletion((signalComplete: () => void) => {
        controller_under_test.logInUser(signalComplete);
      });

      expect(response.actual_response_code).toBe(500);
    });
  });

  describe("Success", () => {
    it("Should return TokenData when user exists, password matches, and TokenData successfully created", async () => {
      const expected = TokenDataBuilder.create()  
        .accessToken("access token")
        .refreshToken("refresh token")
        .expiresIn(1000)
        .build();

      const found_user = MiniTocoUserBuilder.create()
        .id(uuidv4())
        .email(test_log_in_request.username)
        .firstName("First")
        .lastName("Last")
        .createdAt(new Date())
        .updatedAt(new Date())
        .pwHash("pw hash")
        .build()
      const found_balance = MiniTocoBalanceBuilder.create()
        .updatedAt(new Date())
        .value(BigInt(100))
        .build();
      const found_user_and_balance = MiniTocoUserDetailBuilder.create()
        .user(found_user)
        .balance(found_balance)
        .build();
      const controller_under_test: IUserController = baseUserControllerBuilder()
        .req(createMockRequest())
        .res(response.createMockResponse())
        .userService(
          MockUserServiceBuilder.create()
            .findUserByEmail(found_user_and_balance)
            .build()
        ).passwordService(
          MockPasswordServiceBuilder.create()
            .isPasswordMatch(true)
            .build()
        ).tokenService(
          MockTokenServiceBuilder.create()
            .createTokenData(expected)
            .build()
        ).build();

      await waitForControllerCompletion((signalComplete: () => void) => {
        controller_under_test.logInUser(signalComplete);
      });

      expect(response.actual_response_code).toBe(200);
      expect(response.actual_response_body).toStrictEqual(expected);
    });
  });
});