import { createUseController } from '../../src/client';
import { ControllerTypes } from '../common';

export const useController = createUseController<ControllerTypes>();

// () => {
//   const { getAllBooks, printAllBooks, addBook } = useController('books');
//   const { response: books } = getAllBooks();


// };