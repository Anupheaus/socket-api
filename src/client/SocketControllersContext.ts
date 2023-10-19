import { createContext } from 'react';
import { InvokeActionMessage } from '../common/internalSocketsModels';

export interface SocketControllersContextProps {
  controllerMetadata: Map<string, string[]>;
  invokeAction(action: InvokeActionMessage): Promise<unknown>;
  listenForUpdates(listenerId: string, callback: (value: unknown) => void): (hashes: string[]) => void;
}

export const SocketControllersContext = createContext<SocketControllersContextProps>({
  controllerMetadata: new Map(),
  invokeAction: () => Promise.reject(new Error('SocketControllersContext not initialized')),
  listenForUpdates: () => () => void 0,
});

export const SocketControllersConnectionContext = createContext<boolean>(false);

