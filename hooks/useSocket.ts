import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_CONFIG } from '@/utils/constants';
import { authService } from '@/services/authService';

export function useSocket(documentId?: string) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      return;
    }

    const token = authService.getToken();

    socketRef.current = io(SOCKET_CONFIG.URL, {
      auth: {
        token,
      },
      ...SOCKET_CONFIG,
    });

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      if (documentId) {
        socketRef.current?.emit('join_document', { documentId });
      }
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
    });

    socketRef.current.on('active_users', (users: string[]) => {
      setActiveUsers(users);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [documentId]);

  const emit = (event: string, data?: any) => {
    socketRef.current?.emit(event, data);
  };

  const on = (event: string, callback: (data: any) => void) => {
    socketRef.current?.on(event, callback);
  };

  const off = (event: string) => {
    socketRef.current?.off(event);
  };

  return {
    isConnected,
    activeUsers,
    socket: socketRef.current,
    emit,
    on,
    off,
  };
}
