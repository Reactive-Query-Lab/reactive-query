import {
  BaseReactiveKeyStore,
  ReactiveQueryStore,
} from "@/store/query/store-type";
import {
  invalidate,
  invalidateKey,
  resetStore,
  setData,
  setError,
  setIsFetched,
  setIsFetching,
  setIsLoading,
  setLastFetchedTime,
  setStore,
} from "@/store/query/store-methods";
import { BehaviorSubject } from "rxjs";

export default function createStore<T, F = unknown>(init?: {
  initialValue: T;
  initalKey: string;
  /**
   * In miliseconds
   */
  initStaleTime?: number;
}): ReactiveQueryStore<T, F> {
  const store$ = new BehaviorSubject<{
    [key: string]: BaseReactiveKeyStore<T>;
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
    resetStore: resetStore(store$),
    setError: setError(store$),
    setIsLoading: setIsLoading(store$),
  };
}
