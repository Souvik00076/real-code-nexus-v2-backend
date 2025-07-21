import { Document, model, Schema } from "mongoose";

export type Room = {
  users: Schema.Types.ObjectId[];
  contents: Schema.Types.Mixed;
}

export interface IRoom extends Room, Document { }

const roomSchema = new Schema<IRoom>({
  users: {
    type: [{
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true
    }],
    default: []
  },
  contents: {
    type: Schema.Types.Mixed
  },
}, { timestamps: true })

export const Room = model<IRoom>('room', roomSchema);
