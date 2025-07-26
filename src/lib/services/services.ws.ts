import { RoomManager } from "lib/room";
import { validateRequest } from "lib/utils/utils.validation";
import { RoomCommand, WsCommand } from "types/dto";

const validator = validateRequest<WsCommand>(WsCommand);

function sendDelta(data: WsCommand) {
  const { content, userId, roomId } = data;
  if (!content) return false;
  if (content.length === 0) {
    return false;
  }
  const flag = RoomManager.sendContent({
    senderId: userId,
    roomId,
    content: content
  } as RoomCommand)
  return flag;
}

function exitRoom(data: WsCommand) {
  const { userId, roomId } = data;
  const flag = RoomManager.removeUser({
    roomId,
    userId,
  } as RoomCommand)
  return flag;
}

function terminateUser(data: WsCommand) {
  const { content, userId, roomId } = data;
  if (!content) return false;
  const jsonContent = JSON.parse(content);
  const flag = RoomManager.terminateUser({
    roomId,
    userId,
    excludeUserId: jsonContent.userId
  } as RoomCommand)
  return flag;
}

export function addUser(data: WsCommand) {
  const { roomId, userId, ws, userName } = data;
  if (!ws) return false;
  const flag = RoomManager.addUser({
    roomId,
    userId,
    userName,
    socket: ws
  } as any);
  return flag;
}

export function websocketService(data: WsCommand) {
  const { type } = validator.verify(data);
  let result: boolean = false;
  try {
    if (type === "DELTA") {
      result = sendDelta(data);
    }
    if (type === "TERMINATE") {
      result = exitRoom(data);
    }
    if (type === "USER_REMOVE") {
      result = terminateUser(data);
    }
    if (type === "USER_ADD") {
      result = addUser(data);
    }
  } catch (error) {
    return false;
  }
  return result;
}
