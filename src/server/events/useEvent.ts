import type { SocketAPIEvent } from '../../common';
import { eventPrefix } from '../../common/internalModels';
import { useClient } from '../providers';

export function useEvent<T>(event: SocketAPIEvent<T>) {
  const { client } = useClient();
  return (payload: T) => client.emitWithAck(`${eventPrefix}.${event.name}`, payload);
}