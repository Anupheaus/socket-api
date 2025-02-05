import type { SocketAPIEvent } from '../../common';
import { eventPrefix } from '../../common/internalModels';
import { useSocketAPI } from '../providers';


export function useEvent<T>(event: SocketAPIEvent<T>) {
  const { getClient } = useSocketAPI();

  return (payload: T) => {
    const client = getClient(true);
    client.emitWithAck(`${eventPrefix}.${event.name}`, payload);
  };
}