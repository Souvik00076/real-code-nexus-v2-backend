import { TObject } from "@sinclair/typebox";
import { TIntersect } from "@sinclair/typebox/type";

export interface ValidatorRequestReturn<T> {
  schema: TObject | TIntersect;
  verify: (data: T) => T;
}

export type WsResponse = {
  success: boolean;
  message: string;
  content?: any;
}
