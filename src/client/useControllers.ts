import { useContext } from 'react';
import { Contexts } from './ClientContext';

export function useControllers() {

  return {
    get isConnected() {
      const { isConnected } = useContext(Contexts.Controllers);
      return isConnected;
    },
    get token() {
      return useContext(Contexts.Token);
    },
  };
}