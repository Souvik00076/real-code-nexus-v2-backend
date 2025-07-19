import { TObject } from "@sinclair/typebox";
import { TIntersect } from "@sinclair/typebox/type";

export interface ValidatorRequestReturn<T> {
  schema: TObject | TIntersect;
  verify: (data: T) => T;
}
