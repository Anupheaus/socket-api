import { MapOf } from '@anupheaus/common';
import { ControllerConfig } from '../server/ControllerModels';

export function createControllerTypes<R extends ControllerConfig[]>(): R {
  return {} as R;
}