import { TokenData } from "../io_models/TokenData";

export interface ITokenService {
  /**
   * 
   * @param user_id The user ID to be the sub claim of the access token and
   * refresh token
   * @param user_email the email claim of the access token--for use by
   * endpoints without having to look up the user's email
   * @param refresh_token_id The identifier of the refresh token so that we may
   * revoke it.
   */
  createTokenData(user_id: string, user_email: string): TokenData;

  /**
   * Verifies the token or executes the error path
   * @param token The token to be verified
   */
  verifyToken(token: string): Promise<{ user_id: string, email: string}>;
}