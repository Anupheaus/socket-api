import { ConstructorOf, Record } from '@anupheaus/common';
import { createComponent } from '@anupheaus/react-ui';
import { ReactNode, useMemo } from 'react';
import { ControllerMethodMetadata, SocketAPIError, createLogger } from '../common';
import { useConnectionStatus } from './useConnectionStatus';
import { Contexts, ControllersContextProps } from './ClientContext';
import { useCreateControllers } from './ClientControllers';

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
  onHydrateRecord?<T extends Record>(record: T, storeName: string): T;
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
  onHydrateResponse = hydrateResponse,
  onDehydrateRequestArgs = dehydrateRequestArgs,
  onHydrateRecord,
  // onError,
}: Props) => {
  const { hasConnected, isConnected, getSocket, useSocket, metadata } = useConnectionStatus({ logger, url, token, onTokenUpdated });
  const controllers = useCreateControllers({ getSocket, useSocket, metadata, logger, onHydrateResponse, onDehydrateRequestArgs, onHydrateRecord });

  const controllersContext = useMemo<ControllersContextProps>(() => ({
    isConnected,
    controllers,
  }), [controllers, isConnected]);

  if (!isConnected) {
    if (!hasConnected) return (<>{whenPendingConnection}</>);
    return (<>{whenLostConnection}</>);
  }

  return (
    <Contexts.Token.Provider value={token}>
      <Contexts.Controllers.Provider value={controllersContext}>
        {children}
      </Contexts.Controllers.Provider>
    </Contexts.Token.Provider>
  );
});
