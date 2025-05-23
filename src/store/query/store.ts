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
