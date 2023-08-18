import fs from 'fs';
import dotenv from 'dotenv'
import passport from 'passport';
import { ExtractJwt, Strategy as JwtStrategy, VerifiedCallback } from 'passport-jwt';
import { RequestAuthUserBuilder } from '../io_models/RequestAuthUser';
import { NextFunction, Request, Response } from 'express';
import { MiniTocoError } from '../io_models/MiniTocoError';

dotenv.config();

const public_key: string = fs.readFileSync(__dirname + "/../../keys/public-key.pem", 'utf8');
passport.use(new JwtStrategy(
  {
    secretOrKey: public_key,
    issuer: 'fsryan/minitoco',
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
  },
  (jwt_payload: any, done: VerifiedCallback) => {
    const user_builder: RequestAuthUserBuilder = RequestAuthUserBuilder.create();
    const user_id: string | undefined = jwt_payload.sub;
    if (user_id === undefined) {
      done("acces token requires a sub claim", undefined, undefined)
      return;
    }
    user_builder.id(jwt_payload.sub)

    const user_email: string | undefined = jwt_payload.email
    if (user_email === undefined) {
      done("acces token requires a email claim", undefined, undefined)
      return;
    }
    user_builder.email(user_email);

    done(null, user_builder.build(), undefined)
  }
));

export const fsRyanAuthenticate = (req: Request, res: Response, next: NextFunction) => passport.authenticate(
  'jwt',
  { 
    session: false,
    failWithError: true
  },
  (
    err: any,
    user?: Express.User | false | null,
    info?: object | string | Array<string | undefined>,
    status?: number | Array<number | undefined>
  ) => {
    if (user == false || user === null) {
      const error_to_return = MiniTocoError.loginRequired();
      res.status(401)
        .json(MiniTocoError.errorsBody(error_to_return))
    } else {
      req.user = user;
      next()
    }
  }
)(req, res, next);