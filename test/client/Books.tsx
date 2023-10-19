import { AssistiveLabel, Button, Flex, Skeleton, UIState, useBound } from '@anupheaus/react-ui';
import { makeStyles } from 'tss-react/mui';
import { Book } from '../common';
import { useBooks } from './useBooks';

const useStyles = makeStyles()({
  books: {
    display: 'flex',
    flexDirection: 'column',
  },
});

const emptyBooks: Book[] = [{ id: 0, author: 'Loading...', title: 'Loading...' }];

export const Books = () => {
  const { classes } = useStyles();
  const { books, error, isLoading, addBook } = useBooks();

  const handleAddBook = useBound(() => addBook({
    id: (books?.length ?? 1000) + 1,
    author: 'New Author',
    title: 'New Title',
  }));

  return (
    <Flex tagName="books" className={classes.books} width={300} gap={16}>
      <UIState isLoading={isLoading}>
        {(books ?? emptyBooks).map(({ id, author, title }) => (
          <Flex tagName="book" key={id} gap={16}>
            <Skeleton type="text"><Flex tagName="author">{author}</Flex></Skeleton>
            <Skeleton type="text"><Flex tagName="title">{title}</Flex></Skeleton>
          </Flex>
        ))}
        <Button onClick={handleAddBook}>Add Book</Button>
        <AssistiveLabel error={error} />
      </UIState>
    </Flex>
  );
};