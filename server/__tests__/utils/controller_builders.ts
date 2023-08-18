import { UserControllerBuilder } from '../../src/controllers/UserController'
import { MockRequestBuilder, MockResponseBuilder } from './express_util'
import { MockPasswordServiceBuilder, MockTokenServiceBuilder, MockTransactionServiceBuilder, MockUserServiceBuilder } from './mock_services'
import { TransactionControllerBuilder } from '../../src/controllers/TransactionController'

export const baseUserControllerBuilder = (): UserControllerBuilder => UserControllerBuilder.create()
  .req(MockRequestBuilder.create().build())
  .res(MockResponseBuilder.create().build())
  .userService(MockUserServiceBuilder.create().build())
  .tokenService(MockTokenServiceBuilder.create().build())
  .passwordService(MockPasswordServiceBuilder.create().build())

export const baseTransactionControllerBuilder = (): TransactionControllerBuilder => TransactionControllerBuilder.create()
  .req(MockRequestBuilder.create().build())
  .res(MockResponseBuilder.create().build())
  .transactionService(MockTransactionServiceBuilder.create().build())
  .userService(MockUserServiceBuilder.create().build())