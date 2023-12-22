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

const emptyBooks: Book[] = [{ id: '1', authorId: '', title: '', price: 0.00 }];

export const Books = () => {
  const { classes } = useStyles();
  const { books, error, isLoading, addBook } = useBooks();

  // const isLoading = false;
  // const books: Book[] = [];
  // const error = null;

  const handleAddBook = useBound(() => addBook({
    id: `${(books?.length ?? 1000) + 1}`,
    authorId: '2',
    title: 'New Title',
    price: 10.00,
  }));

  return (
    <Flex tagName="books" className={classes.books} width={300} gap={16}>
      <UIState isLoading={isLoading}>
        {(books ?? emptyBooks).map(({ id, authorId, title, price }) => (
          <Flex tagName="book" key={id} gap={16}>
            <Skeleton type="text"><Flex tagName="author" disableGrow>{authorId}</Flex></Skeleton>
            <Skeleton type="text"><Flex tagName="title">{title}</Flex></Skeleton>
            <Skeleton type="text"><Flex tagName="price">{price}</Flex></Skeleton>
          </Flex>
        ))}
        <Button onClick={handleAddBook}>Add Book</Button>
        {/* <AssistiveLabel error={error} /> */}
      </UIState>
    </Flex>
  );
};