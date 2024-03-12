import { Records } from '@anupheaus/common';
import { Controller, StoreController, StoreControllerRequest, StoreControllerResponse, StoreControllerUpsertResponse } from '../../../src/server';
import type { Author } from '../../common';

export const AuthorsStore = Controller.configure(class AuthorsStore extends StoreController<Author> {
  constructor() {
    super();

    this.#authors = new Records([
      { id: '1', name: 'J.R.R. Tolkien', totalSoldValue: 0 },
      { id: '2', name: 'C.S. Lewis', totalSoldValue: 0 },
    ]);
  }

  #authors: Records<Author>;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async handleRequest(request?: StoreControllerRequest<Author>): Promise<StoreControllerResponse<Author>> {
    const data = this.#authors.toArray();
    return {
      data,
      total: data.length,
    };
  }

  protected async handleUpsert(author: Author): Promise<StoreControllerUpsertResponse<Author>> {
    this.#authors.upsert(author);
    return { record: author, isNew: true };
  }

  protected async handleRemove(id: string): Promise<void> {
    this.#authors.remove(id);
  }

  protected async handleGet(id: string): Promise<Author | undefined> {
    return this.#authors.get(id);
  }

}, { name: 'authors', exposeToClient: [] });
