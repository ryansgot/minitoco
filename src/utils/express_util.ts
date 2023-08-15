// TODO: this copied here from Alexiares to make it easier to make progress.
//  We should:
//  1. Get our NPM registry working properly
//  2. Publish an NPM package that allows us to more-easily share code between modules.

import { Response } from "express"
import { MiniTocoError } from "../io_models/MiniTocoError";

export const sendJSONAndSignal = (res: Response, code: number, body: any | null, signalComplete: () => void) => {
  res.status(code).json(body);
  signalComplete();
}

export const sendAndSignal = (res: Response, code: number, body: any | null, signalComplete: () => void) => {
  res.status(code).send(body);
  signalComplete();
}

export const sendAndSignalInternalServerError = (res: Response, signalComplete: () => void) => {
  sendJSONAndSignal(res, 500, { errors: MiniTocoError.internalServer() }, signalComplete)
}

export const redirectAndSignal = (res: Response, code: number, redirect_url: string, signalComplete: () => void) => {
  res.redirect(code, redirect_url);
  signalComplete();
}

export const sendEmptyAndSignal = (res: Response, code: number, signalComplete: () => void) => {
  res.status(code).send();
  signalComplete();
}