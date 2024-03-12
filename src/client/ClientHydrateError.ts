import { AnyObject, is } from '@anupheaus/common';
import { SocketAPIError } from '../common';

export function hydrateError(error: AnyObject | undefined): SocketAPIError | undefined {
  if (!is.plainObject(error)) return;
  if (error.name === 'SocketAPIError') return new SocketAPIError(error);
}