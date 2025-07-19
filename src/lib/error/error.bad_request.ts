import { CustomError } from "./error.custom_error";

export class BadRequest extends CustomError {
  public statusCode = 400;
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, BadRequest.prototype);
  }
}
