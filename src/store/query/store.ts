import {
  BaseReactiveKeyStore,
  ReactiveQueryStore,
} from "@/store/query/store-type";
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

function invalidate<T>(
  store$: BehaviorSubject<{ [key: string]: BaseReactiveKeyStore<T> }>,
): () => void {
  return () => {
    const currentStore = store$.getValue();
    const updatedStore = Object.entries(currentStore).reduce(
      (acc, [key, value]) => ({
        ...acc,
        [key]: {
          ...value,
          staled: true,
        },
      }),
      {},
    );
    store$.next(updatedStore);
  };
}

function invalidateKey<T>(
  store$: BehaviorSubject<{ [key: string]: BaseReactiveKeyStore<T> }>,
): (key: string) => void {
  return (key: string) => {
    const currentStore = store$.getValue();
    const updatedStore = {
      ...currentStore,
      [key]: { ...currentStore[key], staled: true },
    };
    store$.next(updatedStore);
  };
}

function setData<T>(
  store$: BehaviorSubject<{ [key: string]: BaseReactiveKeyStore<T> }>,
): (data: T, key: string) => void {
  return (data: T, key: string) => {
    const currentStore = store$.getValue();
    const updatedStore = {
      ...currentStore,
      [key]: { ...currentStore[key], data },
    };
    store$.next(updatedStore);
  };
}

function setStore<T>(
  store$: BehaviorSubject<{ [key: string]: BaseReactiveKeyStore<T> }>,
): (data: BaseReactiveKeyStore<T>, key: string) => void {
  return (data: BaseReactiveKeyStore<T>, key: string) => {
    const currentStore = store$.getValue();
    const updatedStore = { ...currentStore, [key]: data };
    store$.next(updatedStore);
  };
}

function setIsFetched<T>(
  store$: BehaviorSubject<{ [key: string]: BaseReactiveKeyStore<T> }>,
): (isFetched: boolean, key: string) => void {
  return (isFetched: boolean, key: string) => {
    const currentStore = store$.getValue();
    const updatedStore = {
      ...currentStore,
      [key]: { ...currentStore[key], isFetched },
    };
    store$.next(updatedStore);
  };
}

function setIsFetching<T>(
  store$: BehaviorSubject<{ [key: string]: BaseReactiveKeyStore<T> }>,
): (isFetching: boolean, key: string) => void {
  return (isFetching: boolean, key: string) => {
    const currentStore = store$.getValue();
    const updatedStore = {
      ...currentStore,
      [key]: { ...currentStore[key], isFetching },
    };
    store$.next(updatedStore);
  };
}

function setLastFetchedTime<T>(
  store$: BehaviorSubject<{ [key: string]: BaseReactiveKeyStore<T> }>,
): (time: number, key: string) => void {
  return (time: number, key: string) => {
    const currentStore = store$.getValue();
    const updatedStore = {
      ...currentStore,
      [key]: { ...currentStore[key], lastFetchedTime: time },
    };
    store$.next(updatedStore);
  };
}

function resetStore<T>(
  store$: BehaviorSubject<{ [key: string]: BaseReactiveKeyStore<T> }>,
): () => void {
  return () => {
    store$.next({});
  };
}

function setError<T>(
  store$: BehaviorSubject<{ [key: string]: BaseReactiveKeyStore<T> }>,
): (key: string, error: unknown) => void {
  return (key: string, error: unknown) => {
    const currentStore = store$.getValue();
    const updatedStore = {
      ...currentStore,
      [key]: { ...currentStore[key], error: error },
    };
    store$.next(updatedStore);
  };
}

function setIsLoading<T>(
  store$: BehaviorSubject<{ [key: string]: BaseReactiveKeyStore<T> }>,
): (isLoading: boolean, key: string) => void {
  return (isLoading: boolean, key: string) => {
    const currentStore = store$.getValue();
    const updatedStore = {
      ...currentStore,
      [key]: { ...currentStore[key], isLoading },
    };
    store$.next(updatedStore);
  };
}
