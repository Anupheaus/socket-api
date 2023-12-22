import type { ControllerInstance } from './CommonControllerModels';

export type ToControllerTypes<R extends ControllerInstance[]> = R;

// export function createControllerTypes<R extends InstanceType<Controller>[]>(): R {
//   return {} as R;
// }