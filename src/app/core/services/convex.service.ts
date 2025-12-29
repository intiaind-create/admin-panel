import { Injectable } from '@angular/core';
import { ConvexClient } from 'convex/browser';

@Injectable({ providedIn: 'root' })
export class ConvexService {
  private _client!: ConvexClient;

  // Lazy initialization - only create client when first accessed
  get client(): ConvexClient {
    if (!this._client) {
      this._client = new ConvexClient('https://adventurous-toad-869.convex.cloud');
    }
    return this._client;
  }

  // Query wrapper
  async query<T>(query: any, args?: any): Promise<T> {
    return await this.client.query(query, args);
  }

  // Mutation wrapper
  async mutation<T>(mutation: any, args?: any): Promise<T> {
    return await this.client.mutation(mutation, args);
  }

  // Action wrapper
  async action<T>(action: any, args?: any): Promise<T> {
    return await this.client.action(action, args);
  }

  // ✅ Set auth token (takes a function that returns string or undefined)
  setAuth(token: string | null) {
    if (token) {
      this.client.setAuth(async () => token);
    } else {
      // ✅ FIX: Return undefined instead of null
      this.client.setAuth(async () => undefined);
    }
  }

  // ✅ Clear auth (return undefined from the fetcher)
  clearAuth() {
    this.client.setAuth(async () => undefined);
  }
}
