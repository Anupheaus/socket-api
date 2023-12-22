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

export type ControllerActionResponse<T = void> = ControllerResponse<'action'> & T;
export type ControllerEffectResponse<T = void> = ControllerResponse<'effect'> & T;
export type ControllerQueryResponse<T = void> = ControllerResponse<'query'> & T;
export type ControllerEventResponse<T = void> = ControllerResponse<'event'> & T;

export type ControllerFunctionResponse<T = void> = ControllerActionResponse<T> | ControllerEffectResponse<T> | ControllerQueryResponse<T> | ControllerEventResponse<T>;

export interface ControllerRespond {
  asAction<R = void>(response: R | void): ControllerActionResponse<R>;
  asQuery(): ControllerQueryResponse;
  asQuery<R>(response: R): ControllerQueryResponse<R>;
  asEffect(): ControllerEffectResponse;
  asEffect<R>(response: R): ControllerEffectResponse<R>;
  asEvent<R = void>(response: R | void): ControllerEventResponse<R>;
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
