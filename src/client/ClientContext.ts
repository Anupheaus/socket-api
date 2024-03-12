import { AnyObject } from '@anupheaus/common';
import { createContext } from 'react';

export interface ControllersContextProps {
  isConnected: boolean;
  controllers: Map<string, AnyObject>;
}

export const Contexts = {
  Controllers: createContext<ControllersContextProps>({
    isConnected: false,
    controllers: new Map(),
  }),
  Token: createContext<string | undefined>(undefined),
};