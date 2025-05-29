import type { SocketAPIAction } from '../../common';
import { actionPrefix } from '../../common/internalModels';
import type { SocketAPIServerHandlerFunction } from '../handler';
import { createServerHandler } from '../handler';

export type SocketAPIServerAction = () => void;

type SocketAPIServerActionHandler<Request, Response> = SocketAPIServerHandlerFunction<Request, Response>;

export function createServerAction<Name extends string, Request, Response>(action: SocketAPIAction<Name, Request, Response>, handler: SocketAPIServerActionHandler<Request, Response>): SocketAPIServerAction {
  return createServerHandler('action', actionPrefix, action.name, handler);
}
