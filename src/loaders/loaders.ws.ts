import { WebSocketServer } from "ws";
import { IncomingMessage, Server } from 'http'
import { Duplex } from "stream";
import { addUserToRoom, checkIfRoomExist, checkIfUserExistById, findUserById } from "../lib/utils/utils.db";
import { RoomManager } from "lib/room";
import { websocketService } from "lib/services/services.ws";
import { WsResponse } from "types";
import { WsCommand } from "types/dto";

export class WebsocketServer {
  private static app: WebSocketServer;
  public static init(httpServer: Server) {
    if (!this.app) {
      const wss = new WebSocketServer({
        noServer: true,
        path: "/ws"
      });

      httpServer.on("upgrade", async (request: IncomingMessage, socket: Duplex, head: Buffer) => {
        const url = new URL(request.url || "", `http://${request.headers.host}`);
        const roomId = url.searchParams.get("roomId");
        const userId = url.searchParams.get("authorization")
        if (!roomId || url.pathname !== "/ws" || !userId) {
          socket.destroy(); // silently close the connection
          return;
        }
        const isRoomExist = await checkIfRoomExist(roomId);
        if (!isRoomExist) {
          socket.destroy();
          return;
        }
        const userInfo = await findUserById(userId);
        if (!userInfo) {
          socket.destroy();
          return;
        }
        (request as any).userId = userId;
        (request as any).roomId = roomId;
        (request as any).userName = userInfo.user_name;
        wss.handleUpgrade(request, socket, head, (websocket) => {
          wss.emit("connection", websocket, request);
        });
      });
      wss.on('connection', (ws, request) => {
        const userId = (request as any).userId as string;
        const roomId = (request as any).roomId as string;
        const userName = (request as any).user_name as string;
        websocketService({
          userId,
          roomId,
          userName,
          ws,
          type: "USER_ADD" as any
        });
        ws.on('message', (message) => {
          let result: WsResponse = {
            success: false,
            message: "Failed To Send"
          }
          try {
            const data = { userId, roomId, ...JSON.parse(message.toString()) };
            const flag = websocketService(data);
            result.success = flag;
            result.message = "OK"
          } catch (error) {
            console.log("validation error in wscommand")
          }
          ws.send(JSON.stringify(result));
        });
        ws.on('close', () => {
          const data = { userId, roomId, type: "TERMINATE" as any };
          websocketService(data);
          console.log('WebSocket connection closed');
        });
      });
      this.app = wss;
    }
    return this.app;
  }
}
