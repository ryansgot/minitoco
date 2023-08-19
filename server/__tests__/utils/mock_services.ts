import { MiniTocoUser, MiniTocoUserDetail } from '../../src/io_models/MiniTocoUser';
import { IUserService } from '../../src/services/IUserService';
import { ITokenService } from '../../src/services/ITokenService';
import { IPasswordService } from '../../src/services/IPasswordService';
import { TokenData } from '../../src/io_models/TokenData';
import { MiniTocoTransaction, MiniTocoTransactionResult } from '../../src/io_models/MiniTocoTransaction';
import { ITransactionService } from '../../src/services/ITransactionService';

export class MockUserServiceBuilder {

  private create_user_response: MiniTocoUser| Error;
  private find_user_by_email_response: MiniTocoUserDetail| Error;
  private find_user_by_id_response: MiniTocoUserDetail| Error;

  static create(): MockUserServiceBuilder {
    return new MockUserServiceBuilder();
  }

  private constructor() {}
  
  createUser(create_user_response: MiniTocoUser | Error): MockUserServiceBuilder {
    this.create_user_response = create_user_response;
    return this;
  }
  findUserByEmail(find_user_by_email_response: MiniTocoUserDetail | Error): MockUserServiceBuilder {
    this.find_user_by_email_response = find_user_by_email_response;
    return this;
  }
  findUserById(find_user_by_id_response: MiniTocoUserDetail | Error): MockUserServiceBuilder {
    this.find_user_by_id_response = find_user_by_id_response;
    return this;
  }
  
  build(): IUserService {
    const create_user_mock = jest.fn();
    const find_user_by_email_mock = jest.fn();
    const find_user_by_id_mock = jest.fn();
    return <IUserService> {
      create_user_mock: create_user_mock,
      find_user_by_email_mock: find_user_by_email_mock,
      find_user_by_id_mock: find_user_by_id_mock,
      createUser: this.create_user_response === undefined
        ? create_user_mock.mockRejectedValue(new Error("createUser not mocked"))
        : this.create_user_response instanceof Error
        ? create_user_mock.mockRejectedValue(this.create_user_response)
        : create_user_mock.mockResolvedValue(this.create_user_response),
      findUserByEmail: this.find_user_by_email_response === undefined
        ? find_user_by_email_mock.mockRejectedValue(new Error("findUserByEmail not mocked"))
        : this.find_user_by_email_response instanceof Error
        ? find_user_by_email_mock.mockRejectedValue(this.find_user_by_email_response)
        : find_user_by_email_mock.mockResolvedValue(this.find_user_by_email_response),
      findUserById: this.find_user_by_id_response === undefined
        ? find_user_by_id_mock.mockRejectedValue(new Error("findUserById not mocked"))
        : this.find_user_by_id_response instanceof Error
        ? find_user_by_id_mock.mockRejectedValue(this.find_user_by_id_response)
        : find_user_by_id_mock.mockResolvedValue(this.find_user_by_id_response)
    };
  }
}

export class MockTokenServiceBuilder {
  
  private create_token_data_response: TokenData | Error;
  private verify_token_response: boolean | Error;
  
    static create(): MockTokenServiceBuilder {
      return new MockTokenServiceBuilder();
    }
  
    private constructor() {}
    
    createTokenData(create_token_data_response: TokenData | Error): MockTokenServiceBuilder {
      this.create_token_data_response = create_token_data_response;
      return this;
    }
    verifyToken(verify_token_response: boolean | Error): MockTokenServiceBuilder {
      this.verify_token_response = verify_token_response;
      return this;
    }
    
    build(): ITokenService {
      const create_token_data_mock = jest.fn();
      const verify_token_response_mock = jest.fn();
      return <ITokenService> {
        create_token_data_mock: create_token_data_mock,
        verify_token_response_mock: verify_token_response_mock,
        createTokenData: this.create_token_data_response === undefined
          ? create_token_data_mock.mockRejectedValue(new Error("generateToken not mocked"))
          : this.create_token_data_response instanceof Error
          ? create_token_data_mock.mockRejectedValue(this.create_token_data_response)
          : create_token_data_mock.mockResolvedValue(this.create_token_data_response),
        verifyToken: this.verify_token_response === undefined
          ? verify_token_response_mock.mockRejectedValue(new Error("verifyToken not mocked"))
          : this.verify_token_response instanceof Error
          ? verify_token_response_mock.mockRejectedValue(this.verify_token_response)
          : verify_token_response_mock.mockResolvedValue(this.verify_token_response)
      };
    }
}

export class MockPasswordServiceBuilder {
    
      private is_password_match_response: boolean | Error;
      private create_password_hash_response: string | Error;
    
      static create(): MockPasswordServiceBuilder {
        return new MockPasswordServiceBuilder();
      }
    
      private constructor() {}
      
      isPasswordMatch(is_password_match_response: boolean | Error): MockPasswordServiceBuilder {
        this.is_password_match_response = is_password_match_response;
        return this;
      }
      createPasswordHash(hash_password_response: string | Error): MockPasswordServiceBuilder {
        this.create_password_hash_response = hash_password_response;
        return this;
      }
      
      build(): IPasswordService {
        const is_password_match_mock = jest.fn();
        const create_password_hash_mock = jest.fn();
        return <IPasswordService> {
          is_password_match_mock: is_password_match_mock,
          create_password_hash_mock: create_password_hash_mock,
          isPasswordMatch: this.is_password_match_response === undefined
            ? is_password_match_mock.mockRejectedValue(new Error("isPasswordMatch not mocked"))
            : this.is_password_match_response instanceof Error
            ? is_password_match_mock.mockRejectedValue(this.is_password_match_response)
            : is_password_match_mock.mockResolvedValue(this.is_password_match_response),
          createPasswordHash: this.create_password_hash_response === undefined
            ? create_password_hash_mock.mockRejectedValue(new Error("createPasswordHash not mocked"))
            : this.create_password_hash_response instanceof Error
            ? create_password_hash_mock.mockRejectedValue(this.create_password_hash_response)
            : create_password_hash_mock.mockResolvedValue(this.create_password_hash_response)
        };
      }
}

export class MockTransactionServiceBuilder {
      
  private create_transaction_response: MiniTocoTransactionResult | Error;
  private retrieve_transactions_response: Array<MiniTocoTransaction> | Error;

  static create(): MockTransactionServiceBuilder {
    return new MockTransactionServiceBuilder();
  }

  private constructor() {}
  
  createTransaction(create_transaction_response: MiniTocoTransactionResult | Error): MockTransactionServiceBuilder {
    this.create_transaction_response = create_transaction_response;
    return this;
  }
  retrieveTransactions(retrieve_transactions_response: Array<MiniTocoTransaction> | Error): MockTransactionServiceBuilder {
    this.retrieve_transactions_response = retrieve_transactions_response;
    return this;
  }
  
  build(): ITransactionService {
    const create_transaction_mock = jest.fn();
    const retrieve_transactions_mock = jest.fn();
    return <ITransactionService> {
      create_transaction_mock: create_transaction_mock,
      retrieve_transactions_mock: retrieve_transactions_mock,
      createTransaction: this.create_transaction_response === undefined
        ? create_transaction_mock.mockRejectedValue(new Error("createTransaction not mocked"))
        : this.create_transaction_response instanceof Error
        ? create_transaction_mock.mockRejectedValue(this.create_transaction_response)
        : create_transaction_mock.mockResolvedValue(this.create_transaction_response),
      retrieveTransactions: this.retrieve_transactions_response === undefined
        ? retrieve_transactions_mock.mockRejectedValue(new Error("retrieveTransactions not mocked"))
        : this.retrieve_transactions_response instanceof Error
        ? retrieve_transactions_mock.mockRejectedValue(this.retrieve_transactions_response)
        : retrieve_transactions_mock.mockResolvedValue(this.retrieve_transactions_response)
    };
  }
}