import { createComponent, useBound, useId, useLogger, useMap, useOnUnmount } from '@anupheaus/react-ui';
import type { ReactNode } from 'react';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import type { SocketContextProps } from './SocketContext';
import { SocketContext } from './SocketContext';
import type { Unsubscribe } from '@anupheaus/common';
import { InternalError, Logger, type AnyFunction } from '@anupheaus/common';
import { createClientSocket } from './createClientSocket';

interface CallbackRecord {
  callback: (isConnected: boolean, socket: Socket | undefined) => void;
  debugId?: string;
}

interface EventHandler {
  socketHandler: AnyFunction;
  handlers: Map<string, AnyFunction>;
}

interface Props {
  host?: string;
  name: string;
  children?: ReactNode;
}

export const SocketProvider = createComponent('SocketProvider', ({
  host,
  name,
  children,
}: Props) => {
  const logger = useLogger();
  const registeredEvents = useMap<string, EventHandler>();
  const [uniqueConnectionId, setUniqueConnectionId] = useState('');
  const socketRef = useRef<Socket>();
  const unsubscribeListenerRef = useRef<Unsubscribe>(() => void 0);

  const getSocket = () => {
    const sck = socketRef.current;
    if (sck == null) throw new InternalError('Socket is not available yet.');
    return sck;
  };

  useMemo(() => {
    if (socketRef.current?.connected) disconnectSocket();
    logger.info('Connecting socket to server...');
    const sck = createClientSocket(host, name, logger);
    let isConnected = false;

    sck.on('connect', () => {
      if (isConnected) return; // prevent multiple calls
      isConnected = true;
      unsubscribeListenerRef.current();
      unsubscribeListenerRef.current = Logger.registerListener({
        sendInterval: {
          seconds: 2,
        },
        maxEntries: 100,
        onTrigger: entries => {
          const socket = getSocket();
          socket.emit('mxdb.log', entries);
        },
      });
      logger.always('Socket connected to server', { id: sck.id });
      connectionCallbacks.forEach(({ callback, debugId }, callbackId) => {
        if (debugId) logger.silly('Calling connection state change callback from connect', { callbackId, debugId, connected: true });
        callback(true, sck);
      });
    });
    sck.on('disconnect', () => {
      if (!isConnected) return; // prevent multiple calls
      isConnected = false;
      unsubscribeListenerRef.current();
      logger.debug('Socket disconnected from server', { id: sck.id });
      connectionCallbacks.forEach(({ callback, debugId }, callbackId) => {
        if (debugId) logger.silly('Calling connection state change callback from connect', { callbackId, debugId, connected: false });
        callback(false, undefined);
      });
    });
    sck.on('connect_error', error => logger.error(`Socket connection error: ${error.message}`, { error }));
    if (uniqueConnectionId === '') sck.connect(); // only connect if the unique connection id is not set
    socketRef.current = sck;
  }, [uniqueConnectionId, name]);

  const connectionCallbacks = useMap<string, CallbackRecord>();

  const disconnectSocket = useBound(() => {
    const socket = getSocket();
    Array.from(registeredEvents.entries()).forEach(([event, { socketHandler }]) => socket.removeListener(event, socketHandler));
    socket.disconnect();
  });

  const context = useMemo<SocketContextProps>(() => ({
    getSocket() {
      const socket = getSocket();
      if (socket.connected) return socket;
    },
    onConnectionStateChanged(callback, debugId) {
      const callbackId = useId();
      const boundCallback = useBound(callback);
      if (debugId) logger.silly('Registering connection state change callback', { callbackId, debugId });
      connectionCallbacks.set(callbackId, { callback: boundCallback, debugId });
      useLayoutEffect(() => {
        const socket = getSocket();
        if (debugId) logger.silly('Calling connection state change callback', { callbackId, debugId, connected: socket.connected });
        if (socket.connected) boundCallback(true, socket); else boundCallback(false, undefined);
        return () => {
          if (debugId) logger.silly('Deleting connection state change callback', { callbackId, debugId });
          connectionCallbacks.delete(callbackId);
        };
      }, []);
    },
    testDisconnect() {
      disconnectSocket();
      setUniqueConnectionId(Math.uniqueId());
    },
    testReconnect() {
      const socket = getSocket();
      if (socket.connected) return;
      socket.connect();
    },
    on(hookId, event, handler) {
      const callbackId = `${hookId}-${event}`;
      let registeredEvent = registeredEvents.get(event);
      if (registeredEvent == null) {
        const handlers = new Map<string, AnyFunction>();
        registeredEvent = {
          handlers,
          socketHandler: async (data: any, response: AnyFunction) => response(await Array.from(handlers.values()).mapAsync(innerHandler => innerHandler(data))),
        };
        registeredEvents.set(event, registeredEvent);
        const callback = (isConnected: boolean, socket: Socket | undefined) => {
          if (!isConnected || socket == null) return;
          socket.on(event, registeredEvent!.socketHandler);
        };
        connectionCallbacks.set(event, { callback });
        const localSocket = getSocket();
        callback(localSocket.connected, localSocket);
      }
      registeredEvent.handlers.set(callbackId, handler);
    },
  }), []);


  useOnUnmount(() => disconnectSocket());

  return (
    <SocketContext.Provider value={context}>
      {children}
    </SocketContext.Provider>
  );
});