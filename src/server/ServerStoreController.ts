import { DataRequest, DataResponse, Record, Upsertable } from '@anupheaus/common';
import { ControllerContext, StoreControllerUpsertResponse } from './ServerModels';
import { Controller } from './ServerController';
import { getContext } from './context';

export { StoreControllerUpsertResponse };

export abstract class StoreController<RecordType extends Record = Record, ContextType extends ControllerContext = ControllerContext> extends Controller<ContextType> {

  protected static addExposedMembers(): string[] {
    return ['storeGetRecords', 'storeUpsert', 'storeRemove', 'storeRequest'];
  }

  protected abstract handleRequest(request?: DataRequest<RecordType>): Promise<DataResponse<RecordType>>;

  protected abstract handleUpsert(record: Upsertable<RecordType>): Promise<StoreControllerUpsertResponse<RecordType>>;

  protected abstract handleRemove(id: string): Promise<void>;

  protected pushToClient(records: RecordType[]): void {
    this.server.broadcastStoreUpdates(this.name, [{ action: 'push', records }]);
  }

  /* @ts-expect-error unused declaration */
  private async storeGetRecords(ids: string[]): Promise<RecordType[]> {
    const { client } = getContext();
    const response = await this.handleRequest({ filters: { id: { $in: ids } } } as DataRequest<RecordType>);
    const records = response.data;
    client.addRecordIds(this.name, records.ids());
    return records;
  }

  /* @ts-expect-error unused declaration */
  private async storeRequest(request?: DataRequest<RecordType>): Promise<DataResponse<RecordType | string>> {
    const response = await this.handleRequest(request);
    const { client } = getContext();
    const data = client.replaceAndUpdateToNewRecordsOnly(this.name, response.data);

    return {
      ...request?.pagination,
      ...response,
      data,
    };
  }

  /* @ts-expect-error unused declaration */
  private async storeUpsert(record: Upsertable<RecordType>): Promise<RecordType> {
    const { record: updatedRecord, isNew } = await this.handleUpsert(record);
    this.server.broadcastStoreUpdates(this.name, [{ action: isNew ? 'create' : 'update', record: updatedRecord }]);
    return updatedRecord;
  }

  /* @ts-expect-error unused declaration */
  private async storeRemove(id: string): Promise<void> {
    await this.handleRemove(id);
    this.server.broadcastStoreUpdates(this.name, [{ action: 'remove', record: id }]);
  }

}
