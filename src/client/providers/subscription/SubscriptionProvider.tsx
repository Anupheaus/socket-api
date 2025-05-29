import { createComponent, useBound, useMap, useSet, useSubscriptionProvider } from '@anupheaus/react-ui';
import { type ReactNode } from 'react';
import type { SubscriptionRequest } from './Subscription';
import { Subscription } from './Subscription';
import { useSocket } from '../socket';
import { subscriptionPrefix, type SocketAPISubscriptionRequest, type SocketAPISubscriptionResponse } from '../../../common/internalModels';

interface Props {
  children?: ReactNode;
}

export const SubscriptionProvider = createComponent('SubscriptionProvider', ({
  children = null,
}: Props) => {
  const { invoke, Provider } = useSubscriptionProvider(Subscription);
  const { on, emit } = useSocket();
  const subscriptionsAlreadyListeningTo = useSet<string>();
  const hashToSubscriptionName = useMap<string, string>();

  const listenForUpdatesFor = (subscriptionName: string, debug?: boolean) => {
    if (subscriptionsAlreadyListeningTo.has(subscriptionName)) return;
    subscriptionsAlreadyListeningTo.add(subscriptionName);
    if (debug) console.log('[Socket-API] Listening for updates for subscription', { subscriptionName }); // eslint-disable-line no-console
    on<SocketAPISubscriptionResponse>(`${subscriptionPrefix}.${subscriptionName}`, ({ response, subscriptionId }) => invoke(response, subscriptionId));
  };

  const onSubscribed = useBound(async (_hookId: string, { subscriptionName, request }: SubscriptionRequest, _callback: (response: unknown) => void, hash?: string, hashIsNew?: boolean, debug?: boolean) => {
    if (hash == null) return;
    if (hashIsNew !== true) return;
    hashToSubscriptionName.set(hash, subscriptionName);
    listenForUpdatesFor(subscriptionName, debug);
    if (debug) console.log('[Socket-API] Subscribing to subscription', { subscriptionName, hash, request }); // eslint-disable-line no-console
    const { response, subscriptionId } = await emit<SocketAPISubscriptionResponse, SocketAPISubscriptionRequest>(`${subscriptionPrefix}.${subscriptionName}`, {
      request, action: 'subscribe', subscriptionId: hash
    });
    if (debug) console.log('[Socket-API] Immediate response from server being invoked', { subscriptionName, hash, request, response, subscriptionId }); // eslint-disable-line no-console
    await invoke(response, subscriptionId, debug);
  });

  const onUnsubscribed = useBound(async (_hookId: string, hash?: string, hashDestroyed?: boolean, debug?: boolean) => {
    if (hash == null || hashDestroyed !== true) return;
    const subscriptionName = hashToSubscriptionName.get(hash);
    if (subscriptionName == null) return;
    hashToSubscriptionName.delete(hash);
    if (debug) console.log('[Socket-API] Unsubscribing from subscription', { subscriptionName, hash }); // eslint-disable-line no-console
    await emit<SocketAPISubscriptionResponse, SocketAPISubscriptionRequest>(`${subscriptionPrefix}.${subscriptionName}`, { action: 'unsubscribe', subscriptionId: hash });
  });

  return (
    <Provider onSubscribed={onSubscribed} onUnsubscribed={onUnsubscribed}>
      {children}
    </Provider>
  );
});
