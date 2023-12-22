import { useControllers as useControllersProvider } from './ControllersProvider/useControllers';

export function useControllers() {
  const { isConnected } = useControllersProvider();
  return {
    isConnected,
  };
}