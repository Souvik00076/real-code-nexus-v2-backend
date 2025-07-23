import { Type, type Static } from "@sinclair/typebox";

export type AppDto = Static<typeof AppDto>;
export const AppDto = Type.Object({
  user_name: Type.String(),
  type: Type.String(),
  //email: Type.String({ format: "email" })
});


export type WsCommand = Static<typeof WsCommand>
export const WsCommand = Type.Object({
  type: Type.Union([Type.Literal('DELTA'), Type.Literal('TERMINATE'), Type.Literal('USER_REMOVE'), Type.Literal('USER_ADD')]),
  content: Type.Optional(Type.String()),
  command: Type.Optional(Type.String()),
  userId: Type.String(),
  userName: Type.Optional(Type.String()),
  roomId: Type.String(),
  ws: Type.Optional(Type.Any())
})


