import { Button, createStyles, Flex, useBound } from '@anupheaus/react-ui';
import { ReactNode, useState } from 'react';
import { SocketControllersProvider } from '../../src/client/SocketControllersProvider';
import { SocketControllerSerialisedError } from '../../src/common';
import { Books } from './Books';

const useStyles = createStyles({
  app: {
  },
});

export const App = () => {
  const { css } = useStyles();
  const [content, setContent] = useState<ReactNode>(null);
  const [token, setToken] = useState<string>(Math.uniqueId());

  const createNewBooksInstance = useBound(() => {
    setContent(currentContent => (<>
      {currentContent}
      <Books />
    </>));
  });

  const deserialiseError = useBound((error: SocketControllerSerialisedError) => {
    return new Error(error.message);
  });

  return (
    <Flex tagName="app" isVertical className={css.app}>
      <SocketControllersProvider url="/socket/controllers" token={token} onTokenUpdated={setToken} onDeserialiseError={deserialiseError}>
        <Books />
        {content}
        <Button onClick={createNewBooksInstance}>Create New Books Instance</Button>
      </SocketControllersProvider>
    </Flex>
  );
};