import { useAsync } from '@anupheaus/react-ui';
import { useController } from './useController';

export function useBooks() {
  const { getAllBooks, addBook, onBookSold } = useController('books');
  onBookSold(async book => console.log('book sold', book));
  const { response: books, error, isLoading } = useAsync(getAllBooks, [getAllBooks]);
  return { books, error, isLoading, addBook };
}