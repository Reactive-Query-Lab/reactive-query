import { map as rxMap, Observable } from "rxjs";
import {
  BaseReactiveStore,
  ReactiveQueryVault,
} from "@/store/query/store-type";
import recursiveCallWithRetry from "@/helpers/functions";

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
  protected abstract store: EVENTS extends undefined
    ? ReactiveQueryVault<DATA>
    : ReactiveQueryVault<DATA, EVENTS>;

  protected abstract store$: ReactiveQueryVault<DATA, EVENTS>["store$"];

  protected abstract refresh(params?: unknown): Promise<DATA>;

  protected configs = {
    /**
     * Maximum time to call refresh method on getting left response
     */
    maxRetryCall: 1,
  };

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
    };
  }

  query(params?: unknown): Observable<QueryResponse<DATA>> {
    const hashedKey = this.getHashedKey(params);
    return this.store$.pipe(
      rxMap((vault) => {
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
            storeToResponse = { ...storeToResponse, isFetching: true };
            this.store.setStore(storeToResponse, hashedKey);
          }

          // call refresh
          this.refreshHandler(storeToResponse, params).then((newStore) => {
            this.store.setStore(newStore, hashedKey);
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
    return JSON.stringify(params);
  }

  private async refreshHandler(
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
        error: error,
        isLoading: false,
        isFetching: false,
      };
    }
  }

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
