import { CustomError } from "./error.custom_error";

export class NotFound extends CustomError {
  public statusCode = 404;
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, NotFound.prototype);
  }
}
