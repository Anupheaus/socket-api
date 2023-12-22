import { Socket } from 'socket.io-client';
import { ControllerQuerySubscription, ControllerQueryUpdate, SocketAPIError } from '../../../common';
import { Logger } from '@anupheaus/common';

export interface QueryState {
  response: unknown;
  error: SocketAPIError | undefined;
  isLoading: boolean;
}

interface HookConfig {
  id: string;
  payload: unknown[];
  hash: string;
  eventName: string;
  stateUpdate: (state: QueryState) => void;
}

interface Props {
  getSocket(): Promise<Socket>;
  logger: Logger;
}

export class QueryManager {
  constructor(props: Props) {
    this.#props = props;
    this.#configByHash = new Map();
    this.#configByHookId = new Map();
    this.#cacheByHash = new Map();
    this.#boundHandleUpdate = this.#handleUpdate.bind(this);
  }

  #props: Props;
  #configByHash: Map<string, HookConfig[]>;
  #configByHookId: Map<string, HookConfig>;
  #cacheByHash: Map<string, QueryState>;
  #boundHandleUpdate: (update: ControllerQueryUpdate) => void;

  public registerQueryHook(config: HookConfig): void {
    const existingConfig = this.#configByHookId.get(config.id);
    if (existingConfig) {
      if (existingConfig.hash === config.hash) return;
      this.unregisterQueryHook(config.id);
    }
    this.#configByHookId.set(config.id, config);
    const hooks = this.#configByHash.get(config.hash) ?? [];
    this.#configByHash.set(config.hash, hooks);
    hooks.push(config);
    if (hooks.length === 1) this.#subscribe(config);
    const previousState = this.#cacheByHash.get(config.hash);
    if (previousState) config.stateUpdate(previousState);
  }

  public unregisterQueryHook(id: string): void {
    const config = this.#configByHookId.get(id);
    if (!config) return;
    this.#configByHookId.delete(id);
    let configs = this.#configByHash.get(config.hash);
    if (!configs) return;
    configs = configs.filter(innerConfig => innerConfig.id !== id);
    this.#configByHash.set(config.hash, configs);
    if (configs.length > 0) return;
    this.#configByHash.delete(config.hash);
    this.#unsubscribe(config);
  }

  async #subscribe({ eventName, hash, payload }: HookConfig): Promise<void> {
    const socket = await this.#props.getSocket();
    socket.on(`${eventName}.${hash}`, this.#boundHandleUpdate);
    socket.emit(eventName, { query: { hash, action: 'subscribe' }, payload } as ControllerQuerySubscription);
  }

  async #unsubscribe({ eventName, hash }: HookConfig): Promise<void> {
    const socket = await this.#props.getSocket();
    socket.off(`${eventName}.${hash}`, this.#boundHandleUpdate);
    socket.emit(eventName, { query: { hash, action: 'unsubscribe' } } as ControllerQuerySubscription);
  }

  #handleUpdate({ queryHash, results }: ControllerQueryUpdate): void {
    const state = { response: results, error: undefined, isLoading: false };
    this.#cacheByHash.set(queryHash, state);
    const hooks = this.#configByHash.get(queryHash) ?? [];
    hooks.forEach(hook => hook.stateUpdate(state));
  }

}