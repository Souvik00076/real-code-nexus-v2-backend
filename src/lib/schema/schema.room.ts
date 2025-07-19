import { Document, model, Schema } from "mongoose";

export type Room = {
  users: Schema.Types.ObjectId[];
  contents: Schema.Types.Mixed;
  owners: Schema.Types.ObjectId[];
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
  owners: [
    {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true
    }
  ]
}, { timestamps: true })

export const Room = model<IRoom>('room', roomSchema);
