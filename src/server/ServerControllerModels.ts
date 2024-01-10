import { ControllerMetadata } from '../common';
import { ControllerResponse } from './ControllerModelsInternal';
import { SocketApiClient } from './SocketApiClient';

export interface ControllerRequest {
  IPAddress: string;
  url: URL;
}

export interface ControllerContext {
  token: string;
}

export type ControllerActionResponse<T = undefined> = ControllerResponse<'action'> & T;
export type ControllerEffectResponse<T = undefined> = ControllerResponse<'effect'> & T;
export type ControllerQueryResponse<T = undefined> = ControllerResponse<'query'> & T;
export type ControllerEventResponse<T = undefined> = ControllerResponse<'event'> & T;

export type ControllerFunctionResponse<T = void> = ControllerActionResponse<T> | ControllerEffectResponse<T> | ControllerQueryResponse<T> | ControllerEventResponse<T>;

export interface ControllerRespond {
  asAction<R>(response?: R): ControllerActionResponse<R>;
  asQuery<R>(response?: R): ControllerQueryResponse<R>;
  asEffect<R>(response?: R): ControllerEffectResponse<R>;
  asEvent<R>(response?: R): ControllerEventResponse<R>;
}

export interface ProxiedInstanceOfController {
  name: string;
  invoke<T>(functionName: string, ...args: unknown[]): Promise<T>;
}

export interface ServerControllerMetadataInvokeProps {
  client: SocketApiClient;
  args: unknown[];
  send(value: unknown, modifyEventName?: (eventName: string) => string): void;
}

export interface ServerControllerMetadata extends ControllerMetadata {
  invoke(props: ServerControllerMetadataInvokeProps): Promise<unknown>;
}

export type ServerControllerMetadataMap = Map<string, ServerControllerMetadata>;
