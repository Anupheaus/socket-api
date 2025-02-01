import { createComponent } from '@anupheaus/react-ui';
import type { ReactNode } from 'react';
import { SocketProvider } from './providers';
import { LoggerProvider } from './logger';
import { AuthenticationProvider } from './providers/user/AuthenticationProvider';

interface Props {
  name: string;
  tokenKeyName?: string;
  onInvalidToken?(): Promise<void>;
  children?: ReactNode;
}

export const SocketAPI = createComponent('SocketAPI', ({
  name,
  tokenKeyName = 'socket-api-token',
  children,
}: Props) => {
  return (
    <LoggerProvider>
      <SocketProvider name={name}>
        <AuthenticationProvider tokenKeyName={tokenKeyName}>
          {children}
        </AuthenticationProvider>
      </SocketProvider>
    </LoggerProvider>
  );
});
