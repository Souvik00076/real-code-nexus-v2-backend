import { WebSocketServer } from "ws";
import { IncomingMessage, Server } from 'http'
import { Duplex } from "stream";

export class WebsocketServer {
  private static app: WebSocketServer;
  public static init(httpServer: Server) {
    if (!this.app) {
      const wss = new WebSocketServer({
        noServer: true,
        path: "/sockets"
      });
      httpServer.on("upgrade", (request: IncomingMessage, socket: Duplex, head: Buffer) => {
        console.log("came here");
        console.log("Request URL:", request.url);
        if (request.url === '/sockets') {
          wss.handleUpgrade(request, socket, head, (websocket) => {
            wss.emit("connection", websocket, request);
          });
        } else {
          socket.destroy();
        }
      });

      // Handle WebSocket connections
      wss.on('connection', (ws, request) => {
        console.log('New WebSocket connection established');
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
