import { map as rxMap, Observable } from "rxjs";
import {
  BaseReactiveStore,
  ReactiveQueryVault,
} from "@/store/query/store-type";
import recursiveCallWithRetry, { isObject } from "@/helpers/functions";
import createVault from "@/store/query/store";

export type QueryResponse<DATA = undefined> = Omit<
  BaseReactiveStore<DATA>,
  "data"
> & {
  data?: DATA | undefined;
};

export const getInitQueryResponse = <DATA>(
  data: DATA,
): QueryResponse<DATA> => ({
  isLoading: true,
  data,
  isFetched: false,
  isFetching: false,
  staled: false,
});

export default abstract class ReactiveQueryModel<DATA, EVENTS = undefined> {
  protected store: ReactiveQueryVault<DATA, EVENTS>;

  protected get store$(): ReactiveQueryVault<DATA, EVENTS>["store$"] {
    return this.store.store$ as ReactiveQueryVault<DATA, EVENTS>["store$"];
  }

  protected abstract refresh(params?: unknown): Promise<DATA>;

  private DEFAULT_CACHE_TIME = 3 * 60 * 1000; // 3 minute

  protected get configs(): {
    maxRetryCall: number;
    cacheTime: number | null;
    emptyVaultOnNewValue: boolean;
    initStore:
      | {
          key: string;
          value: DATA;
          staleTime?: number;
        }
      | undefined;
  } {
    return {
      /**
       * Maximum time to call refresh method on getting left response
       */
      maxRetryCall: 1,

      /**
       * Maximum amount of time before empty the store
       */
      cacheTime: this.DEFAULT_CACHE_TIME,

      /**
       * Empty the vault when new data arrives
       */
      emptyVaultOnNewValue: false,

      /**
       * Default store to init the vault with one default store
       */
      initStore: undefined,
    };
  }

  constructor() {
    this.store = createVault({
      emptyVaultOnNewValue: this.configs.emptyVaultOnNewValue,
      initCacheTime: this.configs.cacheTime,
      initalKey: this.configs.initStore?.key,
      initialValue: this.configs.initStore?.value,
      initStaleTime: this.configs.initStore?.staleTime,
    });
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
   * @returns Checks if data is staled or not (manually or through time)
   */
  protected hasStaled(hashedKey: string): boolean {
    const store = this.store.getStore(hashedKey);
    if (!store) return false;
    if (store.staled) return true;
    if (!store.staleTime) return false;
    if (!store.lastFetchedTime) return true;
    // last time fetched should - now should be less than stale time
    const passedTime = new Date().getTime() - store.lastFetchedTime;
    return passedTime > store.staleTime;
  }

  /**
   * @returns If store is in the fetching, loading process or having error returns false
   */
  protected isStoreValidToProcess(hashedKey: string): boolean {
    const store = this.store.getStore(hashedKey);
    const isInTheProcess = store?.isFetching || store?.isLoading;
    if (isInTheProcess) return false;
    if (store?.error) return false;
    return true;
  }

  /**
   * This one returns methods from store to have access to store methods from vms
   */
  get storeHandler() {
    return {
      invalidate: this.store.invalidate,
      invalidateByKey: (params?: unknown) => {
        const hashedKey = this.getHashedKey(params);
        this.store.invalidateByKey(hashedKey);
      },
      resetStore: (params: unknown) => {
        const hashedKey = this.getHashedKey(params);
        this.store.resetStore(hashedKey);
      },
      resetVault: this.store.resetVault,
    };
  }

  query(
    params?: unknown,
    configs?: {
      /**
       * Stale time is the time to consider the data is fresh and no need to call
       *  refresh method again.
       * If a data will be staled, the data will be kept in the and return it but
       *  at the same time refresh method will be called to get fresh data.
       * in miliseconds
       * by default it's undefined which means always data will be considred as fresh data.
       */
      staleTime?: number;
    },
  ): Observable<QueryResponse<DATA>> {
    return this.store$.pipe(
      rxMap((vault) => {
        const hashedKey = this.getHashedKey(params);
        let storeToResponse =
          vault[hashedKey] ?? getInitQueryResponse(undefined);
        if (!this.isStoreValidToProcess(hashedKey)) return storeToResponse;

        if (!storeToResponse.isFetched) {
          storeToResponse = {
            ...storeToResponse,
            isLoading: true,
          };
        }
        // if fetched and staled (manually or timing) or not fetched
        const isFetchedAndStaled =
          storeToResponse.isFetched && this.hasStaled(hashedKey);

        if (isFetchedAndStaled || !storeToResponse.isFetched) {
          if (isFetchedAndStaled) {
            storeToResponse = {
              ...storeToResponse,
              isFetching: true,
              staleTime: configs?.staleTime,
              staled: true,
            };
            this.store.setStore(storeToResponse, hashedKey);
          }

          // call refresh
          this.refreshHandler(storeToResponse, params).then((newStore) => {
            this.store.setStore(
              {
                ...newStore,
                staleTime: configs?.staleTime,
              },
              hashedKey,
            );
          });
        }
        return storeToResponse;
      }),
    );
  }

  /**
   * To use have another hashing key algorithm, override this method
   * @param params - The parameters to hash, it should be serializable
   */
  protected getHashedKey(params?: unknown): string {
    let lastParamsToHash;

    if (typeof params === "symbol") {
      lastParamsToHash = params.toString();
    } else {
      lastParamsToHash = params;
    }

    return JSON.stringify(this.sortParams(lastParamsToHash));
  }

  /**
   * @returns one nested level sorted version of params if it's an object
   */
  private sortParams(params: unknown) {
    if (!isObject(params)) return params;

    const result: Record<string, unknown> = {};

    Object.keys(params)
      .sort()
      .forEach((key) => {
        result[key] = params[key];
      });

    return result;
  }

  /**
   * This method is used to handle the refresh process,
   * it will handle the error, retry and return the prepared data to update the store
   *
   * @see don't override this method, if you want to handle the refresh process,
   * @param store - The store to update
   * @param params - The parameters to refresh
   * @returns The updated store
   */
  protected async refreshHandler(
    store: BaseReactiveStore<DATA>,
    params: unknown,
  ): Promise<BaseReactiveStore<DATA>> {
    try {
      const dataToUpdate = await recursiveCallWithRetry<DATA>(
        () => this.refresh(params),
        this.configs.maxRetryCall,
      );
      return {
        ...store,
        data: dataToUpdate,
        isLoading: false,
        isFetching: false,
        isFetched: true,
        staled: false,
        error: undefined,
        lastFetchedTime: new Date().getTime(),
      };
    } catch (error) {
      return {
        ...store,
        error,
        isLoading: false,
        isFetching: false,
      };
    }
  }

  /**
   * This method is used to check if the result data is the same as the previous one
   * @param prev - The previous store
   * @param curr - The current store
   * @returns If the base data is the same
   */
  isSameBaseData(
    prev: Partial<Omit<QueryResponse<DATA>, "data">>,
    curr: Partial<Omit<QueryResponse<DATA>, "data">>,
  ) {
    return (
      prev?.error === curr?.error &&
      prev?.isFetched === curr?.isFetched &&
      prev?.isFetching === curr?.isFetching &&
      prev?.isLoading === curr?.isLoading &&
      prev?.lastFetchedTime === curr?.lastFetchedTime &&
      prev?.staleTime === curr?.staleTime &&
      prev?.staled === curr?.staled
    );
  }
}
