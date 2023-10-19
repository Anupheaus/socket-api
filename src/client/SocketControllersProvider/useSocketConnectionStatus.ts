import { Logger } from '@anupheaus/common';
import { useLayoutEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { SocketControllerMetadata, UpdateClientMessage } from '../../common';

interface Props {
  logger: Logger;
  url: string;
  token?: string;
  responseCache: Map<string, Promise<unknown>>;
  callListeners(hash: string, response: unknown, socketId: string): void;
  onConnected?(socket: Socket): void;
  onTokenUpdated?(token: string): void;
}

export function useSocketConnectionStatus({ logger, url, token, responseCache, callListeners, onConnected, onTokenUpdated }: Props) {
  const hasConnectedRef = useRef(false);
  const controllerMetadata = useRef(new Map<string, string[]>()).current;
  const socketRef = useRef(Promise.createDeferred<Socket>());
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useLayoutEffect(() => {
    logger.info('Connecting to server', { url, token });
    const socket = io({ path: url, secure: true, transports: ['websocket'], auth: { token }, rejectUnauthorized: false });
    let socketId = socket.id;

    socket.on('connect', () => {
      socketId = socket.id;
      logger.info('Connected to server', { socketId });
    });

    socket.on('disconnect', () => {
      logger.info('Disconnected from server', { socketId });
      socketRef.current = Promise.createDeferred<Socket>();
      setIsConnected(false);
    });

    socket.on('controllerMetadata', (metadata: SocketControllerMetadata[]) => {
      logger.info('Received controller metadata from server', { socketId, metadata });
      controllerMetadata.clear();
      metadata.forEach(({ controllerId, methodNames }) => controllerMetadata.set(controllerId, methodNames));
      hasConnectedRef.current = true;
      onConnected?.(socket);
      socketRef.current.resolve(socket);
      setIsConnected(true);
    });

    socket.on('updateToken', (newToken: string) => {
      logger.info('Updating token', { token: newToken });
      socket.auth = { token: newToken };
      onTokenUpdated?.(newToken);
    });

    socket.on('updateClient', ({ hash, response }: UpdateClientMessage) => {
      logger.info('Received update from server', { socketId, hash });
      logger.debug('Updating cache with response', { socketId, hash });
      responseCache.set(hash, Promise.resolve(response));
      callListeners(hash, response, socketId);
    });

    return () => {
      logger.info('Disconnecting from server', { url });
      // close the old one
      socket.close();
    };
  }, [url]);

  return {
    hasConnected: hasConnectedRef.current,
    controllerMetadata,
    isConnected,
    socketRef,
  };
}