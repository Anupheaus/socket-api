import { AnyObject } from '@anupheaus/common';
import { createContext } from 'react';
import { ClientStoreController } from './createClientStores';

export interface ControllersContextProps {
  isConnected: boolean;
  controllers: Map<string, AnyObject>;
  stores: Map<string, ClientStoreController>;
}

export const ControllersContext = createContext<ControllersContextProps>({
  isConnected: false,
  controllers: new Map(),
  stores: new Map(),
});

// export const ControllersConnectionContext = createContext<boolean>(false);
