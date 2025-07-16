import { BaseReactiveStore } from "@/store/query/store-type";
import { BehaviorSubject } from "rxjs";

export function invalidate<T>(
  store$: BehaviorSubject<{ [key: string]: BaseReactiveStore<T> }>,
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

export function invalidateKey<T>(
  store$: BehaviorSubject<{ [key: string]: BaseReactiveStore<T> }>,
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

export function setData<T>(
  store$: BehaviorSubject<{ [key: string]: BaseReactiveStore<T> }>,
  replace?: boolean,
): (data: T, key: string) => void {
  return (data: T, key: string) => {
    const currentStore = store$.getValue();
    const updatedStore = {
      ...(replace ? {} : currentStore),
      [key]: { ...currentStore[key], data },
    };
    store$.next(updatedStore);
  };
}

export function setStore<T>(
  store$: BehaviorSubject<{ [key: string]: BaseReactiveStore<T> }>,
  replace?: boolean,
): (data: BaseReactiveStore<T>, key: string) => void {
  return (data: BaseReactiveStore<T>, key: string) => {
    const currentStore = store$.getValue();
    const updatedStore = { ...(replace ? {} : currentStore), [key]: data };
    store$.next(updatedStore);
  };
}

export function setIsFetched<T>(
  store$: BehaviorSubject<{ [key: string]: BaseReactiveStore<T> }>,
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

export function setIsFetching<T>(
  store$: BehaviorSubject<{ [key: string]: BaseReactiveStore<T> }>,
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

export function setLastFetchedTime<T>(
  store$: BehaviorSubject<{ [key: string]: BaseReactiveStore<T> }>,
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

export function resetVault<T>(
  store$: BehaviorSubject<{ [key: string]: BaseReactiveStore<T> }>,
): () => void {
  return () => {
    store$.next({});
  };
}

export function setError<T>(
  store$: BehaviorSubject<{ [key: string]: BaseReactiveStore<T> }>,
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

export function setIsLoading<T>(
  store$: BehaviorSubject<{ [key: string]: BaseReactiveStore<T> }>,
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

export function getStore<T>(
  store$: BehaviorSubject<{ [key: string]: BaseReactiveStore<T> }>,
): (key: string) => BaseReactiveStore<T> | undefined {
  return (key: string) => {
    return store$.getValue()[key];
  };
}
