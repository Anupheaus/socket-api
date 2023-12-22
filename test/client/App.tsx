import { Button, createStyles, Flex, useBound } from '@anupheaus/react-ui';
import { ReactNode, useState } from 'react';
import { ControllersProvider } from '../../src/client';
import { ControllerError } from '../../src/common';
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

  const handleError = useBound((error: ControllerError) => {
    // eslint-disable-next-line no-console
    console.error(error);
  });

  return (
    <Flex tagName="app" isVertical className={css.app}>
      <ControllersProvider url="/api/socket" token={token} onTokenUpdated={setToken} onError={handleError}>
        <Books />
        {content}
        <Button onClick={createNewBooksInstance}>Create New Books Instance</Button>
      </ControllersProvider>
    </Flex>
  );
};