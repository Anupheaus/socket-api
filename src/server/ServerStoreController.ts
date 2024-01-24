import { Record, Upsertable } from '@anupheaus/common';
import { ServerControllerContext } from './ServerModels';
import { StoreRequest, StoreResponse } from '../common';
import { Controller } from './ServerController';

export { StoreRequest, StoreResponse };

export abstract class StoreController<RecordType extends Record = Record, ContextType extends ServerControllerContext = ServerControllerContext> extends Controller<ContextType> {

  protected abstract handleRequest(request: StoreRequest<RecordType>): Promise<StoreResponse<RecordType>>;

  protected abstract handleUpsert(record: Upsertable<RecordType>): Promise<RecordType>;

  protected abstract handleRemove(id: string): Promise<void>;

  protected abstract handleGet(id: string): Promise<RecordType | undefined>;

}