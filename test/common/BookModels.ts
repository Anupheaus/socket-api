export interface Author {
  id: string;
  name: string;
  totalSoldValue: number;
}

export interface Book {
  id: string;
  title: string;
  authorId: string;
  price: number;
}

// export const BooksStoreLink = 'BooksStore';

// export const BooksStore = createSocketControllerLink<BookStoreType>(BooksStoreLink);
