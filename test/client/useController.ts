import { ControllerTypes } from '../common';

export function useController<K extends keyof typeof ControllerTypes>(name: K): typeof ControllerTypes[K] {
  return ControllerTypes[name];
}
