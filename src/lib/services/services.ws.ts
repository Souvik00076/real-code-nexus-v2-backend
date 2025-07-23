import { RoomManager } from "lib/room";
import { validateRequest } from "lib/utils/utils.validation";
import { WsCommand } from "types/dto";

const validator = validateRequest<WsCommand>(WsCommand);

function sendDelta(data: WsCommand) {
  const { content, userId, roomId } = data;
  if (!content) return false;
  const userInfo = RoomManager.getUserInfo(roomId, userId);
  if (!userInfo) return false;
  const delta = {
    type: "DELTA",
    content: JSON.stringify({
      content,
      senderId: userId,
      senderName: userInfo.userName
    })
  };
  RoomManager.broadcast(roomId, JSON.stringify(delta), userId);
  return true;
}

function exitRoom(data: WsCommand) {
  const { userId, roomId } = data;
  const delta = {
    type: "TERMINATE_LEFT",
    content: "Successfully exited room"
  };
  RoomManager.removeUser(roomId, userId, "TERMINATE_LEFT", JSON.stringify(delta));
  return true;
}

function terminateUser(data: WsCommand) {
  const { content, userId, roomId } = data;
  if (!content) return false;
  const jsonContent = JSON.parse(content) as any;
  const isOwner = RoomManager.isOwner(userId, roomId);
  if (!isOwner) return false;
  const delta = {
    type: "TERMINATE",
    content: "Admin Removed"
  };
  RoomManager.removeUser(roomId, jsonContent.userId, "TERMINATE", JSON.stringify(delta));
  return true;
}

export function addUser(data: WsCommand) {
  const { roomId, userId, ws, userName } = data;
  if (!ws) return false;
  RoomManager.addUser(roomId, userId, userName!, ws);
  return true;
}
export function websocketService(data: WsCommand) {
  const { type } = validator.verify(data);
  let result: boolean = false;
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
  return result;
}
