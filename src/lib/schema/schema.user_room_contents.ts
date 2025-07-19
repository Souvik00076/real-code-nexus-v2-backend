import { Document, model, Schema } from "mongoose";

export type UserRoomContents = {
  user_id: Schema.Types.ObjectId;
  content: any;
  room_id: Schema.Types.ObjectId;
}

export interface IUserRoomContents extends UserRoomContents, Document { }

const userRoomContentSchema = new Schema<IUserRoomContents>({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  content: {
    type: Schema.Types.Mixed,
    required: true
  },
  room_id: {
    type: Schema.Types.ObjectId,
    ref: 'rooms',
    required: true
  }
})

export const UserRoomContents = model<IUserRoomContents>('user_room_content', userRoomContentSchema);
