import { is, Logger, PromiseMaybe } from '@anupheaus/common';
import { createLogger } from '../common/logger';
import { Socket } from 'socket.io';
import { SocketAPIError } from '../common';
import { executeWithContext, SocketApiContext } from './context';
import type { ControllerContext, ServerControllerMetadataMap } from './ServerControllerModels';
import type { SocketApiServer } from './SocketApiServer';

const logger = createLogger('SocketServerClient');

interface QueryRequestMetadata {
  queryHash: string;
  instanceId: string;
  invoke(): Promise<void>;
}

interface Props {
  server: SocketApiServer;
  connection: Socket;
  metadata: ServerControllerMetadataMap;
  onLoadContext(state: ControllerContext, client: Socket): PromiseMaybe<ControllerContext>;
  onSaveContext(state: ControllerContext, client: Socket): PromiseMaybe<ControllerContext>;
}

export class SocketApiClient {
  constructor(props: Props) {
    const { connection } = props;
    this.#props = props;
    this.#logger = logger.createSubLogger(connection.id);
    this.#queries = new Map();
    this.#logger.info('Client instance created', { connectionId: connection.id });
    const origin = connection.client.conn.request.headers.origin ?? connection.handshake.headers.origin;
    this.#url = origin != null ? new URL(origin) : new URL('');

    /** Setup listener */
    this.#startListening();

    /** Send metadata */
    this.#sendMetadata();
  }

  #props: Props;
  #logger: Logger;
  #queries: Map<string, Map<string, QueryRequestMetadata>>;
  #url: URL;

  async #createContext(): Promise<SocketApiContext> {
    const { server, connection, onLoadContext } = this.#props;
    const token = connection.handshake.auth.token ?? connection.handshake.headers.authorization?.toLowerCase()?.replace('bearer ', '');
    return {
      server,
      client: this,
      controllerContext: await onLoadContext({
        token,
      }, connection),
    };
  }

  async #saveContext(context: SocketApiContext): Promise<SocketApiContext> {
    const { connection, onSaveContext } = this.#props;
    return {
      ...context,
      controllerContext: await onSaveContext(context.controllerContext, connection),
    };
  }

  #startListening(): void {
    const { connection } = this.#props;
    connection.onAny(this.#executeApiRequest.bind(this));
  }

  #sendMetadata(): void {
    const { connection, metadata } = this.#props;
    connection.emit('metadata', metadata.toValuesArray());
  }

  #handleTokenChanged(token: string | undefined) {
    const { connection } = this.#props;
    this.#logger.debug('Token changed, updating client', { token });
    connection.emit('updateToken', token);
  }

  #emit(eventName: string, payload: unknown): void {
    this.#logger.silly('Sending to client', { eventName, payload });
    this.#props.connection.emit(eventName, payload);
  }

  async #execute(func: () => Promise<void>): Promise<void> {
    const context = await this.#createContext();
    const originalContext = Object.clone(context);
    await executeWithContext(context, async () => {
      await func();
      const updatedContext = await this.#saveContext(context);
      if (originalContext.controllerContext.token !== updatedContext.controllerContext.token) this.#handleTokenChanged(updatedContext.controllerContext.token);
    });
  }

  async #executeApiRequest(eventName: string, ...args: unknown[]): Promise<void> {
    const { metadata } = this.#props;
    const eventMetadata = metadata.get(eventName);
    if (!eventMetadata) throw new SocketAPIError({ message: `No metadata found for event "${eventName}"`, meta: { eventName, args } });
    const func = eventMetadata.invoke;
    const response = is.function(args[args.length - 1]) ? args.pop() : undefined;
    await this.#execute(async () => {
      this.#logger.debug('Received API request from client', { eventName, args, withAck: is.function(response) });
      const result = await func({
        client: this,
        args,
        send: (payload: unknown, modifyEventName: ((eventName: string) => string) = name => name) => this.#emit(modifyEventName(eventName), payload),
      });
      if (is.function(response)) response(result);
    });
  }

  public registerQueryRequest(metadata: QueryRequestMetadata): void {
    const hashes = this.#queries.get(metadata.instanceId) ?? new Map<string, QueryRequestMetadata>();
    this.#queries.set(metadata.instanceId, hashes);
    if (hashes.has(metadata.queryHash)) return;
    hashes.set(metadata.queryHash, metadata);
  }

  public unregisterQueryRequest(instanceId: string, hash: string): void {
    const hashes = this.#queries.get(instanceId);
    if (!hashes || !hashes.has(hash)) return;
    hashes.delete(hash);
    if (hashes.size === 0) this.#queries.delete(instanceId);
  }

  public async processQueries(instanceId: string): Promise<void> {
    const hashes = this.#queries.get(instanceId);
    if (!hashes) return;
    return this.#execute(async () => { await Promise.allSettled(Array.from(hashes.values()).map(({ invoke }) => invoke())); });
  }

  public get IPAddress() { return this.#props.connection.handshake.address; }

  public get url() { return this.#url; }

}