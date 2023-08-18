import { v4 as uuidv4 } from "uuid";
import { IUserController } from "../../src/controllers/UserController";
import { MiniTocoUserBuilder, MiniTocoUserDetailBuilder } from "../../src/io_models/MiniTocoUser";
import { waitForControllerCompletion } from "../utils/async_utils";
import { baseUserControllerBuilder } from "../utils/controller_builders";
import { BasicMockResponse, MockRequestBuilder } from "../utils/express_util";
import { MockUserServiceBuilder } from "../utils/mock_services";
import { MiniTocoError, MiniTocoErrorBuilder } from "../../src/io_models/MiniTocoError";
import { UserIDNotFoundError } from "../../src/services/IUserService";
import { MiniTocoBalanceBuilder } from "../../src/io_models/MiniTocoBalance";
import { RequestAuthUser, RequestAuthUserBuilder } from "../../src/io_models/RequestAuthUser";

describe("Featch User", () => {

  let response: BasicMockResponse;

  const createMockRequest = (user_id: string, request_auth_user: RequestAuthUser): Request => {
    return MockRequestBuilder.create()
      .addParam("user_id", user_id)
      .user(request_auth_user)
      .build();
  }
  
  beforeEach(() => {
    jest.clearAllMocks();
    response = BasicMockResponse.create();
  });

  describe("Failure", () => {

    it("Should fail with 500 response when IUserService throws an unexpected error", async () => {
      const user_id = uuidv4();
      const controller_under_test: IUserController = baseUserControllerBuilder()
        .req(
          createMockRequest(
            user_id,
            RequestAuthUserBuilder.create()
              .email("email@example.com")
              .id(user_id)  // <-- must be same as user requested to avoid a 403 and shortcutting the logic.
              .build()
          )
        ).res(response.createMockResponse())
        .userService(
          MockUserServiceBuilder.create()
            .findUserByIdResponse(new Error("Unexpected error"))
            .build()
        ).build();

      await waitForControllerCompletion((signalComplete: () => void) => {
        controller_under_test.fetchUser(signalComplete);
      });

      expect(response.actual_response_code).toBe(500);
    });

    it("Should fail with 403 response when requesting user is not the currently logged-in user", async () => {
      const user_id = uuidv4();
      const expected_error = MiniTocoErrorBuilder.ofPath("user_id")
        .msg("Only the currently-logged in user can fetch their own user details")
        .value(user_id)
        .build();
      const expected_body = MiniTocoError.errorsBody(expected_error);
      const controller_under_test: IUserController = baseUserControllerBuilder()
        .req(
          createMockRequest(
            user_id,
            RequestAuthUserBuilder.create()
              .email("email@example.com")
              .id(uuidv4())  // <-- must be different from user requested to trigger a 403.
              .build()
          )
        ).res(response.createMockResponse())
        .build();
      // NO service configuration required because the controller does the 
      // validation that the requesting user is the user requested before
      // calling any service functions.

      await waitForControllerCompletion((signalComplete: () => void) => {
        controller_under_test.fetchUser(signalComplete);
      });

      expect(response.actual_response_code).toBe(403);
      expect(response.actual_response_body).toStrictEqual(expected_body);
    });

    it("Should fail with 404 response when IUserService throws UserIDNotFoundError", async () => {
      const user_id = uuidv4();
      const expected_error = MiniTocoErrorBuilder.ofPath("user_id")
        .msg("User not found")
        .value(user_id)
        .build();
      const expected_body = MiniTocoError.errorsBody(expected_error);
      const controller_under_test: IUserController = baseUserControllerBuilder()
        .req(
          createMockRequest(
            user_id,
            RequestAuthUserBuilder.create()
              .email("email@example.com")
              .id(user_id)  // <-- must be same as user requested to avoid a 403 and shortcutting the logic.
              .build()
          )
        ).res(response.createMockResponse())
        .userService(
          MockUserServiceBuilder.create()
            .findUserByIdResponse(new UserIDNotFoundError(user_id))
            .build()
        ).build();

      await waitForControllerCompletion((signalComplete: () => void) => {
        controller_under_test.fetchUser(signalComplete);
      });

      expect(response.actual_response_code).toBe(404);
      expect(response.actual_response_body).toEqual(expected_body);
    });
  });

  describe("Success", () => {
    it("Should return MiniTocoUserDetail when user exists and requesting user is the user requested", async () => {
      const user_id = uuidv4();
      const email = "email@example.com";
      const expected_user = MiniTocoUserBuilder.create()
        .id(user_id)
        .createdAt(new Date())
        .updatedAt(new Date())
        .email(email)
        .firstName("First")
        .lastName("Last")
        .pwHash("password hash")
        .build();
      const expected_balance = MiniTocoBalanceBuilder.create()
        .value(BigInt(1))
        .updatedAt(new Date())
        .build();
      const expected = MiniTocoUserDetailBuilder.create()
        .balance(expected_balance)
        .user(expected_user)
        .build();
      
      const controller_under_test: IUserController = baseUserControllerBuilder()
        .req(
          createMockRequest(
            user_id,
            RequestAuthUserBuilder.create()
              .email(email)
              .id(user_id)  // <-- must be same as user requested to avoid a 403 and shortcutting the logic.
              .build()
          )
        ).res(response.createMockResponse())
        .userService(
          MockUserServiceBuilder.create()
            .findUserByIdResponse(expected)
            .build()
        ).build();

      await waitForControllerCompletion((signalComplete: () => void) => {
        controller_under_test.fetchUser(signalComplete);
      });

      expect(response.actual_response_code).toBe(200);
      expect(response.actual_response_body).toEqual(expected);
    });
  });
});