import { v4 as uuidv4 } from "uuid";
import { MockPrismaContext, createKnownRequestErrorRecordNotFound, createMockPrismaContext, createUnknownRequestError } from "../utils/prisma_util";
import { ITransactionService, TransactionInsufficientFundsError } from "../../src/services/ITransactionService";
import { createTransactionService } from "../../src/services/TransactionService";
import { UserIDNotFoundError } from "../../src/services/IUserService";
import { MiniTocoTransactionBuilder, MiniTocoTransactionResult, MiniTocoTransactionResultBuilder } from "../../src/io_models/MiniTocoTransaction";

describe("Transaction Service", () => {

  let mock_prisma_context: MockPrismaContext;
  let service_under_test: ITransactionService;
  
  const test_email = "email@example.com";

  beforeEach(() => {
    mock_prisma_context = createMockPrismaContext();
    service_under_test = createTransactionService(mock_prisma_context);
  });

  describe("createTransaction", () => {

    describe("Failure", () => {

      it("should throw UserIDNotFoundError with the correct user ID when the sender is not found", async () => {
        const input_from_user_id = uuidv4();
        const input_to_user_id = uuidv4();
        const input_amount = BigInt(1);

        mock_prisma_context.prisma.balance.update.mockRejectedValue(createKnownRequestErrorRecordNotFound("user_id"));

        try {
          await service_under_test.createTransaction(input_amount, input_from_user_id, input_to_user_id);
          // The real logic of the function exists within the database transaction, so we have to provide
          // access to the function passed to the transaction. The below does that.
          const tx_fun = mock_prisma_context.prisma.$transaction.mock.calls[0][0] as (tx) => Promise<MiniTocoTransactionResult>;
          await tx_fun(mock_prisma_context.prisma);
          fail("Expected UserIDNotFoundError error");
        } catch (error) {
          expect(error).toBeInstanceOf(UserIDNotFoundError);
          expect(error.user_id).toBe(input_from_user_id);
        }
      });

      it("should throw TransactionInsufficientFundsError with the correct user ID when the sender amount would be negative after transaction", async () => {
        const input_from_user_id = uuidv4();
        const input_to_user_id = uuidv4();
        const input_amount = BigInt(1);

        mock_prisma_context.prisma.balance.update.mockRejectedValue(createUnknownRequestError("balance_nonnegative_check"));

        try {
          await service_under_test.createTransaction(input_amount, input_from_user_id, input_to_user_id);
          // The real logic of the function exists within the database transaction, so we have to provide
          // access to the function passed to the transaction. The below does that.
          const tx_fun = mock_prisma_context.prisma.$transaction.mock.calls[0][0] as (tx) => Promise<MiniTocoTransactionResult>;
          await tx_fun(mock_prisma_context.prisma);
          fail("Expected TransactionInsufficientFundsError error");
        } catch (error) {
          expect(error).toBeInstanceOf(TransactionInsufficientFundsError);
          expect(error.user_id).toBe(input_from_user_id);
          expect(error.amount).toBe(input_amount);
        }
      });

      it("should throw UserIDNotFoundError with the correct user ID when the receiver is not found", async () => {
        const input_from_user_id = uuidv4();
        const input_to_user_id = uuidv4();
        const input_amount = BigInt(1);

        // successful first call to update--then rejected call to update
        mock_prisma_context.prisma.balance.update.mockResolvedValueOnce({
          user_id: input_from_user_id,
          value: BigInt(1),
          updated_at: new Date(),
          created_at: new Date()
        }).mockRejectedValue(createKnownRequestErrorRecordNotFound("user_id"));

        try {
          await service_under_test.createTransaction(input_amount, input_from_user_id, input_to_user_id);
          // The real logic of the function exists within the database transaction, so we have to provide
          // access to the function passed to the transaction. The below does that.
          const tx_fun = mock_prisma_context.prisma.$transaction.mock.calls[0][0] as (tx) => Promise<MiniTocoTransactionResult>;
          await tx_fun(mock_prisma_context.prisma);
          fail("Expected UserIDNotFoundError error");
        } catch (error) {
          expect(error).toBeInstanceOf(UserIDNotFoundError);
          expect(error.user_id).toBe(input_to_user_id);
        }
      });
    });

    describe("Success", () => {
        
        it("should create a user with the given data", async () => {
          const input_from_user_id = uuidv4();
          const input_to_user_id = uuidv4();
          const input_amount = BigInt(1);
  
          mock_prisma_context.prisma.balance.update.mockResolvedValueOnce({
            user_id: input_from_user_id,
            value: BigInt(0),
            updated_at: new Date(),
            created_at: new Date()
          }).mockResolvedValue({
            user_id: input_to_user_id,
            value: BigInt(1),
            updated_at: new Date(),
            created_at: new Date()
          });
          const expected_transaction_id = uuidv4();
          mock_prisma_context.prisma.transaction.create.mockResolvedValue({
            id: expected_transaction_id,
            amount: input_amount,
            from_user_id: input_from_user_id,
            to_user_id: input_to_user_id,
            created_at: new Date()
          });
  
          await service_under_test.createTransaction(input_amount, input_from_user_id, input_to_user_id);
          // The real logic of the function exists within the database transaction, so we have to provide
          // access to the function passed to the transaction. The below does that.
          const tx_fun = mock_prisma_context.prisma.$transaction.mock.calls[0][0] as (tx) => Promise<MiniTocoTransactionResult>;
          const actual = await tx_fun(mock_prisma_context.prisma);
          expect(actual).toEqual(
            MiniTocoTransactionResultBuilder.create()
              .finalBalance(BigInt(0))
              .transaction(
                MiniTocoTransactionBuilder.create()
                  .amount(input_amount)
                  .fromUserId(input_from_user_id)
                  .toUserId(input_to_user_id)
                  .id(expected_transaction_id)
                  .build()
              ).build()
          );
        });
    });
  });
});