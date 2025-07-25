import {
  BaseReactiveCommandStore,
  ReactiveCommandStore,
} from "@/store/command/store-type";
import { BehaviorSubject } from "rxjs";

export default function createCommandStore<T extends Record<string, unknown>>(
  initialParams: T,
): ReactiveCommandStore<T> {
  const store$ = new BehaviorSubject<BaseReactiveCommandStore<T>>({
    isLoading: false,
    params: initialParams,
  });

  return {
    store$,
    setIsLoading: (isLoading: boolean) => {
      store$.next({ ...store$.getValue(), isLoading });
    },
    reset: () => {
      store$.next({
        isLoading: false,
        params: initialParams,
      });
    },
    updateParams: (updatedParam: Partial<T>) => {
      store$.next({
        ...store$.getValue(),
        params: { ...store$.getValue().params, ...updatedParam },
      });
    },
  };
}
