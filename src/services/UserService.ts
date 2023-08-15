import { MiniTocoUser, MiniTocoUserBuilder, MiniTocoUserToCreate } from '../io_models/MiniTocoUser';
import { PrismaContext } from '../prisma/PrismaDb';
import { isPrismaUniqueConstraintError } from '../prisma/prisma_util';
import { IUserService, UserAlreadyExistsError, UserEmailNotFoundError, UserIDNotFoundError } from './IUserService';


export const createUserService = (prisma_context: PrismaContext): IUserService => new UserService(prisma_context);

class UserService implements IUserService {

  private prisma_context: PrismaContext;

  constructor(prisma_context: PrismaContext) {
    this.prisma_context = prisma_context;
  }

  /**
   * Creates a new user in the database with the password hash provided
   * @param user The {@link MiniTocoUser} to create.
   * @param pw_hash The password hash to store in the database.
   * @returns A promise that resolves to the created {@link MiniTocoUser}.
   */
  async createUser(user: MiniTocoUserToCreate, pw_hash: string, initial_balance: bigint): Promise<MiniTocoUser> {
    logUserService("createUser", "Creating user", user, initial_balance);
    try {
      const created_user = await this.prisma_context.prisma.user.create({
        data: {
          email: user.email,
          pw_hash: pw_hash,
          first_name: user.first_name,
          last_name: user.last_name,
          balance: {
            create: {
              value: initial_balance
            }
          } 
        }
      });

      const builder = MiniTocoUserBuilder.create();
      builder.id(created_user.id);
      builder.email(created_user.email);
      builder.firstName(created_user.first_name);
      builder.lastName(created_user.last_name);
      builder.pwHash(created_user.pw_hash);
      builder.createdAt(created_user.created_at);
      builder.updatedAt(created_user.updated_at);
      const ret = builder.build();
      return ret;
    } catch (error) {
      if (isPrismaUniqueConstraintError(error)) {
        throw new UserAlreadyExistsError(user.email);
      }
      // Unexpected error, log and rethrow
      logUserService("createUser", "Error creating user", error);
      throw error;
    }
  }


  async findUserByEmail(email: string): Promise<MiniTocoUser> {
    logUserService("findUserByEmail", "Finding user by email", email);

    try {
      const user = await this.prisma_context.prisma.user.findUnique({
        where: {
          email: email
        }
      });
      if (user === null) {
        throw new UserEmailNotFoundError(email);
      }
  
      const builder = MiniTocoUserBuilder.create();
      builder.id(user.id);
      builder.email(user.email);
      builder.firstName(user.first_name);
      builder.lastName(user.last_name);
      builder.pwHash(user.pw_hash);
      builder.createdAt(user.created_at);
      builder.updatedAt(user.updated_at);
      const ret = builder.build();
      return ret;
    } catch (error) {
      // Unexpected error, log and rethrow
      logUserService("createUser", "Error finding user by email", error);
      throw error;
    }
  }

  async findUserById(user_id: string): Promise<MiniTocoUser> {
    logUserService("findUserById", "Finding user by id", user_id);

    try {
      const user = await this.prisma_context.prisma.user.findUnique({
        where: {
          id: user_id
        }
      });
      if (user === null) {
        throw new UserIDNotFoundError(user_id);
      }
  
      const builder = MiniTocoUserBuilder.create();
      builder.id(user.id);
      builder.email(user.email);
      builder.firstName(user.first_name);
      builder.lastName(user.last_name);
      builder.pwHash(user.pw_hash);
      builder.createdAt(user.created_at);
      builder.updatedAt(user.updated_at);
      const ret = builder.build();
      return ret;
    } catch (error) {
      // Unexpected error, log and rethrow
      logUserService("createUser", "Error finding user by ID", error);
      throw error;
    }
  }
}

const logUserService = (context: string, msg: string, ...additional_values: any) => {
  console.log(`[UserService:${context}]: ${msg}`, additional_values);
}