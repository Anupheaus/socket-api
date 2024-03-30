import { is, Logger, PromiseMaybe, Record } from '@anupheaus/common';
import { createLogger } from '../common/CommonLogger';
import { Socket } from 'socket.io';
import { ControllerMethodMetadata, SocketAPIError, StoreControllerUpdate } from '../common';
import { executeWithContext, Context } from './context';
import type { ControllerContext, ControllerMetadata } from './ServerModels';
import type { Server } from './ServerServer';

const logger = createLogger('SocketServerClient');

interface Props {
  server: Server;
  connection: Socket;
  metadata: Map<string, ControllerMetadata>;
  onLoadContext(state: ControllerContext, client: Socket): PromiseMaybe<ControllerContext>;
  onSaveContext(state: ControllerContext, client: Socket): PromiseMaybe<ControllerContext>;
  onHydrateArgs(args: unknown[], metadata: ControllerMethodMetadata): PromiseMaybe<unknown[]>;
}

export class Client {
  constructor(props: Props) {
    const { connection } = props;
    this.#props = props;
    this.#logger = logger.createSubLogger(connection.id);
    this.#logger.info('Client instance created', { connectionId: connection.id });
    this.#url = this.#generateUrl();
    this.#recordIds = new Map();

    /** Setup listener */
    this.#startListening();

    /** Send metadata */
    this.#sendMetadata();
  }

  #props: Props;
  #logger: Logger;
  #url: URL;
  #context?: Context;
  #recordIds: Map<string, string[]>;

  public emit(eventName: string, payload: unknown): void {
    this.#logger.silly('Sending to client', { eventName, payload });
    this.#props.connection.emit(eventName, payload);
  }

  #generateUrl(): URL {
    const { connection } = this.#props;
    const host = connection.handshake.headers.host ?? connection.request.headers.host ?? connection.client.request.headers.host;
    const protocol = connection.handshake.secure ? 'wss' : 'ws';
    const url = connection.handshake.url ?? connection.request.url ?? connection.client.request.url;
    const origin = connection.handshake.headers.origin ?? connection.handshake.headers.referer ?? connection.request.headers.origin ?? connection.client.request.headers.origin ?? `${protocol}://${host}`;
    return new URL(url, origin);
  }

  async #getOrCreateContext(): Promise<Context> {
    if (this.#context) return this.#context;
    const { server, connection, onLoadContext } = this.#props;
    const token = connection.handshake.auth.token ?? connection.handshake.headers.authorization?.toLowerCase()?.replace('bearer ', '');
    this.#context = {
      server,
      client: this,
      context: await onLoadContext({
        token,
      }, connection),
    };
    return this.#context;
  }

  async #saveContext(context: Context): Promise<Context> {
    const { connection, onSaveContext } = this.#props;
    return {
      ...context,
      context: await onSaveContext(context.context, connection),
    };
  }

  #startListening(): void {
    const { connection } = this.#props;
    connection.onAny(this.#executeApiRequest.bind(this));
  }

  #sendMetadata(): void {
    const { connection, metadata } = this.#props;
    const simpleMetdata = metadata.toValuesArray().map(({ methods, ...rest }) => ({ ...rest, methods: methods.toValuesArray() }));
    connection.emit('metadata', simpleMetdata);
  }

  #handleTokenChanged(token: string | undefined) {
    const { connection } = this.#props;
    this.#logger.debug('Token changed, updating client', { token });
    connection.emit('updateToken', token);
  }

  async #execute(func: () => Promise<void>): Promise<void> {
    const context = await this.#getOrCreateContext();
    const originalContext = Object.clone(context);
    await executeWithContext(context, async () => {
      await func();
      const updatedContext = await this.#saveContext(context);
      if (originalContext.context.token !== updatedContext.context.token) this.#handleTokenChanged(updatedContext.context.token);
      this.#context = updatedContext;
    });
  }

  async #executeApiRequest(eventName: string, ...rawArgs: unknown[]): Promise<void> {
    const { metadata } = this.#props;
    const eventNameParts = eventName.split('.');
    if (eventNameParts.length < 2) throw new SocketAPIError({ message: `Invalid event name "${eventName}"`, meta: { eventName, args: rawArgs } });
    const [instanceName, methodName] = eventNameParts;
    const instanceMetadata = metadata.get(instanceName);
    if (instanceMetadata == null) throw new SocketAPIError({ message: `No instance metadata found for event "${eventName}"`, meta: { eventName, args: rawArgs } });
    const eventMetadata = instanceMetadata.methods.get(methodName);
    if (eventMetadata == null) throw new SocketAPIError({ message: `No method metadata found for event "${eventName}"`, meta: { eventName, args: rawArgs } });
    const args = await this.#props.onHydrateArgs(rawArgs, eventMetadata);
    const func = eventMetadata.invoke;
    const response = is.function(args[args.length - 1]) ? args.pop() : undefined;
    await this.#execute(async () => {
      this.#logger.debug('Received API request from client', { eventName, args, withAck: is.function(response) });
      try {
        const result = await func(...args);
        if (is.function(response)) response(result);
      } catch (e) {
        const error = new SocketAPIError({ error: e });
        this.#logger.error('Error executing API request', { eventName, args, error });
        if (is.function(response)) response({ error });
      }
    });
  }

  public get IPAddress() { return this.#props.connection.handshake.address; }

  public get url() { return this.#url; }

  public addRecordIds<T extends Record>(controllerName: string, recordsOrIds: (T | string)[]): void {
    const currentIds = this.#recordIds.get(controllerName) ?? [];
    const ids = recordsOrIds.map(recordOrId => typeof (recordOrId) === 'string' ? recordOrId : recordOrId.id);
    this.#recordIds.set(controllerName, [...currentIds, ...ids].distinct());
  }

  public replaceAndUpdateToNewRecordsOnly<T extends Record>(controllerName: string, records: T[]): (T | string)[] {
    const recordIds = this.#recordIds.get(controllerName) ?? [];
    this.addRecordIds(controllerName, records);
    return records.map(record => recordIds.includes(record.id) ? record.id : record);
  }

  public removeRecordIds(controllerName: string, ids: string[]): void {
    const currentIds = this.#recordIds.get(controllerName) ?? [];
    this.#recordIds.set(controllerName, currentIds.filter(id => !ids.includes(id)));
  }

  public broadcastStoreUpdates(storeName: string, updates: StoreControllerUpdate[]): void {
    const recordIds = this.#recordIds.get(storeName)!;
    if (recordIds == null) return;
    const usefulUpdates = updates.filter(update => {
      switch (update.action) {
        case 'remove': {
          if (!recordIds.includes(update.record)) return false;
          recordIds.remove(update.record);
          return true;
        }
        case 'push': {
          update.records = update.records.filter(record => !recordIds.includes(record.id));
          if (update.records.length === 0) return false;
          this.addRecordIds(storeName, update.records);
          recordIds.push(...update.records.ids());
          return true;
        }
        default: {
          this.addRecordIds(storeName, [update.record]);
          recordIds.push(update.record.id);
          return true;
        }
      }
    });
    if (usefulUpdates.length === 0) return;
    this.emit(`${storeName}.storeUpdate`, usefulUpdates);
  }

}