import { Records } from '@anupheaus/common';
import { StoreController, StoreRequest, StoreResponse } from '../../../src/server';
import type { Author } from '../../common';

export class AuthorsStore extends StoreController<Author> {
  constructor() {
    super({ name: 'authors' });

    this.#authors = new Records([
      { id: '1', name: 'J.R.R. Tolkien', totalSoldValue: 0 },
      { id: '2', name: 'C.S. Lewis', totalSoldValue: 0 },
    ]);
  }

  #authors: Records<Author>;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async handleRequest(request: StoreRequest<Author>): Promise<StoreResponse<Author>> {
    const data = this.#authors.toArray();
    return {
      data,
      total: data.length,
    };
  }

  protected async handleUpsert(book: Author): Promise<Author> {
    this.#authors.upsert(book);
    return book;
  }

  protected async handleRemove(id: string): Promise<void> {
    this.#authors.remove(id);
  }

  protected async handleGet(id: string): Promise<Author | undefined> {
    return this.#authors.get(id);
  }


}