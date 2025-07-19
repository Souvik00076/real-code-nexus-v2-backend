import { Room } from "../schema/schema.room";
import { User } from "../schema/schema.user";

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
