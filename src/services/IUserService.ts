import { MiniTocoUser, MiniTocoUserToCreate } from '../io_models/MiniTocoUser';

export interface IUserService {
  /**
   * Creates a new user in the database with the password hash provided
   * @param user The {@link MiniTocoUser} to create.
   * @param pw_hash The password hash to store in the database.
   * @param initial_balance The beginning balance of the user.
   * @returns A promise that resolves to the created {@link MiniTocoUser}.
   */
  createUser(user: MiniTocoUserToCreate, pw_hash: string, initial_balance: bigint): Promise<MiniTocoUser>;

  /**
   * Finds a user by the email passed in
   * @param email The email of the user to find.
   */
  findUserByEmail(email: string): Promise<MiniTocoUser>

  /**
   * Finds a user by the ID passed in
   * @param email The email of the user to find.
   */
  findUserById(user_id: string): Promise<MiniTocoUser>
}

// Add error classes below
export class UserAlreadyExistsError extends Error {
  readonly email: string;
  constructor(email: string) {
    super("User with email '" + email + "' already exists.");
    this.name = 'UserAlreadyExistsError';
    this.email = email;
  }
}

export class UserEmailNotFoundError extends Error {
  readonly email: string;
  constructor(email: string) {
    super("User with email '" + email + "' not found.");
    this.name = 'UserEmailNotFoundError';
    this.email = email;
  }
}

export class UserIDNotFoundError extends Error {
  readonly user_id: string;
  constructor(user_id: string) {
    super("User with ID '" + user_id + "' not found.");
    this.name = 'UserIDNotFoundError';
    this.user_id = user_id;
  }
}