export const ClientServerControllerId = Symbol('ClientServerControllerId');

export interface InvokeActionMessage {
  controllerId: string;
  methodName: string;
  args: any[];
  hash: string;
}

export interface InvokeActionMessageResponse {
  response: unknown;
  canBeCached: boolean;
}
