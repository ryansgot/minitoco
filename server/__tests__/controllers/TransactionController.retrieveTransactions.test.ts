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
import { MiniTocoTransaction, MiniTocoTransactionBuilder, MiniTocoTransactionResultBuilder } from "../../src/io_models/MiniTocoTransaction";


describe("createTransaction", () => {
  
  let response: BasicMockResponse;
  
  beforeEach(() => {
    jest.clearAllMocks();
    response = BasicMockResponse.create();
  });

  const createMockRequest = (
    request_auth_user: RequestAuthUser = RequestAuthUserBuilder.create()
      .email("sender@example.com")
      .id(uuidv4())
      .build()
  ): Request => {
    return MockRequestBuilder.create()
      .user(request_auth_user)
      .build();
  }

  describe("Failure", () => {
    it("should send 500 response when ITransactionService throws an unexpected error", async () => {
      const controller_under_test: ITransactionController = baseTransactionControllerBuilder()
        .req(createMockRequest())
        .res(response.createMockResponse())
        .transactionService(
          MockTransactionServiceBuilder.create()
            .retrieveTransactions(new Error("Unexpected error"))
            .build()
        ).build();  // <-- don't need to configure TransactionService because user is requesed first.

      await waitForControllerCompletion((signalComplete: () => void) => {
        controller_under_test.fetchTransactions(signalComplete);
      });

      expect(response.actual_response_code).toBe(500);
    });
  });

  describe("Success", () => {

    it("Should send 200 response with all transactions", async () => {
      const sender_user_id = uuidv4();
      const receiver_email = "receiver@example.com";
      const expected: Array<MiniTocoTransaction> = [
        MiniTocoTransactionBuilder.create()
          .amount(BigInt(1))
          .date(new Date())
          .fromUserId(sender_user_id)
          .id(uuidv4())
          .toUserEmail(receiver_email)
          .build(),
        MiniTocoTransactionBuilder.create()
          .amount(BigInt(2))
          .date(new Date())
          .fromUserId(sender_user_id)
          .id(uuidv4())
          .toUserEmail(receiver_email)
          .build()
      ];

      const controller_under_test: ITransactionController = baseTransactionControllerBuilder()
        .req(
          createMockRequest(
            RequestAuthUserBuilder.create()
              .id(sender_user_id)
              .email("sender@example.com")
              .build()
          )
        ).res(response.createMockResponse())
        .transactionService(
          MockTransactionServiceBuilder.create()
            .retrieveTransactions(expected)
            .build()
        ).build()

      await waitForControllerCompletion((signalComplete: () => void) => {
        controller_under_test.fetchTransactions(signalComplete);
      });

      expect(response.actual_response_code).toBe(200);
      expect(response.actual_response_body).toEqual(expected);
    });
  });
});