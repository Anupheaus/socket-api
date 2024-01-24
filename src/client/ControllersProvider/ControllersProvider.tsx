import { ConstructorOf } from '@anupheaus/common';
import { createComponent } from '@anupheaus/react-ui';
import { ReactNode, useMemo } from 'react';
import { ControllerMethodMetadata, SocketAPIError, createLogger } from '../../common';
import { ControllersContext, ControllersContextProps } from './ControllersContext';
import { createClientControllers } from './ClientControllers';
import { useConnectionStatus } from './useConnectionStatus';
import { createClientStores } from './createClientStores';

const logger = createLogger('ControllersProvider');

const hydrateResponse = (response: unknown) => response;
const dehydrateRequestArgs = (args: unknown[]) => args;

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
  onHydrateResponse?(response: unknown, metadata: ControllerMethodMetadata): unknown;
  onDehydrateRequestArgs?(args: unknown[], metadata: ControllerMethodMetadata): unknown[];
}

export const ControllersProvider = createComponent('ControllersProvider', ({
  url,
  // timeout = 20000,
  onHydrateResponse = hydrateResponse,
  onDehydrateRequestArgs = dehydrateRequestArgs,
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
  const stores = useMemo(() => createClientStores({ metadata, logger, getSocket }), [metadata]);
  const controllers = useMemo(() => createClientControllers({ getSocket, useSocket, metadata, logger, onHydrateResponse, onDehydrateRequestArgs }), [metadata, isConnected, getSocket, useSocket]);

  const context = useMemo((): ControllersContextProps => ({
    isConnected,
    controllers,
    stores,
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
