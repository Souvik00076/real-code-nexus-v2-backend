import { NextFunction, Request, Response } from "express";
import { IPost } from "./controller.base";
import { postAppServices } from "lib/services/services.app";
import { sendSuccessResponse } from "lib/utils/utils.response_handler";

export class AppController implements IPost {
  constructor() {
    this.post = this.post.bind(this);
  }
  async post(req: Request, res: Response, next: NextFunction) {
    try {
      let result: any;
      const queries = {
        ...req.query,
        ...req.params
      }
      result = await postAppServices(queries as any);
      const responseData: any = {
        res,
        message: "OK"
      }
      if (result) {
        responseData.data = result;
      }
      sendSuccessResponse(responseData);
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
}
