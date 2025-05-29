import type { SocketAPISubscription } from '../../common';
import type { SocketAPISubscriptionRequest, SocketAPISubscriptionResponse } from '../../common/internalModels';
import { subscriptionPrefix } from '../../common/internalModels';
import type { SocketAPIServerHandlerFunction } from '../handler';
import { createServerHandler } from '../handler';
import { useSocketAPI } from '../providers';

export type SocketAPIServerSubscriptionAction = 'subscribe' | 'unsubscribe';

export interface SocketAPIServerSubscriptionHandlerParameters<Request, Response> {
  request: Request;
  subscriptionId: string;
  update(response: Response): void;
  onUnsubscribe(handler: () => void): void;
}

export type SocketAPIServerSubscriptionHandler<Request, Response> = SocketAPIServerHandlerFunction<SocketAPIServerSubscriptionHandlerParameters<Request, Response>, Response>;

export type SocketAPIServerSubscription = () => void;

const onUnsubscribeHandlers = new Map<string, () => void>();

export function createServerSubscription<Name extends string, Request, Response>(subscription: SocketAPISubscription<Name, Request, Response>,
  handler: SocketAPIServerSubscriptionHandler<Request, Response>): SocketAPIServerSubscription {
  return createServerHandler<SocketAPISubscriptionRequest<Request>, SocketAPISubscriptionResponse<Response>>('subscription', subscriptionPrefix,
    subscription.name, async props => {
      switch (props.action) {
        case 'subscribe': {
          const { request, subscriptionId } = props;
          const update = async (response: Response) => {
            const { getClient } = useSocketAPI();
            const client = getClient(true);
            await client.emitWithAck(`${subscriptionPrefix}.${subscription.name}`, { subscriptionId, response });
          };
          const onUnsubscribe = (unsubscribeHandler: () => void) => onUnsubscribeHandlers.set(subscriptionId, unsubscribeHandler);
          const response = await handler({ request, subscriptionId, update, onUnsubscribe });
          return { subscriptionId, response };
        }

        case 'unsubscribe': {
          const { subscriptionId } = props;
          const unsubscribeHandler = onUnsubscribeHandlers.get(subscriptionId);
          if (unsubscribeHandler == null) throw new Error(`Unsubscribe handler not found for subscription ${subscription.name} with id ${subscriptionId}.`);
          unsubscribeHandler();
          onUnsubscribeHandlers.delete(subscriptionId);
          return { subscriptionId, response: undefined };
        }
      }
    });
}
