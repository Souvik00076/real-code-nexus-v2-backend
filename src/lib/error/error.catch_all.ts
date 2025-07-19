
import { BaseError } from "./error.base";
import type { NextFunction, Request, Response } from "express";
import { CustomError } from "./error.custom_error";
export class CatchAllError extends BaseError {
  protected async handle(
    req: Request,
    res: Response,
    next: NextFunction,
    error: any
  ): Promise<void> {
    if (error instanceof CustomError) {
      const err = error as CustomError;
      res.status(err.statusCode).send(err.message);
      return;
    }
    res.status(500).send("Internal Server Error");
  }
}
