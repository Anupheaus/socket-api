import { ConstructorOf } from '@anupheaus/common';
import { createComponent } from '@anupheaus/react-ui';
import { ReactNode, useMemo } from 'react';
import { SocketAPIError, createLogger } from '../../common';
import { ControllersContext, ControllersContextProps } from './ControllersContext';
import { createControllers } from './ClientControllers';
import { useConnectionStatus } from './useConnectionStatus';

const logger = createLogger('ControllersProvider');

interface Props {
  url: string;
  timeout?: number;
  token?: string;
  children: ReactNode;
  whenPendingConnection?: ReactNode;
  whenLostConnection?: ReactNode;
  errors?: ConstructorOf<SocketAPIError>[];
  onTokenUpdated?(token: string): void;
  onError?(error: SocketAPIError): void;
}

export const ControllersProvider = createComponent('ControllersProvider', ({
  url,
  // timeout = 20000,
  token,
  whenLostConnection = null,
  whenPendingConnection = null,
  children,
  // errors,
  onTokenUpdated,
  // onError,
}: Props) => {
  const { hasConnected, isConnected, getSocket, useSocket, metadata } = useConnectionStatus({ logger, url, token, onTokenUpdated });

  // const hydrateError = useBound((error: AnyObject): SocketAPIError => {
  //   const hydratedError = (() => {
  //     if (error instanceof SocketAPIError) return error;
  //     if (errors != null && Reflect.has(error, 'type')) {
  //       const { type } = error;
  //       const IdentifiedError = errors.find(errorType => errorType.name === type);
  //       if (IdentifiedError != null) return new IdentifiedError(error);
  //     }
  //     return SocketAPIError.from(error);
  //   })();
  //   onError?.(hydratedError);
  //   return hydratedError;
  // });

  const controllers = useMemo(() => createControllers({ getSocket, useSocket, metadata, logger }), [metadata, isConnected, getSocket, useSocket]);

  const context = useMemo((): ControllersContextProps => ({
    isConnected,
    controllers,
  }), [controllers, isConnected]);

  if (!isConnected) {
    if (!hasConnected) return (<>{whenPendingConnection}</>);
    return (<>{whenLostConnection}</>);
  }

  return (
    <ControllersContext.Provider value={context}>
      {children}
    </ControllersContext.Provider>
  );
});
