import { map as rxMap, Observable, BehaviorSubject } from "rxjs";
import createCommandStore from "@/store/command/store";
import {
  BaseReactiveCommandStore,
  ExtendedEvents,
  ObservableStore,
  ReactiveCommandStore,
} from "@/store/command/store-type";

export type CommandModelSubscribeResponse<PARAMS> = {
  params: Partial<PARAMS>;
  isLoading: boolean;
};

export default abstract class ReactiveCommandModel<
  PARAMS extends Record<string, unknown>,
  RESPONSE,
  EXTENDED_STORE extends Record<string, unknown> | undefined = undefined,
  EXTENDED_EVENTS extends ExtendedEvents | undefined = undefined,
> {
  private store: ReactiveCommandStore<PARAMS, EXTENDED_STORE, EXTENDED_EVENTS>;

  protected get store$(): ObservableStore<PARAMS, EXTENDED_STORE> {
    return this.store.store$.asObservable() as ObservableStore<
      PARAMS,
      EXTENDED_STORE
    >;
  }

  /**
   * You can get your extended events from this property.
   * Note: If you have external store, this property will be undefined.
   */
  protected extenedEvents: EXTENDED_EVENTS | undefined;

  /**
   * This method is for getting initial params of store
   * Override this method if you need to set initial params of store
   * @returns initial params of store
   */
  getInitialParams(): PARAMS {
    return {} as PARAMS;
  }

  /**
   * This method is for initializing and introducting extended store
   * Override this method if you need to set extended store of store
   * Note: If you have external store, this property will not be called.
   * @returns extended store of store
   */
  protected initExtendedStore(): {
    initExtendedStore?: EXTENDED_STORE;
    extendedEvents?: (
      store$: BehaviorSubject<BaseReactiveCommandStore<PARAMS, EXTENDED_STORE>>,
    ) => EXTENDED_EVENTS;
  } {
    return {
      initExtendedStore: undefined,
      extendedEvents: undefined,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abstract mutate(...args: any[]): Promise<RESPONSE>;

  constructor(
    externalStore?: ReactiveCommandStore<
      PARAMS,
      EXTENDED_STORE,
      EXTENDED_EVENTS
    >,
  ) {
    if (externalStore) {
      this.store = externalStore;
    } else {
      const extendedStore = this.initExtendedStore();
      this.store = createCommandStore<PARAMS, EXTENDED_STORE, EXTENDED_EVENTS>(
        this.getInitialParams(),
        {
          initExtendedStore: extendedStore.initExtendedStore,
          extendedEvents: extendedStore.extendedEvents,
        },
      );

      this.extenedEvents = extendedStore.extendedEvents?.(this.store.store$);
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    if (this.constructor.instance) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error

      return this.constructor.instance;
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    this.constructor.instance = this;
  }

  /**
   * This method can be called if you need to subscribe to changes of relevant store
   * @param configs
   * @returns modification params, isLoading and, if specified, validation result
   */
  subscribeToParam(): Observable<CommandModelSubscribeResponse<PARAMS>> {
    return this.store$.pipe(
      rxMap((store) => {
        const valueToReturn = {
          params: store.params,
          isLoading: store.isLoading,
        };

        return valueToReturn;
      }),
    );
  }

  getModificationValueByKey<T extends keyof PARAMS>(
    key: T,
  ): PARAMS[T] | undefined {
    return this.store.getParams()[key];
  }

  updateModificationStore(params: Partial<PARAMS>) {
    this.store.updateParams(params);
  }

  updateIsLoading(isLoading: boolean) {
    this.store.setIsLoading(isLoading);
  }

  resetStore() {
    this.store.reset();
  }

  getParams() {
    return this.store.getParams();
  }

  getStore() {
    return this.store.getStore();
  }
}
