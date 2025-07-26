import { BadRequest } from "lib/error/error.bad_request";
import { Room } from "lib/schema/schema.room";
import { User } from "lib/schema/schema.user";
import { validateRequest } from "lib/utils/utils.validation";
import { AppDto } from "types/dto";

enum APP_TYPES {
  ROOM_CREATE = "ROOM_CREATE",
}
const validator = validateRequest<AppDto>(AppDto);

async function createRoom(data: AppDto) {
  const { user_name } = validator.verify(data);
  if (!user_name || user_name.length === 0) {
    throw new BadRequest("Invalid userName")
  }
  const userInfo = await User.create({
    user_name
  })
  const roomInfo = await Room.insertOne({
    owners: [userInfo._id]
  });
  return { room_info: roomInfo };
}

async function getRoomContents(data: AppDto) {
  const { room_id } = validator.verify(data);
  if (!room_id) {
    throw new BadRequest("Invalid room id ")
  }
  const roomInfo = await Room.findById(room_id).lean();
  if (!roomInfo) {
    throw new BadRequest("Invalid room id")
  }
  return roomInfo.contents;
}
export async function getAppServices(data: AppDto) {
  const { type } = validator.verify(data);
  let result: any;
  if (type === 'contents') {
    result = await getRoomContents(data);
  }
  return result;
}

export async function postAppServices(data: AppDto) {
  const { type } = validator.verify(data);
  const capType = type.toUpperCase();
  let result: any
  if (capType === APP_TYPES.ROOM_CREATE) {
    result = await createRoom(data);
  }
  return result;
}
