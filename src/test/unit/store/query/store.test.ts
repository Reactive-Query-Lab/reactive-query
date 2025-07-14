import createStore from "@/store/query/store";
import { firstValueFrom } from "rxjs";

type Data = {
  name: string;
};
describe("createStore", () => {
  describe("basics", () => {
    it("Should return correct store without any error", () => {
      // ! Act
      const store = createStore();
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
        const store = createStore({
          initialValue: initData,
          initalKey: initKey,
          initStaleTime,
        });
        const data = await firstValueFrom(store.store$);
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

  describe("invalidate", () => {
    const initData: Data = { name: "test" };
    const initKey = "test";
    it("Should set all keys as staled", async () => {
      // * Arrange
      const store = createStore({
        initalKey: initKey,
        initialValue: initData,
      });
      // ! Act
      store.invalidate();
      const data = await firstValueFrom(store.store$);
      // ? Assert
      expect(data[initKey].staled).toEqual(true);
    });
  });

  describe("invalidateKey", () => {
    const initData: Data = { name: "test" };
    const initKey = "test";
    it("Should set the key as staled", async () => {
      // * Arrange
      const store = createStore({
        initalKey: initKey,
        initialValue: initData,
      });
      // ! Act
      store.invalidateKey(initKey);
      const data = await firstValueFrom(store.store$);
      // ? Assert
      expect(data[initKey].staled).toEqual(true);
    });
  });

  describe("setData", () => {
    const initData: Data = { name: "test" };
    const initKey = "test";
    it("Should set the key with the data and not change the other keys", async () => {
      // * Arrange
      const store = createStore({
        initalKey: initKey,
        initialValue: initData,
      });
      const newData: Data = { name: "test2" };
      const otherKey = "test2";
      const otherData: Data = { name: "test3" };
      // ! Act
      store.setData(newData, initKey);
      store.setData(otherData, otherKey);
      const data = await firstValueFrom(store.store$);
      // ? Assert
      expect(data[initKey].data).toEqual(newData);
      expect(data[otherKey].data).toEqual(otherData);
    });
  });

  describe("setStore", () => {
    const fakeStore1 = {
      data: { name: "test2" },
      isFetched: true,
      isLoading: false,
      isFetching: false,
      staled: false,
    };
    const fakeStore2 = {
      data: { name: "test3" },
      isFetched: true,
      isLoading: false,
      isFetching: false,
      staled: false,
    };
    const initKey = "test";
    it("Should set the key with the data and not change the other keys", async () => {
      // * Arrange
      const otherKey = "test2";
      const store = createStore();
      // ! Act
      store.setStore(fakeStore1, initKey);
      store.setStore(fakeStore2, otherKey);
      const data = await firstValueFrom(store.store$);
      // ? Assert
      expect(data[initKey]).toEqual(fakeStore1);
      expect(data[otherKey]).toEqual(fakeStore2);
    });
  });

  describe("setIsFetched", () => {
    const initData: Data = { name: "test" };
    const initKey = "test";
    it("Should set the key with the isFetched", async () => {
      // * Arrange
      const store = createStore({
        initalKey: initKey,
        initialValue: initData,
      });
      // ! Act
      store.setIsFetched(true, initKey);
      const data = await firstValueFrom(store.store$);
      // ? Assert
      expect(data[initKey].isFetched).toEqual(true);
    });
  });

  describe("setIsFetching", () => {
    const initData: Data = { name: "test" };
    const initKey = "test";
    it("Should set the key with the isFetching", async () => {
      // * Arrange
      const store = createStore({
        initalKey: initKey,
        initialValue: initData,
      });
      // ! Act
      store.setIsFetching(true, initKey);
      const data = await firstValueFrom(store.store$);
      // ? Assert
      expect(data[initKey].isFetching).toEqual(true);
    });
  });

  describe("setLastFetchedTime", () => {
    const initData: Data = { name: "test" };
    const initKey = "test";
    it("Should set the key with the lastFetchedTime", async () => {
      // * Arrange
      const store = createStore({
        initalKey: initKey,
        initialValue: initData,
      });
      // ! Act
      store.setLastFetchedTime(1000, initKey);
      const data = await firstValueFrom(store.store$);
      // ? Assert
      expect(data[initKey].lastFetchedTime).toEqual(1000);
    });
  });

  describe("resetStore", () => {
    const initData: Data = { name: "test" };
    const initKey = "test";
    it("Should reset the store", async () => {
      // * Arrange
      const store = createStore({
        initalKey: initKey,
        initialValue: initData,
      });
      // ! Act
      store.resetStore();
      const data = await firstValueFrom(store.store$);
      // ? Assert
      expect(data[initKey]).toBeUndefined();
    });
  });

  describe("setError", () => {
    const initData: Data = { name: "test" };
    const initKey = "test";
    it("Should set the key with the error", async () => {
      // * Arrange
      const store = createStore({
        initalKey: initKey,
        initialValue: initData,
      });
      // ! Act
      store.setError(initKey, "test error");
      const data = await firstValueFrom(store.store$);
      // ? Assert
      expect(data[initKey].error).toEqual("test error");
    });
  });

  describe("setIsLoading", () => {
    const initData: Data = { name: "test" };
    const initKey = "test";
    it("Should set the key with the isLoading", async () => {
      // * Arrange
      const store = createStore({
        initalKey: initKey,
        initialValue: initData,
      });
      // ! Act
      store.setIsLoading(true, initKey);
      const data = await firstValueFrom(store.store$);
      // ? Assert
      expect(data[initKey].isLoading).toEqual(true);
    });
  });
});
