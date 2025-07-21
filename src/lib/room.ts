import { WebSocket } from "ws";

export type RoomSocketUserInfo = {
  userId: string;
  socket: WebSocket;
  lastHeartBeat: number;
  lastPingSent?: number;
  isOwner: boolean;
};
export type RoomInfo = {
  users: Map<string, RoomSocketUserInfo>; // key: userId
  contents: any; // e.g., shared document/code etc.
};

export class RoomManager {
  private static rooms: Map<string, RoomInfo> = new Map();
  private static heartbeatInterval: NodeJS.Timeout | null = null;
  private static pingInterval: NodeJS.Timeout | null = null;

  public static initialize() {
    this.startPing();
    this.startHeartBeatCleanup();
  }

  public static close() {
    this.stopAllIntervals();
  }
  /**
   * Start sending pings to all connected users
   * @param intervalMs How often to send pings (default: 30 seconds)
   */
  private static startPing(intervalMs = 30_000): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    this.pingInterval = setInterval(() => {
      this.sendPingToAllUsers();
    }, intervalMs);
    console.log(`Ping interval started - sending pings every ${intervalMs}ms`);
  }
  /**
   * Start cleanup process for inactive users
   * @param intervalMs How often to check for inactive users (default: 15 seconds)
   * @param timeoutMs How long to wait before considering user inactive (default: 60 seconds)
   */
  private static startHeartBeatCleanup(intervalMs = 15_000, timeoutMs = 60_000): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.heartbeatInterval = setInterval(() => {
      this.cleanupInactiveUsers(timeoutMs);
    }, intervalMs);
    console.log(`Heartbeat cleanup started - checking every ${intervalMs}ms, timeout ${timeoutMs}ms`);
  }
  /**
   * Stop ping interval
   */
  private static stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
      console.log('Ping interval stopped');
    }
  }
  /**
   * Stop heartbeat cleanup
   */
  private static stopHeartBeatCleanup(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
      console.log('Heartbeat cleanup stopped');
    }
  }
  /**
   * Stop all intervals (for graceful shutdown)
   */
  private static stopAllIntervals(): void {
    this.stopPing();
    this.stopHeartBeatCleanup();
  }

  /** Create or get an existing room */
  private static getOrCreateRoom(roomId: string): RoomInfo {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        users: new Map(),
        contents: "", // or initial content structure
      });
    }
    return this.rooms.get(roomId)!;
  }
  /** Add a user to a room */
  public static addUser(roomId: string, userId: string, socket: WebSocket): void {
    const room = this.getOrCreateRoom(roomId);
    const existingUser = room.users.get(userId);
    // Close existing connection if user reconnects
    if (existingUser) {
      try {
        existingUser.socket.close(1000, "User reconnected");
      } catch (error) {
        console.warn(`Error closing existing socket for user ${userId}:`, error);
      }
    }
    // Check if this should be the room owner (first user)
    const isOwner = room.users.size === 0;
    room.users.set(userId, {
      userId,
      socket,
      lastHeartBeat: Date.now(),
      isOwner
    });
    console.log(`User ${userId} ${isOwner ? '(owner)' : ''} added to room ${roomId}`);
  }
  /** Remove a user from a room */
  public static removeUser(roomId: string, userId: string, reason?: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const user = room.users.get(userId);
    if (user) {
      try {
        if (user.socket.readyState === WebSocket.OPEN) {
          user.socket.close(1000, reason || "User removed");
        }
      } catch (error) {
        console.warn(`Error closing socket for user ${userId}:`, error);
      }
      room.users.delete(userId);
      console.log(`User ${userId} removed from room ${roomId}: ${reason || 'No reason'}`);
    }
    // Remove empty room
    if (room.users.size === 0) {
      this.rooms.delete(roomId);
      console.log(`Room ${roomId} deleted (empty)`);
    }
  }
  /** 
   * Handle pong response from client (updates heartbeat)
   */
  public static handlePong(roomId: string, userId: string, timestamp?: number): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const user = room.users.get(userId);
    if (user) {
      user.lastHeartBeat = Date.now();
      delete user.lastPingSent;
    }
  }
  /** 
   * Update heartbeat manually (for other message types)
   */
  private static updateHeartbeat(roomId: string, userId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const user = room.users.get(userId);
    if (user) {
      user.lastHeartBeat = Date.now();
    }
  }

  /** Broadcast a message to all users in a room */
  public static broadcast(roomId: string, data: string, excludeUserId?: string): void {
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
          socket.send(data);
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

  private static getRoomContents(roomId: string): any {
    return this.rooms.get(roomId)?.contents;
  }

  private static setRoomContents(roomId: string, contents: any): void {
    const room = this.getOrCreateRoom(roomId);
    room.contents = contents;
  }
  /**
   * Send ping to all users in all rooms
   */
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
            user.lastPingSent = timestamp;
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
  /**
   * Clean up inactive users based on heartbeat timeout
   */
  private static cleanupInactiveUsers(timeout = 60_000): void {
    const now = Date.now();
    let cleanedUsers = 0;
    let cleanedRooms = 0;
    for (const [roomId, room] of this.rooms) {
      const usersToRemove: string[] = [];
      for (const [userId, user] of room.users) {
        if (now - user.lastHeartBeat > timeout) {
          console.log(`User ${userId} in room ${roomId} timed out (${now - user.lastHeartBeat}ms since last heartbeat)`);
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
  public static isOwner(userId: string, roomId: string): boolean  {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    const userInfo = room.users.get(userId);
    if (!userInfo) return false;
    return userInfo.isOwner;
  }
}
