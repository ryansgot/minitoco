import { IPasswordService } from "./IPasswordService";
import bcrypt from 'bcrypt';

export const createPasswordService = (salt_rounds: number = 13): IPasswordService => {
  return new BcryptPasswordService(salt_rounds < 1 ? 13 : salt_rounds);
}

class BcryptPasswordService implements IPasswordService {

  private readonly salt_rounds: number;

  constructor(salt_rounds: number) { 
    this.salt_rounds = salt_rounds;
  } 

  async createPasswordHash(password: string): Promise<string> {
    if (password.length == 0) {
      throw Error("password cannot be empty");
    }
    return bcrypt.hash(password, this.salt_rounds);
  }

  async isPasswordMatch(password: string, hash: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      bcrypt.compare(password, hash, (err: Error | undefined, same: boolean) => {
        if (err) {
          reject(err);
        } else {
          resolve(same);
        }
      });
    })
  }
}