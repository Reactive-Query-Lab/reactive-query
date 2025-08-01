import { BehaviorSubject } from "rxjs";
import {
  BaseReactiveCommandStore,
  ExtendedEvents,
  ReactiveCommandStore,
} from "@/store/command/store-type";

export default function createCommandStore<
  PARAMS extends Record<string, unknown>,
  EXTENDED_STORE extends Record<string, unknown> | undefined = undefined,
  EXTENDED_EVENTS extends ExtendedEvents | undefined = undefined,
>(
  initialParams?: PARAMS,
  extendedStore?: {
    initExtendedStore?: EXTENDED_STORE;
    extendedEvents?: (
      store$: BehaviorSubject<BaseReactiveCommandStore<PARAMS, EXTENDED_STORE>>,
    ) => EXTENDED_EVENTS;
  },
): ReactiveCommandStore<PARAMS, EXTENDED_STORE, EXTENDED_EVENTS> {
  const store$ = new BehaviorSubject<
    BaseReactiveCommandStore<PARAMS, EXTENDED_STORE>
  >({
    isLoading: false,
    params: initialParams || {},
    ...((extendedStore?.initExtendedStore ?? {}) as EXTENDED_STORE),
  } as BaseReactiveCommandStore<PARAMS, EXTENDED_STORE>);

  return {
    store$,
    ...(extendedStore?.extendedEvents?.(store$) ?? {}),
    getParams: () => store$.getValue().params,
    getStore: () => store$.getValue(),
    setIsLoading: (isLoading: boolean) => {
      store$.next({ ...store$.getValue(), isLoading });
    },
    reset: () => {
      store$.next({
        ...store$.getValue(),
        ...((extendedStore?.initExtendedStore ?? {}) as EXTENDED_STORE),
        isLoading: false,
        params: initialParams || {},
      });
    },
    updateParams: (updatedParam: Partial<PARAMS>) => {
      store$.next({
        ...store$.getValue(),
        params: { ...store$.getValue().params, ...updatedParam },
      });
    },
  } as unknown as ReactiveCommandStore<PARAMS, EXTENDED_STORE, EXTENDED_EVENTS>;
}
