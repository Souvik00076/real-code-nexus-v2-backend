import { CustomError } from "./error.custom_error";

export class Forbidden extends CustomError {
  public statusCode = 403;
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, Forbidden.prototype);
  }
}
