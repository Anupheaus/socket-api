/* eslint-disable max-classes-per-file */
import { Records } from '@anupheaus/common';
import { Controller, StoreController, StoreRequest, StoreResponse } from '../../../src/server';
import type { Book } from '../../common';

export const BooksStore = Controller.configure(class BooksStore extends StoreController<Book> {
  constructor() {
    super();

    this.#books = new Records([
      { id: '1', title: 'The Hobbit', authorId: '1', price: 9.99 },
      { id: '2', title: 'The Lord of the Rings', authorId: '1', price: 19.99 },
      { id: '3', title: 'The Silmarillion', authorId: '1', price: 14.99 },
      { id: '4', title: 'The Chronicles of Narnia', authorId: '2', price: 29.99 },
      { id: '5', title: 'The Lion, the Witch and the Wardrobe', authorId: '2', price: 9.99 },
    ]);
  }

  #books: Records<Book>;

  public async doSomething(): Promise<void> {
    /* do nothing */
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async handleRequest(request: StoreRequest<Book>): Promise<StoreResponse<Book>> {
    const data = this.#books.toArray();
    return {
      data,
      total: data.length,
    };
  }

  protected async handleUpsert(book: Book): Promise<Book> {
    this.#books.upsert(book);
    return book;
  }

  protected async handleRemove(id: string): Promise<void> {
    this.#books.remove(id);
  }

  protected async handleGet(id: string): Promise<Book | undefined> {
    return this.#books.get(id);
  }

}, { name: 'books', exposeToClient: ['doSomething'] });
