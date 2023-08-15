
export interface IPasswordService {
  createPasswordHash(password: string): Promise<string>
  isPasswordMatch(password: string, hash: string): Promise<boolean>
}