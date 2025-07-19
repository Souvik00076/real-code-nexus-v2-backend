import { Room } from "lib/schema/schema.room";
import { createUser } from "lib/utils/utils.db";
import { validateRequest } from "lib/utils/utils.validation";
import { AppDto } from "types/dto";

enum APP_TYPES {
  ROOM_CREATE = "ROOM_CREATE"
}
const validator = validateRequest<AppDto>(AppDto);

async function createRoom(data: AppDto) {
  const { user_name } = data;
  const userInfo = await createUser(user_name);
  const roomInfo = await Room.insertOne({
    owners: [userInfo._id]
  });
  return { room_info: roomInfo };
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
