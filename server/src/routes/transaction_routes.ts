import express, { Request, Response, Router } from "express";
import { createUserService } from "../services/UserService";
import { fsRyanAuthenticate } from "./validations";
import { body as checkBody, query as checkQuery, param as checkParam } from "express-validator";
import { default_prisma_context } from "../prisma/PrismaDb";
import { ITransactionController, TransactionControllerBuilder } from "../controllers/TransactionController";
import { createTransactionService } from "../services/TransactionService";
import { RequestAuthUser } from "../io_models/RequestAuthUser";

export const transaction_router: Router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     MiniTocoTransactionToCreate:
 *       type: object
 *       required:
 *         - to_user_email
 *         - amount
 *       properties:
 *         to_user_email:
 *           type: string
 *           format: email
 *           description: the email address of the user to send toco to
 *         amount:
 *           type: string
 *           description: The amount of the transaction, serialized as a string to avoid precision loss.
 *     MiniTocoTransaction:
 *       type: object
 *       required:
 *         - id
 *         - to_user_email
 *         - from_user_id
 *         - amount
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The ID of the transaction
 *         to_user_email:
 *           type: string
 *           format: email
 *           description: the email address of the user to whom the funds were sent
 *         amount:
 *           type: string
 *           description: The amount of the transaction, serialized as a string to avoid precision loss.
 *     MiniTocoTransactionResult:
 *       type: object
 *       required:
 *         - transaction
 *         - final_balance
 *       properties:
 *         transaction:
 *           $ref: '#/components/schemas/MiniTocoTransaction'
 *         final_balance:
 *           type: string
 *           description: The balance of tocos the sender has after the transaction is applied
 */

/**
 * 
 * @swagger
 * tags:
 *   name: Transactions
 *   descriptions: Transaction routes
 */

/**
 * @swagger
 * /transactions:
 *   post:
 *     tags: [Transactions]
 *     summary: Creates a transaction from the currently logged-in user to the user described by the to_user_email field in the body.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MiniTocoTransactionToCreate'
 *     responses:
 *       200:
 *         description: 
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MiniTocoTransactionResult'
 *                 
 *       400:
 *         description: invalid input or an attempt to send tocos to oneself
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MiniTocoErrors'
 *       401:
 *         description: Login required
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
 *       409:
 *         description: Insufficient tocos to send
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
transaction_router.post(
  "/",
  fsRyanAuthenticate, // <-- ensures user logged-in.
  checkBody("to_user_email")
    .isEmail()
    .withMessage("to_user_email must be a valid email address")
    .custom((value: string, { req }) => {
      // fsRyanAuthenticate above ensures that the RequestAuthUser will be present.
      const requester_email = (req.user as RequestAuthUser).email;
      return requester_email !== value;
    }).withMessage("cannot send to self"),
  checkBody("amount")
    .custom((value: string) => {
      try {
        const amount = BigInt(value);
        return amount > 0;
      } catch (error) {
        return false;
      }
    }).withMessage("amount must be a valid, positive integer serialized as a string"),
  (req: Request, res: Response) => {
    const controller: ITransactionController = standardTransactionController(req, res);
    controller.createTransaction(() => {
      console.log(`[POST:/transactions]: COMPLETE`);
    });
  }
);

/**
 * @swagger
 * /transactions:
 *   get:
 *     tags: [Transactions]
 *     summary: Get the transactions sent/received by the logged-in user.
 *     responses:
 *       200:
 *         description: 
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               description: The full list of transactions sent/received by the currently logged-in user.
 *               items:
 *                 $ref: '#/components/schemas/MiniTocoTransaction'
 *       401:
 *         description: Login required
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
transaction_router.get(
  "/",
  fsRyanAuthenticate, // <-- ensures user logged-in.
  (req: Request, res: Response) => {
    const controller: ITransactionController = standardTransactionController(req, res);
    controller.fetchTransactions(() => {
      console.log(`[GET:/transactions]: COMPLETE`);
    });
  }
);

const standardTransactionController = (req: Request, res: Response): ITransactionController => {
  return TransactionControllerBuilder.create()
    .req(req)
    .res(res)
    .userService(createUserService(default_prisma_context))
    .transactionService(createTransactionService(default_prisma_context))
    .build();
}