import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { TokenData, TokenDataBuilder } from "../io_models/TokenData";
import { readFile } from '../utils/file_util';
import { ITokenService } from './ITokenService';
import { daysToSeconds } from '../utils/time_util';

const private_key: string = readFile(__dirname + '/../../keys/private-key.pem');
if (private_key == "") {
    throw new Error('private key not provided');
}
const public_key: string = readFile(__dirname + '/../../keys/public-key.pem');
if (public_key == "") {
    throw new Error('public key not provided');
}
const issuer: string = 'fsryan/minitoco';

export const createTokenService = (
  access_token_expiration: number = daysToSeconds(3),
  refresh_token_expiration: number = daysToSeconds(60)
): ITokenService => new JWTTokenService(access_token_expiration, refresh_token_expiration);

class JWTTokenService implements ITokenService {

  private readonly access_token_expiration!: number;
  private readonly refresh_token_expiration!: number;

  private static throwMisconfigured(name: string, requirement: string, value: any) {
    throw Error(`Misconfigured JWTTokenService ${name} ${requirement} required; was ${value}`);
  }

  constructor(access_token_expiration: number, refresh_token_expiration: number) {
    if (access_token_expiration <= 0) {
      JWTTokenService.throwMisconfigured("access_token_expiration", "> 0", access_token_expiration);
    }
    if (refresh_token_expiration <= 0) {
      JWTTokenService.throwMisconfigured("refresh_token_expiration", "> 0", refresh_token_expiration);
    }
    this.access_token_expiration = access_token_expiration;
    this.refresh_token_expiration = refresh_token_expiration;
  }
  verifyToken(token: string): Promise<{ user_id: string; email: string; }> {
    return new Promise<{ user_id: string; email: string; }>((resolve, reject) => {
      try {
        const decoded: any = jwt.verify(token, public_key);
        const email = decoded['email'] as string;
        const user_id = decoded['sub'] as string;
        resolve({ 
          user_id: user_id,
          email: email
        });
      } catch (error) {
        reject(error)
      }
    });
  }

  createTokenData(user_id: string, user_email: string): TokenData {
    const additional_claims = new Map<string, any>([ ["email", user_email] ]);
    return TokenDataBuilder.create()
      .accessToken(this.createToken(user_id, this.access_token_expiration, additional_claims))
      .refreshToken(this.createToken(user_id, this.refresh_token_expiration, additional_claims))
      .expiresIn(this.access_token_expiration)
      .build();
  }

  /**
   * It is often useful for us to have a token that may be revoked.
   * access tokens expire relatively quickly, whenever the access token is
   * issued, a refresh token (which is revokable) is also issued. Additionally,
   * We may want to issue a token for a user's email verification.
   * @param subject the ID of the user for whom this revokable token is generated
   * @param additional_claims a map of additional claims this token contains
   * @param token_id the ID of the token that is valid for this user
   * @returns A JWT token string which has a token_id (tid) embedded
   */
  private createToken(
    subject: string,
    exp: number,
    additional_claims: Map<string, any> = new Map<string, any>([]),
    token_id: string = uuidv4(),
  ): string {
    let claim_map = new Map<string, any>(additional_claims);
    claim_map.set('tid', token_id);
    return jwt.sign(
      Object.fromEntries(claim_map),
      private_key,
      {
        algorithm: 'RS256',
        expiresIn: exp,
        subject: subject,
        issuer: issuer
      }
    );
  }
}