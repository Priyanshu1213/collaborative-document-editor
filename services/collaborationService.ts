import { io, Socket } from 'socket.io-client';
import { authService } from './authService';
import { SOCKET_CONFIG, EDITOR_EVENTS } from '@/utils/constants';

class CollaborationService {
  private socket: Socket | null = null;
  private documentId: string | null = null;
  private userId: string | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  connect(documentId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (this.socket?.connected && this.documentId === documentId) {
          resolve();
          return;
        }

        const token = authService.getToken();
        const user = authService.getUser();

        if (!token || !user) {
          reject(new Error('Not authenticated'));
          return;
        }

        this.userId = user.id;
        this.documentId = documentId;

        this.socket = io(SOCKET_CONFIG.URL, {
          auth: { token },
          ...SOCKET_CONFIG,
        });

        this.socket.on('connect', () => {
          console.log('[Socket.io] Connected');
          this.socket?.emit('join_document', { documentId });
          this.emit('connection_status', { connected: true });
          resolve();
        });

        this.socket.on('disconnect', () => {
          console.log('[Socket.io] Disconnected');
          this.emit('connection_status', { connected: false });
        });

        this.socket.on('error', (error) => {
          console.error('[Socket.io Error]:', error);
          reject(error);
        });

        // Forward all other events
        this.socket.onAny((event, ...args) => {
          this.emit(event, ...args);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.socket?.connected) {
      this.socket.emit('leave_document', { documentId: this.documentId });
      this.socket.disconnect();
    }
    this.socket = null;
    this.documentId = null;
  }

  sendContentChange(content: string): void {
    if (this.socket?.connected) {
      this.socket.emit(EDITOR_EVENTS.CONTENT_CHANGE, {
        documentId: this.documentId,
        content,
        userId: this.userId,
      });
    }
  }

  sendCursorMove(position: number, color: string): void {
    if (this.socket?.connected) {
      this.socket.emit(EDITOR_EVENTS.CURSOR_MOVE, {
        documentId: this.documentId,
        position,
        userId: this.userId,
        color,
      });
    }
  }

  sendTypingIndicator(): void {
    if (this.socket?.connected) {
      this.socket.emit(EDITOR_EVENTS.USER_TYPING, {
        documentId: this.documentId,
        userId: this.userId,
      });
    }
  }

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
  }

  off(event: string, callback?: Function): void {
    if (!callback) {
      this.listeners.delete(event);
      return;
    }
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, ...args: any[]): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(...args));
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  getActiveUsers(): string[] {
    // This will be set by remote_active_users event
    return [];
  }
}

export const collaborationService = new CollaborationService();
