import { Logger } from '@anupheaus/common';
import { Socket } from 'socket.io';
import { SocketServerError } from '../common';
import { InvokeActionMessage } from '../common/internalSocketsModels';
import { createLogger } from '../common/logger';
import { ControllerActionRequest, ControllerState, InternalControllerConfig } from './ControllerModels';
import { executeWithControllerState } from './ControllerState';

const logger = createLogger('SocketServerClient');

interface QueryActionState {
  action: InvokeActionMessage;
  responseHash: string;
}

interface Props {
  connection: Socket;
  controllers: InternalControllerConfig[];
  onLoadState?(state: ControllerState, client: Socket): ControllerState;
  onSaveState?(state: ControllerState, client: Socket): ControllerState;
}

export class SocketServerClient {
  constructor(props: Props) {
    const { connection } = props;
    this.#props = props;
    this.#logger = logger.createSubLogger(connection.id);
    this.#logger.info('Client instance created');
    this.#queryActions = new Map();

    this.#onEvent<ControllerActionRequest>('action', this.#handleAction.bind(this));
  }

  #props: Props;
  #logger: Logger;
  #queryActions: Map<string, QueryActionState>;
  #clientState: ControllerState | undefined;

  #getOrCreateState(): ControllerState {
    if (this.#clientState) return this.#clientState;
    const { connection, onLoadState } = this.#props;
    let controllerState = {
      IPAddress: connection.handshake.address,
      url: connection.handshake.headers.referer ?? connection.handshake.headers.origin ?? connection.handshake.headers.host ?? connection.handshake.url,
      token: connection.handshake.auth.token,
    };
    if (onLoadState) controllerState = onLoadState(controllerState, connection);
    this.#clientState = controllerState;
    return controllerState;
  }

  #onEvent<T>(eventName: string, delegate: (payload: T) => Promise<unknown>): void {
    const { connection } = this.#props;
    connection.on(eventName, async (payload: T) => {
      const state = this.#getOrCreateState();
      const originalState = Object.clone(state);
      executeWithControllerState(state, async () => {
        await delegate(payload);
        if (state.token !== originalState.token) this.#handleTokenChanged(state.token);
      });
    });
  }

  #handleTokenChanged(token: string | undefined) {
    const { connection } = this.#props;
    this.#logger.debug('Token changed, updating client', { token });
    connection.emit('updateToken', token);
  }

  #handleAction(payload: ControllerActionRequest) {
    const { controllers } = this.#props;
    const { controllerName, functionName, args } = payload;
    const controller = controllers.find(({ name }) => name === controllerName);
    if (!controller) throw new SocketServerError(`No controller found with controller name "${controllerName}".  Have you included this controller in the createSocketApiServer?`);
    const action = controller.functions[functionName](...args);
    if (!action) throw new SocketServerError(`No action found with name "${functionName}".  Have you created this action?`);
    return action(...args);
  }

  // public async processMutation(controllerIds: string[]) {
  //   this.#logger.debug('Processing mutation', { controllerIds, attachedQueries: this.#queryActions.size });
  //   this.#queryActions.forEach(async queryAction => {
  //     const { action, responseHash } = queryAction;
  //     try {
  //       this.#logger.silly('Processing mutation against action', { action, responseHash });
  //       if (!controllerIds.includes(action.controllerId)) return;
  //       this.#logger.silly('Reinvoking query action');
  //       const { response } = this.#invokeAction(action);
  //       const result = await response;
  //       const newResponseHash = Object.hash({ response: result });
  //       this.#logger.silly('Comparing response hashes', { newResponseHash, responseHash });
  //       if (newResponseHash === responseHash) return;
  //       this.#logger.silly('Updating the query action', { hash: action.hash });
  //       queryAction.responseHash = newResponseHash;
  //       this.#logger.silly('Updating the client', { hash: action.hash });
  //       this.#updateClient(action.hash, result);
  //     } catch (error) {
  //       this.#logger.error('Error processing mutation', { error, action: action });
  //     }
  //   });
  // }

  // async #getOrCreateClientState() {
  //   if (this.#clientState) return this.#clientState;
  //   const { connection, modifyControllerClientState } = this.#props;
  //   let clientState: SocketControllerClientState = {
  //     IPAddress: connection.handshake.address,
  //     url: connection.handshake.headers.referer ?? connection.handshake.headers.origin ?? connection.handshake.headers.host ?? connection.handshake.url,
  //     token: connection.handshake.auth.token,
  //   };
  //   clientState = await modifyControllerClientState?.(clientState, connection) ?? clientState;
  //   this.#clientState = clientState;
  //   return clientState;
  // }

  // #invokeAction(action: InvokeActionMessage) {
  //   const { controllers } = this.#props;
  //   logger.debug('Invoking Action', { action });
  //   const api = controllers.get(action.controllerId);
  //   if (!api) throw new SocketServerError(`No controller found with controller id "${action.controllerId}".  Have you registered this controller?`);
  //   return api.invokeAction(action);
  // }

  // async #processQuery(action: InvokeActionMessage, response: Promise<unknown>) {
  //   try {
  //     const result = await response;
  //     const responseHash = Object.hash({ response: result });
  //     this.#queryActions.set(action.hash, { action, responseHash });
  //   } catch (error) {
  //     this.#logger.error('Error processing action query', { error, action, response });
  //   }
  // }

  // #updateClient(hash: string, response: unknown) {
  //   this.#logger.debug('Updating Client', { hash });
  //   this.#props.connection.emit('updateClient', { hash, response });
  // }

  // #convertControllerNamesToIds(controllerNames: string[]) {
  //   const { controllers } = this.#props;
  //   const allControllers = controllers.toValuesArray();
  //   return controllerNames
  //     .map(controllerName => {
  //       const controller = allControllers.find(({ className }) => className === controllerName);
  //       if (!controller) {
  //         this.#logger.error(`No controller found with name "${controllerName}".  Have you registered this controller?`);
  //         return;
  //       }
  //       return controller.controllerId;
  //     })
  //     .removeNull();
  // }

  // async #processMutation(action: InvokeActionMessage, mutationResponse: Promise<unknown>, { alsoMutates }: MutationDecorator) {
  //   try {
  //     await mutationResponse; // wait for mutation to complete
  //     const controllerIds = [action.controllerId, ...this.#convertControllerNamesToIds(alsoMutates)].distinct();
  //     this.#props.onMutation(controllerIds);
  //   } catch (error) {
  //     this.#logger.error('Error processing an internal controller mutation', { error, action });
  //   }
  // }

  // #processDecorators(decorators: Decorators, action: InvokeActionMessage, response: Promise<unknown>) {
  //   decorators.forEach(async decorator => {
  //     switch (decorator.type) {
  //       case 'query': this.#processQuery(action, response); break;
  //       case 'mutation': this.#processMutation(action, response, decorator); break;
  //     }
  //   });
  // }

  // #handleTokenChanged(token: string | undefined) {
  //   const { connection } = this.#props;
  //   this.#logger.debug('Token changed, updating client', { token });
  //   connection.emit('updateToken', token);
  // }

  // #serialiseError(error: unknown): SocketControllerSerialisedError {
  //   const actualError = error instanceof Error ? error : typeof (error) === 'string' ? new Error(error) : new SocketServerError('Unknown error', { error });
  //   return {
  //     errorClassName: actualError.constructor.name,
  //     serialisedError: actualError,
  //     title: actualError.name,
  //     message: actualError.message,
  //   };
  // }

  // #handleInvokeAction() {
  //   return async (action: InvokeActionMessage, callback: (result: InvokeActionMessageResponse, error?: SocketControllerSerialisedError) => void): Promise<void> => {
  //     try {
  //       this.#logger.info('Action invoke request', { action });
  //       const clientState = await this.#getOrCreateClientState();
  //       const originalToken = clientState.token;
  //       this.#logger.debug('Created client state', { clientState });
  //       await SocketClientController.run(clientState, async () => {
  //         const { response: awaitableResponse, decorators } = this.#invokeAction(action);
  //         this.#logger.debug('Action invoked, processing decorators', { action, decorators });
  //         this.#processDecorators(decorators, action, awaitableResponse);
  //         const canBeCached = !decorators.some(decorator => decorator.type === 'mutation'); // do not cache if a mutation
  //         this.#logger.debug('Responding to client', { action });
  //         const response = await awaitableResponse;
  //         if (clientState.token !== originalToken) this.#handleTokenChanged(clientState.token);
  //         callback({ response, canBeCached });
  //         this.#logger.info('Action successfully invoked', { action });
  //       });
  //     } catch (error) {
  //       this.#logger.error('Error invoking action', { error, action });
  //       callback({ response: undefined, canBeCached: false }, this.#serialiseError(error));
  //     }
  //   };
  // }
}