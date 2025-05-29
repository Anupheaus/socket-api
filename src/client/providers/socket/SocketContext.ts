import { createContext } from 'react';
import type { Socket } from 'socket.io-client';

export interface SocketContextProps {
  getSocket(): Socket | undefined;
  onConnectionStateChanged(callback: (isConnected: boolean, socket: Socket | undefined) => void, debugId?: string): void;
  testDisconnect(): void;
  testReconnect(): void;
  on<DataType = unknown, ReturnType = unknown>(hookId: string, event: string, callback: (data: DataType) => ReturnType): void;
}

export const SocketContext = createContext<SocketContextProps>({
  getSocket: () => undefined,
  onConnectionStateChanged: () => void 0,
  testDisconnect: () => void 0,
  testReconnect: () => void 0,
  on: () => void 0,
});
