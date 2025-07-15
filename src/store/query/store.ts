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
    initialValue: T;
    initalKey: string;
    /**
     * In miliseconds
     */
    initStaleTime?: number;
  },
  customEvents?: E,
): ReactiveQueryVault<T, E, F> {
  const store$ = new BehaviorSubject<{
    [key: string]: BaseReactiveStore<T>;
  }>({
    ...(init?.initialValue && init?.initalKey
      ? {
          [init.initalKey]: {
            data: init.initialValue,
            isLoading: false,
            staled: false,
            error: undefined,
            lastFetchedTime: new Date().getTime(),
            staleTime: init?.initStaleTime,
            isFetched: true,
            isFetching: false,
          },
        }
      : {}),
  });

  return {
    store$: store$.asObservable(),
    invalidate: invalidate(store$),
    invalidateKey: invalidateKey(store$),
    setData: setData(store$),
    setStore: setStore(store$),
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
