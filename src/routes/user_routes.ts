import express, { Request, Response, Router } from "express";
import { UserControllerBuilder, IUserController } from "../controllers/UserController";
import { createUserService } from "../services/UserService";
import { createPasswordService } from "../services/PasswordService";
import { createTokenService } from "../services/JWTTokenService";
import { fsRyanAuthenticate } from "./validations";
import { body as checkBody, query as checkQuery, param as checkParam, ValidationChain } from "express-validator";
import { default_prisma_context } from "../prisma/PrismaDb";
import { IUserService } from "../services/IUserService";

export const user_router: Router = express.Router();
// Enables parsing of application/x-www-form-urlencoded requests
user_router.use(express.urlencoded({type: "application/x-www-form-urlencoded"}));

const checkValidPasswordInBody = (key: string): ValidationChain => {
  return checkBody(key)
    .isLength({ min: 8, max: 48 })
    .withMessage("must be between 8 and 48 characters")
    .matches(/\d/)
    .withMessage("must include at least 1 digit")
    .matches(/[A-Z]/)
    .withMessage("must include at least 1 upper-case character")
    .matches(/[a-z]/)
    .withMessage("must include at least 1 lower-case character")
    .matches(/[.,'!&\[\]+$\-#*\\%@~`=\/^:()]/)
    .withMessage("must include at least 1 special character: .,'!&[]+$-#*\\%@~`=/^:()")
}

/**
 * @swagger
 * components:
 *   schemas:
 *     TokenData:
 *       type: object
 *       required:
 *         - access_token
 *         - refresh_token
 *         - expires_in
 *         - token_type
 *       properties:
 *         access_token:
 *           type: string
 *           description: A JWT access token to be used as the "bearer" token enabling authorization to accesss the resources of the user. Access tokens expire every 15 minutes.
 *         refresh_token:
 *           type: string
 *           description: A JWT enabling the refresh_token authentication flow, enabling the user to reaquire an access token. Refresh tokens expire every 60 days.
 *         expires_in:
 *           type: integer
 *           description: The number of seconds the access token is valid.
 *         token_type:
 *           type: string
 *           description: The type of token to be returned. Will be 'bearer'.
 *     MiniTocoError:
 *       type: object
 *       required:
 *         - value
 *         - msg
 *       properties:
 *         value:
 *           description: the value that contained the error
 *           type: string
 *         msg:
 *           description: The error message
 *           type: string
 *         param:
 *           description: The paramteter name of the value that contained the error
 *           type: string
 *         location:
 *           description: The location of the param that contained the error
 *           type: string
 *       example:
 *         value: pwd
 *         msg: must be between 8 and 48 characters
 *         param: password
 *         location: body
 *     MiniTocoErrors:
 *       type: object
 *       required:
 *        - errors
 *       properties:
 *         errors:
 *           type: array
 *           description: All errors encountered when serving the request
 *           items:
 *             $ref: '#/components/schemas/MiniTocoError'
 *       example:
 *         id: 952afd7a-352c-4ef5-b2a8-b86db471bc67
 *         email: 'email@example.com'
 *         first_name: 'Test'
 *         last_name: 'User'
 *         created_at: '2020-01-01T00:00:00.000Z'
 *         updated_at: '2020-01-01T00:00:00.000Z'
 *     MiniTocoUser:
 *       type: object
 *       required:
 *        - id
 *        - email
 *        - first_name
 *        - last_name
 *        - created_at
 *        - updated_at
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The ID of the user
 *         email:
 *           type: string
 *           format: email
 *           description: The email of the user
 *         first_name:
 *           type: string
 *           description: The first name of the user
 *         last_name:
 *           type: string
 *           description: The last name of the user
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: The date and time the user was created
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: The date and time the user was last updated
 *       example:
 *         id: 952afd7a-352c-4ef5-b2a8-b86db471bc67
 *         email: 'email@example.com'
 *         first_name: 'Test'
 *         last_name: 'User'
 *         created_at: '2020-01-01T00:00:00.000Z'
 *         updated_at: '2020-01-01T00:00:00.000Z'
 *     MiniTocoUserToCreate:
 *       type: object
 *       required:
 *        - email
 *        - first_name
 *        - last_name
 *        - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: The email of the user
 *         first_name:
 *           type: string
 *           description: The first name of the user
 *         last_name:
 *           type: string
 *           description: The last name of the user
 *         password:
 *           type: string
 *           description: The password of the user (for which there are several requirements)
 *       example:
 *         email: 'email@example.com'
 *         first_name: 'Test'
 *         last_name: 'User'
 *         password: 'P@ssword1'
 */

/**
 * 
 * @swagger
 * tags:
 *   name: Users
 *   descriptions: User management routes
 */

/**
 * @swagger
 * /users:
 *   post:
 *     tags: [Users]
 *     security: []
 *     summary: Creates a new user and immediately logs the user in.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MiniTocoUserToCreate'
 *     responses:
 *       200:
 *         description: The samples that have been set up
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               description: The access token and refresh token so that the user can enjoy the logged-in experience.
 *               items:
 *                 $ref: '#/components/schemas/TokenData'
 *       400:
 *         description: invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MiniTocoErrors'
 *       409:
 *         description: An attempt to create a user that already exists (by email) was made
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - errors
 *               properties:
 *                 errors:
 *                   description: the array of errors that were encountered
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MiniTocoErrors'
 */
user_router.post(
  "/",
  checkBody("email")
    .isEmail(),
  checkBody("first_name")
    .isLength({ min: 1, max: 255 }),
  checkBody("last_name")
    .isLength({ min: 1, max: 255 }),
  checkValidPasswordInBody("password"),
  (req: Request, res: Response) => {
    const controller: IUserController = standardUserController(req, res);
    controller.createUser(() => {
      console.log(`[POST:/users]: COMPLETE`);
    });
  }
);


/**
 * @swagger
 * /users/login:
 *   post:
 *     tags: [Users]
 *     security: []
 *     summary: Logs the user in (returning a TokenData)
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 format: email
 *                 description: The email address of the user logging in
 *               password:
 *                 type: string
 *                 description: The password of the unser logging in
 *                 format: password
 *               grant_type:
 *                 type: string
 *                 enum: [password]
 *             example:
 *               username: 'email@example.com'
 *               password: P@ssword1
 *               grant_type: password
 *     responses:
 *       200:
 *         description: The samples that have been set up
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               description: The access token and refresh token so that the user can enjoy the logged-in experience.
 *               items:
 *                 $ref: '#/components/schemas/TokenData'
 *       400:
 *         description: invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MiniTocoErrors'
 *       401:
 *         description: Email or password was incorrect
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - errors
 *               properties:
 *                 errors:
 *                   description: the array of errors that were encountered
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MiniTocoErrors'
 */
user_router.post(
  "/login",
  checkBody("username")
    .isEmail(),
  checkBody("password")
    .notEmpty(),
  checkBody("grant_type")
    .equals("password"),
  (req: Request, res: Response) => {
    const controller: IUserController = standardUserController(req, res);
    controller.logInUser(() => {
      console.log(`[POST:/users/login]: COMPLETE`);
    });
  }
)

/**
 * @swagger
 * /users/tokenrefresh:
 *   post:
 *     tags: [Users]
 *     security: []
 *     summary: Refreshes the user's access token, returning a new TokenData
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               refresh_token:
 *                 type: string
 *                 description: The refresh token that can be used to acquire an access token.
 *               grant_type:
 *                 type: string
 *                 enum: [refresh_token]
 *             example:
 *               username: 'email@example.com'
 *               password: P@ssword1
 *               grant_type: password
 *     responses:
 *       200:
 *         description: The samples that have been set up
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               description: The access token and refresh token so that the user can enjoy the logged-in experience.
 *               items:
 *                 $ref: '#/components/schemas/TokenData'
 *       400:
 *         description: invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MiniTocoErrors'
 *       401:
 *         description: Email or password was incorrect
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - errors
 *               properties:
 *                 errors:
 *                   description: the array of errors that were encountered
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MiniTocoErrors'
 */
user_router.post(
  "/tokenrefresh",
  checkBody("refresh_token")
    .isEmail(),
  checkBody("grant_type")
    .equals("password"),
  (req: Request, res: Response) => {
    const controller: IUserController = standardUserController(req, res);
    controller.refreshToken(() => {
      console.log(`[POST:/users/tokenrefresh]: COMPLETE`);
    });
  }
)

const standardUserController = (req: Request, res: Response): IUserController => {
  return UserControllerBuilder.create()
    .req(req)
    .res(res)
    .userService(createUserService(default_prisma_context))
    .passwordService(createPasswordService())
    .tokenService(createTokenService())
    .build();
}