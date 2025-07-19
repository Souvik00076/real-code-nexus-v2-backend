import { WebSocketServer } from "ws";
import { IncomingMessage, Server } from 'http'
import { Duplex } from "stream";
import { addUserToRoom, checkIfRoomExist } from "../lib/utils/utils.db";

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
        const userName = request.headers["authorization"]
        if (!roomId || url.pathname !== "/ws" || !userName) {
          socket.destroy(); // silently close the connection
          return;
        }
        const isRoomExist = await checkIfRoomExist(roomId);
        if (!isRoomExist) {
          socket.destroy();
          return;
        }
        const isAdded = await addUserToRoom(roomId, userName);
        if (!isAdded) {
          socket.destroy();
          return;
        }
        wss.handleUpgrade(request, socket, head, (websocket) => {
          wss.emit("connection", websocket, request);
        });
      });
      wss.on('connection', (ws, request) => {
        ws.on('message', (message) => {
          console.log('Received message:', message.toString());
          ws.send(`Echo: ${message}`);
        });
        ws.on('close', () => {
          console.log('WebSocket connection closed');
        });
      });
      this.app = wss;
    }
    return this.app;
  }
}
