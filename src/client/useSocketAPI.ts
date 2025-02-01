import { useMemo, useRef, useState } from 'react';
import { useSocket } from './providers';
import type { Socket } from 'socket.io-client';

export function useSocketAPI() {
  const { isConnected: getIsConnected, onConnectionStateChange, getSocket, testDisconnect, testReconnect } = useSocket();
  const [isConnected, setIsConnected] = useState(useMemo(() => getIsConnected(), []));
  const updateWhenChangedRef = useRef(false);
  const [clientId, setClientId] = useState(useMemo(() => getIsConnected() ? getSocket()?.id : undefined, []));

  onConnectionStateChange((newIsConnected, socket) => {
    if (!updateWhenChangedRef.current) return;
    setClientId(socket?.id);
    setIsConnected(newIsConnected);
  });

  const onConnected = (callback: (socket: Socket) => void) => onConnectionStateChange((_result, socket) => {
    if (socket) callback(socket);
  });

  const onDisconnected = (callback: () => void) => onConnectionStateChange((_result, socket) => {
    if (socket == null) callback();
  });

  return {
    get isConnected() { updateWhenChangedRef.current = true; return isConnected; },
    get clientId() { updateWhenChangedRef.current = true; return clientId; },
    getSocket,
    getIsConnected,
    onConnectionStateChange,
    onConnected,
    onDisconnected,
    testDisconnect,
    testReconnect,
  };
}
