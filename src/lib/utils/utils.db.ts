import { BadRequest } from "lib/error/error.bad_request";
import { Room } from "../schema/schema.room";
import { IUser, User } from "../schema/schema.user";
import { Forbidden } from "lib/error/error.forbidden";

export async function checkIfRoomExist(roomId: string): Promise<boolean> {
  try {
    const roomInfo = await Room.findById(roomId);
    if (!roomInfo) {
      throw new Error("Room does not exist")
    }
    return true;
  } catch (error) {
    return false;
  }
}

export async function checkIfUserExist(userName: string) {
  try {
    const userInfo = await User.findOne({ userName });
    if (!userInfo) {
      throw new Error("user does not exist");
    }
    return true;
  } catch (error) {
    return false;
  }
}

export async function addUserToRoom(userName: string, roomId: string): Promise<boolean> {
  try {
    if (!userName || !roomId) throw new Error("Invalid specification")
    const userInfo = await User.findOne({ userName });
    if (!userInfo) {
      throw new Error("user does not exist")
    }
    return true;
  } catch (error) {
    return false;
  }
}

export async function createUser(userName: string): Promise<IUser> {

  const userInfo = await User.findOne({ user_name: userName });
  if (!userInfo) {
    return await User.insertOne({
      user_name: userName
    })
  }
  return userInfo
}
