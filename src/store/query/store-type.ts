import { Observable } from "rxjs";

export type BaseReactiveStore<DATA> = {
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

export type QueryVaultEvents<DATA, FAILURE = unknown> = {
  setIsFetched(isFetched: boolean, key: string): void;
  setIsFetching(isFetching: boolean, key: string): void;
  setData(data: DATA, key: string): void;
  setStore(data: BaseReactiveStore<DATA>, key: string): void;
  getStore(key: string): BaseReactiveStore<DATA> | undefined;
  setLastFetchedTime(time: number, key: string): void;
  invalidateKey(key: string): void;
  /**
   * Set all keys as staled
   */
  invalidate(): void;
  /**
   * Remove all keys
   */
  resetVault(): void;
  setError(key: string, failure?: FAILURE): void;
  setIsLoading(isLoading: boolean, key: string): void;
};

export type ReactiveQueryVault<DATA, EVENTS = undefined, FAILURE = unknown> = {
  store$: Observable<{ [key: string]: BaseReactiveStore<DATA> }>;
} & QueryVaultEvents<DATA, FAILURE> &
  (EVENTS extends undefined ? Record<string, never> : EVENTS);
