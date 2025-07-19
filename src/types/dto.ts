import { Type, type Static } from "@sinclair/typebox";

export type AppDto = Static<typeof AppDto>;
export const AppDto = Type.Object({
  user_name: Type.String(),
  type: Type.String(),
  //email: Type.String({ format: "email" })
});


