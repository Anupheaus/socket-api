import { useState } from 'react';
import { Button, createComponent, createStyles, Flex } from '@anupheaus/react-ui';
import { useSocketAPI } from '../../src/client';

const useStyles = createStyles({
  connectionStatus: {
    borderRadius: 8,
    '&.socket-connected': {
      backgroundColor: 'green',
    },
    '&.socket-disconnected': {
      backgroundColor: 'red',
    },
  },
});

export const ConnectionTest = createComponent('ConnectionTest', () => {
  const { css, join } = useStyles();
  const { onConnectionStateChange, testDisconnect, testReconnect } = useSocketAPI();
  const [isConnected, setIsConnected] = useState(false);
  onConnectionStateChange(newIsConnected => setIsConnected(newIsConnected));

  return (
    <Flex gap={'fields'} disableGrow>
      <Flex className={join(css.connectionStatus, isConnected ? 'socket-connected' : 'socket-disconnected')} />
      <Button onClick={testDisconnect}>Disconnect</Button>
      <Button onClick={testReconnect}>Reconnect</Button>
    </Flex>
  );
});