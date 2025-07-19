import { WebSocket } from "ws";
export type RoomSocketUserInfo = {
  userName: string;
  socket: WebSocket;
  lastHeartBeat: number;
};

export type RoomInfo = {
  users: Map<string, RoomSocketUserInfo>; // key: userId or userName
  contents: any; // e.g., shared document/code etc.
};
export class RoomManager {
  private rooms: Map<string, RoomInfo> = new Map();
  /** Create or get an existing room */
  public getOrCreateRoom(roomId: string): RoomInfo {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        users: new Map(),
        contents: "", // or initial content structure
      });
    }
    return this.rooms.get(roomId)!;
  }
  /** Add a user to a room */
  public addUser(roomId: string, userName: string, socket: WebSocket): void {
    const room = this.getOrCreateRoom(roomId);
    room.users.set(userName, {
      userName,
      socket,
      lastHeartBeat: Date.now(),
    });
  }
  /** Remove a user from a room */
  public removeUser(roomId: string, userName: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.users.delete(userName);
      if (room.users.size === 0) {
        this.rooms.delete(roomId); // auto cleanup
      }
    }
  }
  /** Update the heartbeat of a user */
  public updateHeartbeat(roomId: string, userName: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      const user = room.users.get(userName);
      if (user) {
        user.lastHeartBeat = Date.now();
      }
    }
  }

  /** Broadcast a message to all users in a room */
  public broadcast(roomId: string, data: any): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const message = typeof data === "string" ? data : JSON.stringify(data);
    for (const { socket } of room.users.values()) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(message);
      }
    }
  }
  public getRoomContents(roomId: string): any {
    return this.rooms.get(roomId)?.contents;
  }
  /** Set/update room contents */
  public setRoomContents(roomId: string, contents: any): void {
    const room = this.getOrCreateRoom(roomId);
    room.contents = contents;
  }
  /** Periodically check for inactive users */
  public cleanupInactiveUsers(timeout = 30_000): void {
    const now = Date.now();
    for (const [roomId, room] of this.rooms) {
      for (const [userName, user] of room.users) {
        if (now - user.lastHeartBeat > timeout) {
          console.log(`User ${userName} in room ${roomId} timed out.`);
          user.socket.close();
          room.users.delete(userName);
        }
      }
      // Remove empty room
      if (room.users.size === 0) {
        this.rooms.delete(roomId);
      }
    }
  }
}
