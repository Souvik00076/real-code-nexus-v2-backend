import { ValidatorRequestReturn } from "types";
import { RoomCommand } from "types/dto";
import { WebSocket } from "ws";
import { validateRequest } from "./utils/utils.validation";

export type RoomSocketUserInfo = {
  userId: string;
  userName: string;
  socket: WebSocket;
  lastPong: number;
  lastPing?: number;
  isOwner: boolean;
};
export type RoomInfo = {
  users: Map<string, RoomSocketUserInfo>;
  contents: any;
};

export class RoomManager {
  private static rooms: Map<string, RoomInfo> = new Map();
  private static heartbeatInterval: NodeJS.Timeout | null = null;
  private static pingInterval: NodeJS.Timeout | null = null;
  private static validator: ValidatorRequestReturn<RoomCommand> = validateRequest<RoomCommand>(RoomCommand);

  public static initialize() {
    this.startPing();
    this.startHeartBeatCleanup();
  }
  public static close() {
    this.stopAllIntervals();
  }
  private static startPing(intervalMs = 30_000): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    this.pingInterval = setInterval(() => {
      this.sendPingToAllUsers();
    }, intervalMs);
    console.log(`Ping interval started - sending pings every ${intervalMs}ms`);
  }
  private static startHeartBeatCleanup(intervalMs = 5_000, timeoutMs = 10_000): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.heartbeatInterval = setInterval(() => {
      this.cleanupInactiveUsers(timeoutMs);
    }, intervalMs);
    console.log(`Heartbeat cleanup started - checking every ${intervalMs}ms, timeout ${timeoutMs}ms`);
  }
  private static stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
      console.log('Ping interval stopped');
    }
  }
  private static stopHeartBeatCleanup(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
      console.log('Heartbeat cleanup stopped');
    }
  }
  private static stopAllIntervals(): void {
    this.stopPing();
    this.stopHeartBeatCleanup();
  }
  private static getOrCreateRoom(roomId: string): RoomInfo {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        users: new Map(),
        contents: "",
      });
    }
    return this.rooms.get(roomId)!;
  }
  private static broadcast(data: RoomCommand): void {
    const { roomId, content, excludeUserId } = this.validator.verify(data);
    if (!roomId || !content) return;
    const room = this.rooms.get(roomId);
    if (!room) return;
    let sentCount = 0;
    let failedCount = 0;
    for (const [currentUserId, { socket }] of room.users.entries()) {
      if (excludeUserId && currentUserId === excludeUserId) {
        continue;
      }
      try {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(content);
          sentCount++;
        } else {
          failedCount++;
        }
      } catch (error) {
        console.warn(`Failed to send message to user ${currentUserId}:`, error);
        failedCount++;
      }
    }
    if (failedCount > 0) {
      console.warn(`Broadcast to room ${roomId}: ${sentCount} sent, ${failedCount} failed`);
    }
  }
  private static getRoomContents(data: RoomCommand): any {
    const { roomId } = this.validator.verify(data);
    if (!roomId) return;
    return this.rooms.get(roomId)?.contents;
  }
  private static setRoomContents(data: RoomCommand): void {
    const { roomId, content } = this.validator.verify(data);
    if (!roomId || !content) return;
    const room = this.getOrCreateRoom(roomId);
    room.contents = content;
  }
  private static sendPingToAllUsers(): void {
    const timestamp = Date.now();
    let totalPingsSent = 0;
    let totalPingsFailed = 0;
    for (const [roomId, room] of this.rooms) {
      for (const [userId, user] of room.users) {
        try {
          if (user.socket.readyState === WebSocket.OPEN) {
            const pingMessage = JSON.stringify({
              type: "PING",
              timestamp
            });
            user.socket.send(pingMessage);
            user.lastPing = timestamp;
            totalPingsSent++;
          } else {
            totalPingsFailed++;
          }
        } catch (error) {
          console.warn(`Failed to send ping to user ${userId} in room ${roomId}:`, error);
          totalPingsFailed++;
        }
      }
    }
    if (totalPingsSent > 0) {
      console.log(`Pings sent: ${totalPingsSent}, failed: ${totalPingsFailed}`);
    }
  }
  private static cleanupInactiveUsers(timeout = 60_000): void {
    const now = Date.now();
    let cleanedUsers = 0;
    let cleanedRooms = 0;
    for (const [roomId, room] of this.rooms) {
      const usersToRemove: string[] = [];
      for (const [userId, user] of room.users) {
        if (user.lastPing && now - user.lastPing > timeout) {
          console.log(`User ${userId} in room ${roomId} timed out (${now - user.lastPong}ms since last heartbeat)`);
          try {
            if (user.socket.readyState === WebSocket.OPEN) {
              user.socket.close(1000, "Heartbeat timeout");
            }
          } catch (error) {
            console.warn(`Error closing timed out socket for user ${userId}:`, error);
          }
          usersToRemove.push(userId);
          cleanedUsers++;
        }
      }
      // Remove timed out users
      usersToRemove.forEach(userId => room.users.delete(userId));
      // Remove empty room
      if (room.users.size === 0) {
        this.rooms.delete(roomId);
        cleanedRooms++;
      }
    }
    if (cleanedUsers > 0 || cleanedRooms > 0) {
      console.log(`Cleanup completed: ${cleanedUsers} users removed, ${cleanedRooms} rooms deleted`);
    }
  }

  public static handlePong(data: RoomCommand): boolean {
    const { roomId, userId } = this.validator.verify(data);
    if (!roomId || !userId) return false;
    const room = this.rooms.get(roomId);
    if (!room) return false;
    const user = room.users.get(userId);
    if (user) {
      user.lastPong = Date.now();
      delete user.lastPing;
    }
    return true;
  }
  public static getUserInfo(data: RoomCommand) {
    const { roomId, userId } = this.validator.verify(data);
    if (!roomId || !userId) return null;
    const room = this.rooms.get(roomId);
    if (!room) return null;
    const user = room.users.get(userId);
    return user;
  }
  public static isOwner(data: RoomCommand): boolean {
    const { roomId, userId } = this.validator.verify(data);
    if (!userId) return false;
    const room = this.rooms.get(roomId);
    if (!room) return false;
    const userInfo = room.users.get(userId);
    if (!userInfo) return false;
    return userInfo.isOwner;
  }
  public static sendContent(data: RoomCommand): boolean {
    const { senderId, roomId, content } = this.validator.verify(data);
    if (!senderId || !roomId || !content) {
      return false;
    }
    const room = this.rooms.get(roomId)!;
    if (!room) return false;
    const user = room.users.get(senderId);
    if (!user) return false;
    if (!content) return false;
    const delta = {
      type: "DELTA",
      content,
      senderId,
      senderName: user.userName
    };
    this.broadcast({
      roomId,
      content: JSON.stringify(delta),
      excludeUserId: senderId
    });
    return true;
  }
  public static removeUser(data: RoomCommand): boolean {
    const { roomId, userId } = this.validator.verify(data);
    if (!roomId || !userId) return false;
    const room = this.rooms.get(roomId);
    if (!room) return false;
    const user = room.users.get(userId);
    if (!user) return false;
    if (user) {
      try {
        if (user.socket.readyState === WebSocket.OPEN) {
          user.socket.close(1000, "User removed");
        }
        room.users.delete(userId);
        this.broadcast({
          roomId,
          userName: user.userName,
          content: JSON.stringify({
            content: `${user.userName} has left the room`,
            userId,
            userName: user.userName,
            type: "LEFT"
          })
        } as RoomCommand)

      } catch (error) {
        console.warn(`Error closing socket for user ${userId}:`, error);
      }
    }
    // Remove empty room
    if (room.users.size === 0) {
      this.rooms.delete(roomId);
      console.log(`Room ${roomId} deleted (empty)`);
    }
    return true;
  }
  public static terminateUser(data: RoomCommand): boolean {
    const { roomId, userId, excludeUserId } = this.validator.verify(data);
    if (!roomId || !userId || !excludeUserId) return false;
    const room = this.rooms.get(roomId);
    if (!room) return false;
    const isOwner = this.isOwner(data);
    if (!isOwner) return false;
    const user = room.users.get(excludeUserId);
    if (!user) return false;
    if (user) {
      try {
        if (user.socket.readyState === WebSocket.OPEN) {
          user.socket.close(1000, "User removed");
        }
        room.users.delete(userId);
        this.broadcast({
          roomId,
          userName: user.userName,
          content: JSON.stringify({
            content: `${user.userName} removed by admin`,
            type: "REMOVED",
            userId: user.userId,
            userName: user.userName
          })
        } as RoomCommand)

      } catch (error) {
        //console.warn(`Error closing socket for user ${userId}:`, error);
      }
    }

    return false;
  }
  public static addUser(data: RoomCommand): boolean {
    const { roomId, userId, userName, socket } = this.validator.verify(data);
    if (!userId || !userName || !socket) return false;
    const room = this.getOrCreateRoom(roomId);
    const existingUser = room.users.get(userId);
    // Close existing connection if user reconnects
    if (existingUser) {
      try {
        existingUser.socket.close(1000, "User reconnected");
      } catch (error) {
        console.warn(`Error closing existing socket for user ${userId}:`, error);
        return false;
      }
    }
    // Check if this should be the room owner (first user)
    const isOwner = room.users.size === 0;
    room.users.set(userId, {
      userId,
      userName,
      socket,
      lastPong: Date.now(),
      isOwner
    });
    this.broadcast({
      roomId,
      content: JSON.stringify(
        {
          userId,
          userName,
          type: "NEW_USER"
        }
      ),
      excludeUserId: userId
    } as RoomCommand)
    console.log(`User ${userId} ${isOwner ? '(owner)' : ''} added to room ${roomId}`);
    return true;
  }
}
