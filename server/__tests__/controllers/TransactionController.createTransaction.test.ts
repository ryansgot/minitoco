import { v4 as uuidv4 } from "uuid";
import { RequestAuthUser, RequestAuthUserBuilder } from "../../src/io_models/RequestAuthUser";
import { ITransactionController } from "../../src/controllers/TransactionController";
import { BasicMockResponse, MockRequestBuilder } from "../utils/express_util";
import { baseTransactionControllerBuilder } from "../utils/controller_builders";
import { MockTransactionServiceBuilder, MockUserServiceBuilder } from "../utils/mock_services";
import { waitForControllerCompletion } from "../utils/async_utils";
import { UserEmailNotFoundError } from "../../src/services/IUserService";
import { MiniTocoError, MiniTocoErrorBuilder } from "../../src/io_models/MiniTocoError";
import { MiniTocoUserBuilder, MiniTocoUserDetailBuilder } from "../../src/io_models/MiniTocoUser";
import { MiniTocoBalanceBuilder } from "../../src/io_models/MiniTocoBalance";
import { TransactionInsufficientFundsError } from "../../src/services/ITransactionService";
import { MiniTocoTransactionBuilder, MiniTocoTransactionResultBuilder } from "../../src/io_models/MiniTocoTransaction";


describe("createTransaction", () => {
  
  let response: BasicMockResponse;
  
  beforeEach(() => {
    jest.clearAllMocks();
    response = BasicMockResponse.create();
  });

  const createMockRequest = (
    to_user_email: string = "receiver@example.com",
    amount: bigint = BigInt(1),
    request_auth_user: RequestAuthUser = RequestAuthUserBuilder.create()
      .email("sender@example.com")
      .id(uuidv4())
      .build()
  ): Request => {
    return MockRequestBuilder.create()
      .body({ amount: amount.toString(), to_user_email: to_user_email })
      .user(request_auth_user)
      .build();
  }

  describe("Failure", () => {
    it("should send 500 response when IUserService throws an unexpected error", async () => {
      const controller_under_test: ITransactionController = baseTransactionControllerBuilder()
        .req(createMockRequest())
        .res(response.createMockResponse())
        .userService(
          MockUserServiceBuilder.create()
            .findUserByEmail(new Error("Unexpected error"))
            .build()
        ).build();  // <-- don't need to configure TransactionService because user is requesed first.

      await waitForControllerCompletion((signalComplete: () => void) => {
        controller_under_test.createTransaction(signalComplete);
      });

      expect(response.actual_response_code).toBe(500);
    });

    it("Should send 404 response when IUserService throws UserEmailNotFoundError for sender email", async () => {
      const receiver_email = "email@example.com";
      const expected_error = MiniTocoErrorBuilder.ofBody("to_user_email")
        .msg("to-user not found")
        .value(receiver_email)
        .build();
      const expected_error_body = MiniTocoError.errorsBody(expected_error);
      const controller_under_test: ITransactionController = baseTransactionControllerBuilder()
        .req(createMockRequest(receiver_email))
        .res(response.createMockResponse())
        .userService(
          MockUserServiceBuilder.create()
            .findUserByEmail(new UserEmailNotFoundError(receiver_email))
            .build()
        ).build();  // <-- don't need to configure TransactionService because user is requesed first.

      await waitForControllerCompletion((signalComplete: () => void) => {
        controller_under_test.createTransaction(signalComplete);
      });

      expect(response.actual_response_code).toBe(404);
      expect(response.actual_response_body).toEqual(expected_error_body);
    });

    it("Should send 500 response when ITransactionService throws unexpected error", async () => {
      const receiver_email = "receiver@example.com";
      const receiver_user_detail = MiniTocoUserDetailBuilder.create()
        .user(
          MiniTocoUserBuilder.create()
            .email(receiver_email)
            .id(uuidv4())
            .createdAt(new Date())
            .updatedAt(new Date())
            .lastName("Receiver")
            .firstName("Toco")
            .pwHash("hash")
            .build()
        ).balance(
          MiniTocoBalanceBuilder.create()
            .value(BigInt(0))
            .updatedAt(new Date())
            .build()
        ).build();
      const amount = BigInt(100);
      const expected_error = MiniTocoErrorBuilder.ofBody("amount")
        .msg("insufficient funds")
        .value(amount.toString())
        .build();
      const expected_error_body = MiniTocoError.errorsBody(expected_error);
      const controller_under_test: ITransactionController = baseTransactionControllerBuilder()
        .req(createMockRequest(receiver_user_detail.user.email, amount))
        .res(response.createMockResponse())
        .userService(
          MockUserServiceBuilder.create()
            .findUserByEmail(receiver_user_detail)
            .build()
        ).transactionService(
          MockTransactionServiceBuilder.create()
            .createTransaction(new Error("unexpected"))
            .build()
        ).build()

      await waitForControllerCompletion((signalComplete: () => void) => {
        controller_under_test.createTransaction(signalComplete);
      });

      expect(response.actual_response_code).toBe(500);
    });

    it("Should send 409 response when ITransactionService throws TransactionInsufficientFundsError", async () => {
      const receiver_email = "receiver@example.com";
      const receiver_user_detail = MiniTocoUserDetailBuilder.create()
        .user(
          MiniTocoUserBuilder.create()
            .email(receiver_email)
            .id(uuidv4())
            .createdAt(new Date())
            .updatedAt(new Date())
            .lastName("Receiver")
            .firstName("Toco")
            .pwHash("hash")
            .build()
        ).balance(
          MiniTocoBalanceBuilder.create()
            .value(BigInt(0))
            .updatedAt(new Date())
            .build()
        ).build();
      const amount = BigInt(100);
      const expected_error = MiniTocoErrorBuilder.ofBody("amount")
        .msg("insufficient funds")
        .value(amount.toString())
        .build();
      const expected_error_body = MiniTocoError.errorsBody(expected_error);
      const controller_under_test: ITransactionController = baseTransactionControllerBuilder()
        .req(createMockRequest(receiver_user_detail.user.email, amount))
        .res(response.createMockResponse())
        .userService(
          MockUserServiceBuilder.create()
            .findUserByEmail(receiver_user_detail)
            .build()
        ).transactionService(
          MockTransactionServiceBuilder.create()
            .createTransaction(new TransactionInsufficientFundsError("", BigInt(100)))
            .build()
        ).build()

      await waitForControllerCompletion((signalComplete: () => void) => {
        controller_under_test.createTransaction(signalComplete);
      });

      expect(response.actual_response_code).toBe(409);
      expect(response.actual_response_body).toEqual(expected_error_body);
    });
  });

  describe("Success", () => {
    it("Should send 200 response with transaction result", async () => {
      const sender_user_id = uuidv4();
      const receiver_email = "receiver@example.com";
      const receiver_user_detail = MiniTocoUserDetailBuilder.create()
        .user(
          MiniTocoUserBuilder.create()
            .email(receiver_email)
            .id(uuidv4())
            .createdAt(new Date())
            .updatedAt(new Date())
            .lastName("Receiver")
            .firstName("Toco")
            .pwHash("hash")
            .build()
        ).balance(
          MiniTocoBalanceBuilder.create()
            .value(BigInt(0))
            .updatedAt(new Date())
            .build()
        ).build();
      const amount = BigInt(100);
      const expected = MiniTocoTransactionResultBuilder.create()
        .transaction(
          MiniTocoTransactionBuilder.create()
            .amount(amount)
            .fromUserId(sender_user_id)
            .fromUserEmail("sender@email.com")
            .toUserId(uuidv4())
            .toUserEmail(receiver_email)
            .id(uuidv4())
            .date(new Date())
            .build()
        ).finalBalance(BigInt(10))
        .build();
      const controller_under_test: ITransactionController = baseTransactionControllerBuilder()
        .req(
          createMockRequest(
            receiver_user_detail.user.email,
            amount,
            RequestAuthUserBuilder.create()
              .id(sender_user_id)
              .email("sender@example.com")
              .build()
          )
        ).res(response.createMockResponse())
        .userService(
          MockUserServiceBuilder.create()
            .findUserByEmail(receiver_user_detail)
            .build()
        ).transactionService(
          MockTransactionServiceBuilder.create()
            .createTransaction(expected)
            .build()
        ).build()

      await waitForControllerCompletion((signalComplete: () => void) => {
        controller_under_test.createTransaction(signalComplete);
      });

      expect(response.actual_response_code).toBe(200);
      expect(response.actual_response_body).toEqual(expected);
    });
  });
});