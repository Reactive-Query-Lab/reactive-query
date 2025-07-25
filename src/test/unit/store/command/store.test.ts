import { describe, expect, it } from "vitest";
import createCommandStore from "@/store/command/store";
import { firstValueFrom } from "rxjs";

describe("createCommandStore", () => {
  it("should create a command store", () => {
    const store = createCommandStore({});
    expect(store).toBeDefined();
  });

  it("should update params", async () => {
    const store = createCommandStore({});
    store.updateParams({
      test: "test",
    });
    const result = await firstValueFrom(store.store$);
    expect(result.params).toEqual({
      test: "test",
    });
  });

  it("should reset", async () => {
    const store = createCommandStore({});
    store.reset();
    const result = await firstValueFrom(store.store$);
    expect(result.params).toEqual({});
  });

  it("should set is loading", async () => {
    const store = createCommandStore({});
    store.setIsLoading(true);
    const result = await firstValueFrom(store.store$);
    expect(result.isLoading).toEqual(true);
  });
});
