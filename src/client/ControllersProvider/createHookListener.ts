import { Logger } from '@anupheaus/common';
import { useBound } from '@anupheaus/react-ui';
import { useEffect, useMemo, useRef } from 'react';

interface Props {
  logger: Logger;
}

export function createHookListener({ logger }: Props) {
  const allCallbacks = useRef(new Map<string, Map<string, (response: unknown) => void>>()).current;

  const listenForUpdates = useBound((providedListenerId: string, callback: (response: unknown) => void): (hashes: string[]) => void => {
    const boundCallback = useBound(callback);
    const lastHashesRef = useRef<string[]>([]);
    const lastListenerIdRef = useRef(providedListenerId);

    const hook = useBound((hashes: string[], listenerId: string) => {
      hashes.forEach(hash => {
        const callbacks = allCallbacks.get(hash) ?? new Map();
        callbacks.set(listenerId, boundCallback);
        allCallbacks.set(hash, callbacks);
      });
    });

    const unhook = useBound((hashes: string[], listenerId: string) => {
      hashes.forEach(hash => {
        const callbacks = allCallbacks.get(hash);
        if (!callbacks) return;
        callbacks.delete(listenerId);
        if (callbacks.size === 0) allCallbacks.delete(hash);
      });
    });

    useMemo(() => {
      if (lastListenerIdRef.current == null) return;
      if (lastHashesRef.current.length > 0) unhook(lastHashesRef.current, lastListenerIdRef.current);
      lastListenerIdRef.current = providedListenerId;
      hook(lastHashesRef.current, providedListenerId);
    }, [providedListenerId]);

    useEffect(() => () => {
      if (lastHashesRef.current.length === 0 || lastListenerIdRef.current == null) return;
      unhook(lastHashesRef.current, lastListenerIdRef.current);
    }, []);

    return useBound((hashes: string[]) => {
      if (lastListenerIdRef.current == null) return;
      if (lastHashesRef.current.length > 0) unhook(lastHashesRef.current, lastListenerIdRef.current);
      lastHashesRef.current = hashes;
      if (hashes.length > 0) hook(hashes, lastListenerIdRef.current);
    });
  });

  const callListeners = useBound((hash: string, response: unknown, socketId: string) => {
    const callbacks = allCallbacks.get(hash);
    logger.debug('Getting all callbacks for update', { socketId, hash, callbackCount: (callbacks?.size ?? 0) });
    if (!callbacks) return;
    logger.debug('Triggering all callbacks', { socketId, hash });
    callbacks.forEach(callback => callback(response));
  });

  return { listenForUpdates, callListeners };
}