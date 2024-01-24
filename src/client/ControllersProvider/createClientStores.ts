import { Logger, Record } from '@anupheaus/common';
import { ControllerMetadata, SocketAPIError } from '../../common';
import { Socket } from 'socket.io-client';

interface Props {
  metadata: ControllerMetadata[];
  logger: Logger;
  getSocket(): Promise<Socket>;
}

export function createClientStores({ metadata, getSocket }: Props) {
  const stores = new Map(metadata.map(({ name, isStore }) => {
    if (!isStore) return;
    return [name, new ClientStoreController({ name, getSocket })] as const;
  }).removeNull());
  (window as any).stores = stores;
  return stores;
}


interface StoreProps {
  name: string;
  getSocket(): Promise<Socket>;
}

export class ClientStoreController {
  constructor(props: StoreProps) {
    this.#records = new Map();
    this.#props = props;
  }

  #records: Map<string, Record>;
  #props: StoreProps;

  public get records() {
    return this.#records.toValuesArray();
  }

  public async updateRecords<T extends Record>(records: T[] | T): Promise<void> {
    if (!(records instanceof Array)) records = [records];
    records.forEach(record => this.#records.set(record.id, record));
  }

  public removeRecords(ids: string[] | string): void {
    if (!(ids instanceof Array)) ids = [ids];
    ids.forEach(id => this.#records.delete(id));
  }

  public async getRecord<T extends Record>(id: string): Promise<T | undefined> {
    const records = await this.getRecords([id]);
    return records?.[0] as T | undefined;
  }

  public async getRecords<T extends Record>(ids: string[]): Promise<T[] | undefined> {
    const missingRecordIds = ids.filter(id => !this.#records.has(id));
    if (missingRecordIds.length > 0) {
      const records = await this.#serverInvoke<T[] | undefined>('getRecords', missingRecordIds);
      const retrievedRecordIds = (records ?? []).ids();
      if (retrievedRecordIds.length !== missingRecordIds.length) {
        const notRetrievedRecordIds = missingRecordIds.filter(id => !retrievedRecordIds.includes(id));
        throw new SocketAPIError({ message: `Failed to get records for ids: ${notRetrievedRecordIds.join(', ')}` });
      }
      await this.updateRecords(records!);
    }
    return ids.map(id => this.#records.get(id)).removeNull() as T[];
  }

  public createFunctions() {

  }

  async #serverInvoke<R>(name: string, ...args: unknown[]): Promise<R> {
    const socket = await this.#props.getSocket();
    return socket.emitWithAck(`${this.#props.name}.${name}`, ...args);
  }
}