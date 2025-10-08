import createVault from "@/store/query/store";
import { BaseReactiveStore } from "@/store/query/store-type";
import { firstValueFrom, lastValueFrom, Observable, take } from "rxjs";

type Data = {
  name: string;
};
describe("createVault", () => {
  describe("basics", () => {
    it("Should return correct store without any error", () => {
      // ! Act
      const store = createVault();
      // ? Assert
      expect(store).toBeDefined();
    });

    describe("On passing init data", () => {
      const initData: Data = { name: "test" };
      const initKey = "test";

      it("Should return correct store", async () => {
        // * Arrange
        const fakeCurrentDate = new Date();
        const initStaleTime = 1000;
        vi.useFakeTimers();
        vi.setSystemTime(fakeCurrentDate);
        // ! Act
        const store = createVault({
          initialValue: initData,
          initalKey: initKey,
          initStaleTime,
        });
        const data = await firstValueFrom(
          store.store$ as Observable<{
            [key: string]: BaseReactiveStore<Data>;
          }>,
        );
        // ? Assert
        expect(store).toBeDefined();
        expect(data[initKey]).toBeDefined();
        expect(data[initKey].data).toEqual(initData);
        expect(data[initKey].isFetched).toEqual(true);
        expect(data[initKey].isLoading).toEqual(false);
        expect(data[initKey].error).toBeUndefined();
        expect(data[initKey].isFetching).toEqual(false);
        expect(data[initKey].staleTime).toEqual(initStaleTime);
        expect(data[initKey].staled).toEqual(false);
        expect(data[initKey].lastFetchedTime).toEqual(
          fakeCurrentDate.getTime(),
        );
        vi.useRealTimers();
      });
    });

    describe("replace", () => {
      it("With replace should set to new store and prev data should be removed", async () => {
        // * Arrange
        // ! Act
        const store = createVault({
          initalKey: "test",
          initialValue: { name: "test" },
          emptyVaultOnNewValue: true,
        });

        const newData = { name: "new" };
        const newKey = "test2";
        store.setData(newData, newKey);

        const data = await lastValueFrom(
          store.store$.pipe(take(1)) as Observable<{
            [key: string]: BaseReactiveStore<Data>;
          }>,
        );
        // ? Assert
        expect(data).toEqual({
          [newKey]: {
            data: newData,
          },
        });
        vi.useRealTimers();
      });
    });

    describe("caching", () => {
      it("Should empty the store after the cache time", async () => {
        // * Arrange
        const fakeCurrentDate = new Date();
        vi.useFakeTimers();
        vi.setSystemTime(fakeCurrentDate);
        const fakeCacheTime = 10000;
        // ! Act
        const store = createVault({
          initalKey: "test",
          initialValue: { name: "test" },
          initCacheTime: fakeCacheTime,
        });
        await firstValueFrom(
          store.store$ as Observable<{
            [key: string]: BaseReactiveStore<Data>;
          }>,
        );

        vi.advanceTimersToNextTimer();
        const data = await lastValueFrom(
          store.store$.pipe(take(1)) as Observable<{
            [key: string]: BaseReactiveStore<Data>;
          }>,
        );
        // ? Assert
        expect(data).toEqual({
          test: {
            data: { name: "test" },
            isLoading: false,
            staled: false,
            error: undefined,
            lastFetchedTime: new Date().getTime(),
            staleTime: undefined,
            isFetched: true,
            isFetching: false,
          },
        });
        vi.useRealTimers();
      });

      it("Should not invalidate the store if the cache time is null", async () => {
        // * Arrange
        const fakeCurrentDate = new Date();
        vi.useFakeTimers();
        vi.setSystemTime(fakeCurrentDate);
        const store = createVault({
          initalKey: "test",
          initialValue: { name: "test" },
          initCacheTime: null,
        });
        await firstValueFrom(
          store.store$ as Observable<{
            [key: string]: BaseReactiveStore<Data>;
          }>,
        );
        vi.advanceTimersToNextTimer();
        const data = await lastValueFrom(
          store.store$.pipe(take(1)) as Observable<{
            [key: string]: BaseReactiveStore<Data>;
          }>,
        );
        expect(data).toEqual({
          test: {
            data: { name: "test" },
            isLoading: false,
            staled: false,
            error: undefined,
            lastFetchedTime: fakeCurrentDate.getTime(),
            staleTime: undefined,
            isFetched: true,
            isFetching: false,
          },
        });
        vi.useRealTimers();
      });
    });
  });
});
