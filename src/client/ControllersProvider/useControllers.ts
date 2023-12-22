import { useContext } from 'react';
import { ControllersContext } from './ControllersContext';

export function useControllers() {
  return useContext(ControllersContext);
}
