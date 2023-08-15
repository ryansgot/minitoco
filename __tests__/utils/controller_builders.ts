import { UserControllerBuilder } from '../../src/controllers/UserController'
import { MockRequestBuilder, MockResponseBuilder } from './express_util'
import { MockPasswordServiceBuilder, MockTokenServiceBuilder, MockUserServiceBuilder } from './mock_services'

export const baseUserControllerBuilder = (): UserControllerBuilder => UserControllerBuilder.create()
  .req(MockRequestBuilder.create().build())
  .res(MockResponseBuilder.create().build())
  .userService(MockUserServiceBuilder.create().build())
  .tokenService(MockTokenServiceBuilder.create().build())
  .passwordService(MockPasswordServiceBuilder.create().build())