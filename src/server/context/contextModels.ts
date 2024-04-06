import { Record } from '@anupheaus/common';
import { ControllerContext } from '../ServerModels';

export interface ClientContext {
  IPAddress: string;
  url: URL;
  emit(eventName: string, payload: unknown): void;
  addRecordIds(controllerName: string, recordIds: string[]): void;
  replaceAndUpdateToNewRecordsOnly<T extends Record = Record>(controllerName: string, records: T[]): (string | T)[];
}

export interface Context {
  client: ClientContext;
  context: ControllerContext;
}