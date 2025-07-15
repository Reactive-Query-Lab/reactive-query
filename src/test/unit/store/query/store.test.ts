import createVault from "@/store/query/store";
import { BaseReactiveStore } from "@/store/query/store-type";
import { firstValueFrom, Observable } from "rxjs";

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
  });
});
