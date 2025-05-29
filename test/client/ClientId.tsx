import { createComponent, Flex } from '@anupheaus/react-ui';
import { useSocket } from '../../src/client';

export const ClientId = createComponent('ClientId', () => {
  const { clientId } = useSocket();
  return <Flex disableGrow>Client ID:&nbsp;{clientId}</Flex>;
});