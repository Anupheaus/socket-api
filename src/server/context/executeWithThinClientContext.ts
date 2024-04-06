import { ControllerContext } from '../ServerModels';
import { InternalServer } from '../ServerServer';
import { contextAsyncStorage } from './contextAsyncStorage';

export function executeWithThinClientContext<T, C extends ControllerContext>(server: InternalServer, context: C, delegate: () => T): T {
  return contextAsyncStorage.run({
    client: {
      IPAddress: 'localhost',
      url: new URL('http://localhost'),
      emit: server.emit,
      addRecordIds: () => void 0,
      replaceAndUpdateToNewRecordsOnly: (_, records) => records,
    },
    context,
  }, delegate);
}
