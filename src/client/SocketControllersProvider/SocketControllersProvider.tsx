import { createComponent, useBound } from '@anupheaus/react-ui';
import { ReactNode, useMemo, useRef } from 'react';
import { SocketClientError, SocketControllerSerialisedError, SocketServerError } from '../../common';
import { createLogger } from '../../common/logger';
import { SocketControllersConnectionContext, SocketControllersContext, SocketControllersContextProps } from '../SocketControllersContext';
import { createHookListener } from './createHookListener';
import { createInvokeAction } from './createInvokeAction';
import { useSocketConnectionStatus } from './useSocketConnectionStatus';

const logger = createLogger('SocketControllersProvider');

interface Props {
  url: string;
  timeout?: number;
  token?: string;
  children: ReactNode;
  whenPendingConnection?: ReactNode;
  whenLostConnection?: ReactNode;
  onTokenUpdated?(token: string): void;
  onDeserialiseError(error: SocketControllerSerialisedError): Error;
}

export const SocketControllersProvider = createComponent('SocketControllersProvider', ({
  url,
  timeout = 20000,
  token,
  whenLostConnection = null,
  whenPendingConnection = null,
  children,
  onTokenUpdated,
  onDeserialiseError,
}: Props) => {
  const responseCache = useRef(new Map<string, Promise<unknown>>()).current;

  const { listenForUpdates, callListeners } = createHookListener({ logger });

  const { hasConnected, isConnected, socketRef, controllerMetadata } = useSocketConnectionStatus({
    logger,
    url,
    token,
    responseCache,
    callListeners,
    onTokenUpdated,
  });

  const onError = useBound((error: SocketControllerSerialisedError): Error => {
    const message = error.message ?? error.serialisedError.message;

    if (error.errorClassName === SocketServerError.name) return new SocketServerError(message, error.serialisedError.meta);
    if (error.errorClassName === SocketClientError.name) return new SocketClientError(message, error.serialisedError.meta);

    return onDeserialiseError(error);
  });


  const invokeAction = createInvokeAction({ socketRef, logger, responseCache, timeout, onError });

  const context = useMemo((): SocketControllersContextProps => ({
    controllerMetadata,
    invokeAction,
    listenForUpdates,
  }), []);

  if (!isConnected) {
    if (!hasConnected) return (<>{whenPendingConnection}</>);
    return (<>{whenLostConnection}</>);
  }

  return (
    <SocketControllersContext.Provider value={context}>
      <SocketControllersConnectionContext.Provider value={isConnected}>
        {children}
      </SocketControllersConnectionContext.Provider>
    </SocketControllersContext.Provider>
  );
});