import { v4 as uuidv4 } from "uuid";
import { MockPrismaContext, createMockPrismaContext, createUniqueConstraintError } from "../utils/prisma_util";
import { IUserService, UserAlreadyExistsError, UserEmailNotFoundError, UserIDNotFoundError } from "../../src/services/IUserService";
import { createUserService } from "../../src/services/UserService";
import { MiniTocoUser, MiniTocoUserBuilder, MiniTocoUserToCreateBuilder } from "../../src/io_models/MiniTocoUser";

describe("User Service", () => {

  let mock_prisma_context: MockPrismaContext;
  let service_under_test: IUserService;
  
  const test_email = "email@example.com";
  const testUserToCreateBuilder = () => MiniTocoUserToCreateBuilder.create()
    .email(test_email)
    .firstName("First")
    .lastName("Last")
    .password("password");

  beforeEach(() => {
    mock_prisma_context = createMockPrismaContext();
    service_under_test = createUserService(mock_prisma_context);
  });

  describe("createUser", () => {

    describe("Failure", () => {

      it("should throw UserAlreadyExistsError when the email uniqueness constraint fails", async () => {
        const input_user = testUserToCreateBuilder().build();
        mock_prisma_context.prisma.user.create.mockRejectedValue(createUniqueConstraintError("email", test_email));

        try {
          await service_under_test.createUser(input_user, "password hash", BigInt(1));
          fail("Expected UserAlreadyExists error");
        } catch (error) {
          expect(error).toBeInstanceOf(UserAlreadyExistsError);
          expect(error.email).toBe(test_email);
        }
      });
    });

    describe("Success", () => {
        
        it("should create a user with the given data", async () => {
          const input_user = testUserToCreateBuilder().build();
          const input_password_hash = "password hash";
          const expected_user = MiniTocoUserBuilder.create()
            .id(uuidv4())
            .createdAt(new Date())
            .updatedAt(new Date())
            .email(input_user.email)
            .firstName(input_user.first_name)
            .lastName(input_user.last_name)
            .pwHash(input_password_hash)
            .build();
          mock_prisma_context.prisma.user.create.mockResolvedValue(expected_user);
  
          // This works because the User object conforms to to the database user interface
          const actual_user = await service_under_test.createUser(input_user, input_password_hash, BigInt(1));
  
          expect(actual_user).toEqual(expected_user);
        });
    });
  });

  describe("findUserByEmail", () => {
    describe("Failure", () => {
      it("should throw UserEmailNotFoundError when the user is not found", async () => {
        mock_prisma_context.prisma.user.findUnique.mockResolvedValue(null);

        try {
          await service_under_test.findUserByEmail(test_email);
          fail("Expected UserEmailNotFoundError");
        } catch (error) {
          expect(error).toBeInstanceOf(UserEmailNotFoundError);
          expect(error.email).toBe(test_email);
        }
      });
    });

    describe("Success", () => {
      it("should return the user when the user is found", async () => {
        const expected_user = MiniTocoUserBuilder.create()
          .id(uuidv4())
          .createdAt(new Date())
          .updatedAt(new Date())
          .email(test_email)
          .firstName("First")
          .lastName("Last")
          .pwHash("password hash")
          .build();
        // This works because the User object conforms to to the database user interface
        mock_prisma_context.prisma.user.findUnique.mockResolvedValue(expected_user);

        const actual_user = await service_under_test.findUserByEmail(test_email);

        expect(actual_user).toEqual(expected_user);
      });
    });
  });

  describe("findUserById", () => {
    describe("Failure", () => {
      it("should throw UserIDNotFoundError when the user is not found", async () => {
        const input_user_id = uuidv4();
        mock_prisma_context.prisma.user.findUnique.mockResolvedValue(null);

        try {
          await service_under_test.findUserById(input_user_id);
          fail("Expected UserEmailNotFoundError");
        } catch (error) {
          expect(error).toBeInstanceOf(UserIDNotFoundError);
          expect(error.user_id).toBe(input_user_id);
        }
      });
    });

    describe("Success", () => {
      it("should return the user when the user is found", async () => {
        const input_user_id = uuidv4();
        const expected_user = MiniTocoUserBuilder.create()
          .id(input_user_id)
          .createdAt(new Date())
          .updatedAt(new Date())
          .email(test_email)
          .firstName("First")
          .lastName("Last")
          .pwHash("password hash")
          .build();
        // This works because the User object conforms to to the database user interface
        mock_prisma_context.prisma.user.findUnique.mockResolvedValue(expected_user);

        const actual_user = await service_under_test.findUserById(input_user_id);

        expect(actual_user).toEqual(expected_user);
      });
    });
  });
});