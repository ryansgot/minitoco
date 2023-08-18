import { v4 as uuidv4 } from "uuid";
import { IUserController } from "../../src/controllers/UserController";
import { MiniTocoUserBuilder, MiniTocoUserToCreate, MiniTocoUserToCreateBuilder } from "../../src/io_models/MiniTocoUser";
import { TokenDataBuilder } from "../../src/io_models/TokenData";
import { waitForControllerCompletion } from "../utils/async_utils";
import { baseUserControllerBuilder } from "../utils/controller_builders";
import { BasicMockResponse, MockRequestBuilder } from "../utils/express_util";
import { MockPasswordServiceBuilder, MockTokenServiceBuilder, MockUserServiceBuilder } from "../utils/mock_services";
import { MiniTocoError, MiniTocoErrorBuilder } from "../../src/io_models/MiniTocoError";
import { UserAlreadyExistsError } from "../../src/services/IUserService";

describe("Create User", () => {

  let response: BasicMockResponse;

  const test_user_to_create: MiniTocoUserToCreate = MiniTocoUserToCreateBuilder.create()
    .email("email@example.com")
    .password("password")
    .firstName("First")
    .lastName("Last")
    .build();

  const createMockRequest = (user_to_create: MiniTocoUserToCreate = test_user_to_create): Request => {
    return MockRequestBuilder.create()
      .body(user_to_create)
      .build();
  }
  
  beforeEach(() => {
    jest.clearAllMocks();
    response = BasicMockResponse.create();
  });

  describe("Failure", () => {

    it("Should fail with 500 response when IPasswordService throws an unexpected error", async () => {
      const controller_under_test: IUserController = baseUserControllerBuilder()
        .req(createMockRequest())
        .res(response.createMockResponse())
        .passwordService(
          MockPasswordServiceBuilder.create()
            .createPasswordHash(new Error("Problem generating the password hash"))
            .build()
        ).build();

      await waitForControllerCompletion((signalComplete: () => void) => {
        controller_under_test.createUser(signalComplete);
      });

      expect(response.actual_response_code).toBe(500);
    });

    it("Should fail with 500 response when IUserService throws an unexpected error", async () => {
      const controller_under_test: IUserController = baseUserControllerBuilder()
        .req(createMockRequest())
        .res(response.createMockResponse())
        .passwordService(
          MockPasswordServiceBuilder.create()
            .createPasswordHash("password hash")
            .build()
        ).userService(
          MockUserServiceBuilder.create()
            .createUser(new Error("Unnexpected Error"))
            .build()
        ).build();

      await waitForControllerCompletion((signalComplete: () => void) => {
        controller_under_test.createUser(signalComplete);
      });

      expect(response.actual_response_code).toBe(500);
    });

    it("Should fail with 500 response when ITokenService throws an unexpected error", async () => {
      const returned_user = MiniTocoUserBuilder.create()
        .id(uuidv4())
        .email(test_user_to_create.email)
        .firstName(test_user_to_create.first_name)
        .lastName(test_user_to_create.last_name)
        .createdAt(new Date())
        .updatedAt(new Date())
        .pwHash("password hash")
        .build()
      const controller_under_test: IUserController = baseUserControllerBuilder()
        .req(createMockRequest())
        .res(response.createMockResponse())
        .passwordService(
          MockPasswordServiceBuilder.create()
            .createPasswordHash("password hash")
            .build()
        ).userService(
          MockUserServiceBuilder.create()
            .createUser(returned_user)
            .build()
        ).tokenService(
          MockTokenServiceBuilder.create()
            .createTokenData(new Error("Unnexpected Error"))
            .build()
        ).build();

      await waitForControllerCompletion((signalComplete: () => void) => {
        controller_under_test.createUser(signalComplete);
      });

      expect(response.actual_response_code).toBe(500);
    });

    it("Should fail with 409 response when IUserService throws UserAlreadyExistsError throws an unexpected error", async () => {
      const returned_error = MiniTocoErrorBuilder.ofBody("email")
        .msg("User already exists")
        .value(test_user_to_create.email)
        .build();
      const expected_body = MiniTocoError.errorsBody(returned_error);
      
      const controller_under_test: IUserController = baseUserControllerBuilder()
        .req(createMockRequest())
        .res(response.createMockResponse())
        .passwordService(
          MockPasswordServiceBuilder.create()
            .createPasswordHash("password hash")
            .build()
        ).userService(
          MockUserServiceBuilder.create()
            .createUser(new UserAlreadyExistsError(test_user_to_create.email))
            .build()
        ).build();

      await waitForControllerCompletion((signalComplete: () => void) => {
        controller_under_test.createUser(signalComplete);
      });

      expect(response.actual_response_code).toBe(409);
      expect(response.actual_response_body).toStrictEqual(expected_body);
    });
  });

  describe("Success", () => {
      
    it("Should succeed when password hash is created, user is successfully created, and token data is created", async () => {
      const expected_password_hash = "password hash";
      const expected = TokenDataBuilder.create()
        .accessToken("access token")
        .refreshToken("refresh token")
        .expiresIn(1000)
        .build();
      const returned_user = MockUserServiceBuilder.create()
        .createUser(
          MiniTocoUserBuilder.create()
            .id(uuidv4())
            .email(test_user_to_create.email)
            .firstName(test_user_to_create.first_name)
            .lastName(test_user_to_create.last_name)
            .createdAt(new Date())
            .updatedAt(new Date())
            .pwHash(expected_password_hash)
            .build()
        ).build()
      const controller_under_test: IUserController = baseUserControllerBuilder()
        .req(createMockRequest())
        .res(response.createMockResponse())
        .passwordService(
          MockPasswordServiceBuilder.create()
            .createPasswordHash(expected_password_hash)
            .build()
        ).userService(returned_user)
        .tokenService(
          MockTokenServiceBuilder.create()
            .createTokenData(expected)
            .build()
        ).build();

      await waitForControllerCompletion((signalComplete: () => void) => {
        controller_under_test.createUser(signalComplete);
      });

      expect(response.actual_response_code).toBe(200);
      expect(response.actual_response_body).toStrictEqual(expected);
    });
  });
});