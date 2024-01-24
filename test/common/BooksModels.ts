export interface Book {
  id: string;
  title: string;
  authorId: string;
  price: number;
}

export interface BooksStoreAPI {
  doSomething(): Promise<void>;
}
