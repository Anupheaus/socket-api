import { useContext } from 'react';
import { SocketControllersConnectionContext } from './SocketControllersContext';

export function useSocketControllers() {
  const isConnected = useContext(SocketControllersConnectionContext);

  return {
    isConnected,
  };
}