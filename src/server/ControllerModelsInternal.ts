export const ControllerResponseType = Symbol('ControllerResponseType');

export interface ControllerResponse<K extends 'query' | 'event' | 'effect' | 'action'> {
  [ControllerResponseType]: {
    type: K;
  };
}
