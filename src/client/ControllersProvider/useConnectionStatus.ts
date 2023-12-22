import { Logger } from '@anupheaus/common';
import { useBound, useId, useOnChange } from '@anupheaus/react-ui';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { ControllerMetadata } from '../../common';


interface Props {
  logger: Logger;
  url: string;
  token?: string;
  onConnected?(socket: Socket): void;
  onTokenUpdated?(token: string): void;
}

export function useConnectionStatus({ logger, url, token, onConnected, onTokenUpdated }: Props) {
  const hasConnectedRef = useRef(false);
  const metadataRef = useRef<ControllerMetadata[]>([]);
  const socketRef = useRef(Promise.createDeferred<Socket>());
  const callbacks = useRef(new Map<string, (() => void)>()).current;
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

    socket.on('metadata', (metadata: ControllerMetadata[]) => {
      logger.info('Received metadata from server', { socketId, metadata });
      metadataRef.current = metadata;
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

    // socket.on('updateClient', ({ hash, response }: UpdateClientMessage) => {
    //   logger.info('Received update from server', { socketId, hash });
    //   logger.debug('Updating cache with response', { socketId, hash });
    //   responseCache.set(hash, Promise.resolve(response));
    //   callListeners(hash, response, socketId);
    // });

    return () => {
      logger.info('Disconnecting from server', { url });
      // close the old one
      socket.close();
    };
  }, [url]);

  const getSocket = useBound(() => socketRef.current);
  const useSocket = useBound((delegate: (socket: Socket) => (() => void) | void) => {
    const id = useId();
    const disposeRef = useRef<(() => void) | void>(void 0);
    callbacks.set(id, async () => {
      disposeRef.current?.();
      disposeRef.current = void 0;
      if (isConnected) {
        const socket = await socketRef.current;
        disposeRef.current = delegate(socket);
      }
    });
    useEffect(() => () => { callbacks.delete(id); }, []);
  });

  useOnChange(() => {
    callbacks.forEach(callback => callback());
  }, [isConnected]);

  return {
    hasConnected: hasConnectedRef.current,
    metadata: metadataRef.current,
    isConnected,
    getSocket,
    useSocket,
  };
}