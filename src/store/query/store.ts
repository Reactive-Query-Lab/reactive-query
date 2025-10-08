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
  invalidateByKey,
  resetStore,
} from "@/store/query/store-methods";
import { BehaviorSubject, Observable } from "rxjs";

export enum CacheInvalidationStrategy {
  /**
   * After the cache time, the store will be clear
   */
  FORCE = "force",
  /**
   * Only when there is no observer, checking cache time will be started
   * Default strategy is GRACEFUL
   */
  GRACEFUL = "graceful",
}

type configs<T> = {
  initialValue?: T;
  cacheInvalidationStrategy?: CacheInvalidationStrategy;
  initalKey?: string;
  /**
   * In miliseconds
   */
  initStaleTime?: number;
  /**
   * Time the store will be invalidated in. If null provided, the store will not be invalidated ever.
   * In miliseconds
   */
  initCacheTime?: number | null;
  /**
   * Empty the vault when new data arrives
   */
  emptyVaultOnNewValue?: boolean;
};

export default function createVault<T, E = undefined, F = unknown>(
  init?: configs<T>,
  customEvents?: E,
): ReactiveQueryVault<T, E, F> {
  const store$ = new BehaviorSubject<{
    [key: string]: BaseReactiveStore<T>;
  }>({
    ...(init?.initialValue && init?.initalKey
      ? {
          [init.initalKey]: getInitStore(init.initialValue, init.initStaleTime),
        }
      : {}),
  });

  const trackedObservable$ = handleCacheInvalidation(
    store$,
    init as configs<T>,
  );

  return {
    store$: trackedObservable$,
    invalidate: invalidate(store$),
    invalidateKey: invalidateKey(store$),
    setData: setData(store$, init?.emptyVaultOnNewValue),
    setStore: setStore(store$),
    setIsFetched: setIsFetched(store$),
    setIsFetching: setIsFetching(store$),
    setLastFetchedTime: setLastFetchedTime(store$),
    resetVault: resetVault(store$),
    setError: setError(store$),
    setIsLoading: setIsLoading(store$),
    getStore: getStore(store$),
    invalidateByKey: invalidateByKey(store$),
    resetStore: resetStore(store$),
    ...(customEvents || {}),
  } as ReactiveQueryVault<T, E, F>;
}

function getInitStore<T>(initialValue: T, initStaleTime: number | undefined) {
  return {
    data: initialValue,
    isLoading: false,
    staled: false,
    error: undefined,
    lastFetchedTime: new Date().getTime(),
    staleTime: initStaleTime,
    isFetched: true,
    isFetching: false,
  };
}

type SubscriptionArgument<T> = BehaviorSubject<{
  [key: string]: BaseReactiveStore<T>;
}>;

function handleCacheInvalidation<T>(
  store$: SubscriptionArgument<T>,
  config: configs<T> | undefined,
): Observable<{
  [key: string]: BaseReactiveStore<T>;
}> {
  if (config?.initCacheTime === null) return store$.asObservable();

  const cacheInvalidationStrategy =
    config?.cacheInvalidationStrategy || CacheInvalidationStrategy.GRACEFUL;

  const DEFAULT_CACHE_TIME = 3 * 60 * 1000; // 3 minute
  const cacheTime = config?.initCacheTime || DEFAULT_CACHE_TIME;
  if (cacheInvalidationStrategy === CacheInvalidationStrategy.FORCE) {
    setInterval(() => {
      clearCache(store$, config);
    }, cacheTime);
    return store$.asObservable();
  }

  if (cacheInvalidationStrategy === CacheInvalidationStrategy.GRACEFUL) {
    const DEFAULT_CACHE_TIME = 3 * 60 * 1000;
    const cacheTime = config?.initCacheTime || DEFAULT_CACHE_TIME;
    let invalidationTimer: NodeJS.Timeout | undefined = undefined;
    let observerCount = 0;

    const trackedObservable = new Observable((subscriber) => {
      observerCount++;

      if (observerCount === 1 && invalidationTimer) {
        clearTimeout(invalidationTimer);
        invalidationTimer = undefined;
      }

      const subscription = store$.subscribe(subscriber);

      return () => {
        subscription.unsubscribe();
        observerCount--;

        if (observerCount === 0) {
          invalidationTimer = setTimeout(() => {
            clearCache(store$, config);
            return trackedObservable;
          }, cacheTime);
        }
      };
    });

    return trackedObservable as Observable<{
      [key: string]: BaseReactiveStore<T>;
    }>;
  }

  return store$.asObservable();
}

function clearCache<T>(
  store$: BehaviorSubject<{ [key: string]: BaseReactiveStore<T> }>,
  config: configs<T> | undefined,
) {
  store$.next({
    ...(config?.initalKey && config?.initialValue
      ? {
          [config.initalKey]: getInitStore(
            config.initialValue,
            config.initStaleTime,
          ),
        }
      : {}),
  });
}
