import { Document, model, Schema } from "mongoose";

export type User = {
  user_name: string;
}

export interface IUser extends User, Document { }

const userSchema = new Schema<IUser>({
  user_name: {
    type: String,
    required: true,
    minlength: 4,
    maxlength: 15
  }
},
  {
    timestamps: true
  }
)

export const User = model<IUser>('user', userSchema);
