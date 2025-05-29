// import { useMemo, useRef, useState } from 'react';
// import { useSocket } from './providers';

// export function useSocketAPI() {
//   const socketApi = useSocket();
//   const { isConnected: getIsConnected, onConnectionStateChanged, getSocket } = socketApi;
//   const [isConnected, setIsConnected] = useState(useMemo(() => getIsConnected(), []));
//   const updateWhenChangedRef = useRef(false);
//   const [clientId, setClientId] = useState(useMemo(() => getIsConnected() ? getSocket()?.id : undefined, []));

//   onConnectionStateChanged((newIsConnected, socket) => {
//     if (!updateWhenChangedRef.current) return;
//     setClientId(socket?.id);
//     setIsConnected(newIsConnected);
//   });

//   return {
//     ...socketApi,
//     get isConnected() { updateWhenChangedRef.current = true; return isConnected; },
//     get clientId() { updateWhenChangedRef.current = true; return clientId; },
//     onConnectionStateChanged,
//   };
// }
