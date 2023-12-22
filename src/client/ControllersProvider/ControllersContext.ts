import { AnyObject } from '@anupheaus/common';
import { createContext } from 'react';

export interface ControllersContextProps {
  isConnected: boolean;
  controllers: Map<string, AnyObject>;
  // invokeAction(action: InvokeActionMessage): Promise<unknown>;
  // listenForUpdates(listenerId: string, callback: (value: unknown) => void): (hashes: string[]) => void;
}

export const ControllersContext = createContext<ControllersContextProps>({
  isConnected: false,
  controllers: new Map(),
  // invokeAction: () => Promise.reject(new Error('SocketControllersContext not initialized')),
  // listenForUpdates: () => () => void 0,
});

// export const ControllersConnectionContext = createContext<boolean>(false);
