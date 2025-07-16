import {
  BaseReactiveStore,
  ReactiveQueryVault,
} from "@/store/query/store-type";
import {
  invalidate,
  invalidateKey,
  setData,
  setError,
  setIsFetched,
  setIsFetching,
  setIsLoading,
  setLastFetchedTime,
  setStore,
  getStore,
  resetVault,
} from "@/store/query/store-methods";
import { BehaviorSubject } from "rxjs";

export default function createVault<T, E = undefined, F = unknown>(
  init?: {
    initialValue?: T;
    initalKey?: string;
    /**
     * In miliseconds
     */
    initStaleTime?: number;
    /**
     * In miliseconds
     */
    initCacheTime?: number;
    /**
     * Replace the store with other stores in the vault when new data arrives
     */
    replaceOnNewValue?: boolean;
  },
  customEvents?: E,
): ReactiveQueryVault<T, E, F> {
  const getInitStore = (initialValue: T) => {
    return {
      data: initialValue,
      isLoading: false,
      staled: false,
      error: undefined,
      lastFetchedTime: new Date().getTime(),
      staleTime: init?.initStaleTime,
      isFetched: true,
      isFetching: false,
    };
  };
  const store$ = new BehaviorSubject<{
    [key: string]: BaseReactiveStore<T>;
  }>({
    ...(init?.initialValue && init?.initalKey
      ? {
          [init.initalKey]: getInitStore(init.initialValue),
        }
      : {}),
  });

  const DEFAULT_CACHE_TIME = 3 * 60 * 1000; // 3 minute
  // handle cache time
  const cacheTime = init?.initCacheTime || DEFAULT_CACHE_TIME;
  setInterval(() => {
    store$.next({
      ...(init?.initalKey && init?.initialValue
        ? {
            [init.initalKey]: getInitStore(init.initialValue),
          }
        : {}),
    });
  }, cacheTime);

  return {
    store$: store$.asObservable(),
    invalidate: invalidate(store$),
    invalidateKey: invalidateKey(store$),
    setData: setData(store$, init?.replaceOnNewValue),
    setStore: setStore(store$, init?.replaceOnNewValue),
    setIsFetched: setIsFetched(store$),
    setIsFetching: setIsFetching(store$),
    setLastFetchedTime: setLastFetchedTime(store$),
    resetVault: resetVault(store$),
    setError: setError(store$),
    setIsLoading: setIsLoading(store$),
    getStore: getStore(store$),
    ...(customEvents || {}),
  } as ReactiveQueryVault<T, E, F>;
}
