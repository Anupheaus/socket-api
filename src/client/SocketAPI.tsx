import { createComponent, LoggerProvider } from '@anupheaus/react-ui';
import type { ReactNode } from 'react';
import { SocketProvider, SubscriptionProvider } from './providers';
import { AuthenticationProvider } from './providers/user/AuthenticationProvider';
import type { Logger } from '@anupheaus/common';

interface Props {
  host?: string;
  name: string;
  logger?: Logger;
  tokenKeyName?: string;
  onInvalidToken?(): Promise<void>;
  children?: ReactNode;
}

export const SocketAPI = createComponent('SocketAPI', ({
  host,
  name,
  logger,
  tokenKeyName = 'socket-api-token',
  children,
}: Props) => {
  return (
    <LoggerProvider logger={logger} loggerName={'socket-api'}>
      <SocketProvider host={host} name={name}>
        <SubscriptionProvider>
          <AuthenticationProvider tokenKeyName={tokenKeyName}>
            {children}
          </AuthenticationProvider>
        </SubscriptionProvider>
      </SocketProvider>
    </LoggerProvider>
  );
});
