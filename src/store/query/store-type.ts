import { Observable } from "rxjs";

export type BaseReactiveKeyStore<DATA> = {
  isLoading: boolean;
  error?: unknown;
  isFetched: boolean;
  isFetching: boolean;
  data: DATA;
  /**
   * On not existing consider that this data is always refresh
   */
  staleTime?: number;
  /**
   * To mention manually that our data is not refresh anymore
   */
  staled: boolean;
  /**
   * Used to be checked with stale time
   */
  lastFetchedTime?: number;
};

export type QueryStoreEvents<DATA, FAILURE = unknown> = {
  setIsFetched(isFetched: boolean, key: string): void;
  setIsFetching(isFetching: boolean, key: string): void;
  setData(data: DATA, key: string): void;
  setStore(data: BaseReactiveKeyStore<DATA>, key: string): void;
  setLastFetchedTime(time: number, key: string): void;
  invalidateKey(key: string): void;
  /**
   * Set all keys as staled
   */
  invalidate(): void;
  /**
   * Remove all keys
   */
  resetStore(): void;
  setError(key: string, failure?: FAILURE): void;
  setIsLoading(isLoading: boolean, key: string): void;
};

export type ReactiveQueryStore<DATA, FAILURE = unknown> = {
  store$: Observable<{ [key: string]: BaseReactiveKeyStore<DATA> }>;
} & QueryStoreEvents<DATA, FAILURE>;
