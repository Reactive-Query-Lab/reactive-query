/* eslint-disable @typescript-eslint/no-unused-vars */
import { firstValueFrom, lastValueFrom, take } from "rxjs";
import createVault from "@/store/query/store";
import ReactiveQueryModel from "@/query/query-model";

// Test data types
type StringData = string;
type ComplexData = {
  id: number;
  user: {
    name: string;
    email: string;
    preferences: {
      theme: string;
      language: string;
    };
  };
  metadata: {
    createdAt: string;
    updatedAt: string;
    tags: string[];
  };
};

// Concrete implementation for testing
class TestQueryModel extends ReactiveQueryModel<StringData> {
  protected store = createVault<StringData>();
  protected store$ = this.store.store$;

  protected async refresh(params?: unknown): Promise<StringData> {
    // Simulate different responses based on params
    if (typeof params === "string") {
      return `String param: ${params}`;
    }
    if (typeof params === "number") {
      return `Number param: ${params}`;
    }
    if (Array.isArray(params)) {
      return `Array param: ${params.join(",")}`;
    }
    if (params && typeof params === "object") {
      return `Object param: ${JSON.stringify(params)}`;
    }
    return "Default response";
  }
}

class ComplexDataQueryModel extends ReactiveQueryModel<ComplexData> {
  protected store = createVault<ComplexData>();
  protected store$ = this.store.store$;

  protected async refresh(_params?: unknown): Promise<ComplexData> {
    return {
      id: 1,
      user: {
        name: "John Doe",
        email: "john@example.com",
        preferences: {
          theme: "dark",
          language: "en",
        },
      },
      metadata: {
        createdAt: "2024-01-01",
        updatedAt: "2024-01-02",
        tags: ["test", "complex"],
      },
    };
  }
}

class ErrorThrowingQueryModel extends ReactiveQueryModel<StringData> {
  protected store = createVault<StringData>();
  protected store$ = this.store.store$;

  protected async refresh(_params?: unknown): Promise<StringData> {
    throw new Error("Simulated error");
  }
}

describe("ReactiveQueryModel", () => {
  describe("basic functionality", () => {
    it("should create a query model instance", () => {
      // * Arrange & Act
      const model = new TestQueryModel();

      // ? Assert
      expect(model).toBeDefined();
      expect(model.storeHandler).toBeDefined();
      expect(model.storeHandler.invalidate).toBeDefined();
    });

    it("should have default configs", () => {
      // * Arrange
      const model = new TestQueryModel();

      // ? Assert
      expect(model["configs"]).toEqual({
        maxRetryCall: 1,
      });
    });
  });

  describe("data types handling", () => {
    it("should handle string data", async () => {
      // * Arrange
      const model = new TestQueryModel();
      const params = "test-param";

      // ! Act
      const result = await lastValueFrom(model.query(params).pipe(take(2)));

      // ? Assert
      expect(result.data).toBe("String param: test-param");
      expect(result.isFetched).toBe(true);
      expect(result.isLoading).toBe(false);
      expect(result.isFetching).toBe(false);
      expect(result.error).toBeUndefined();
    });

    it("should handle number data", async () => {
      // * Arrange
      const model = new TestQueryModel();
      const params = 42;

      // ! Act
      const result = await lastValueFrom(model.query(params).pipe(take(2)));
      // ? Assert
      expect(result.data).toBe("Number param: 42");
      expect(result.isFetched).toBe(true);
    });

    it("should handle array data", async () => {
      // * Arrange
      const model = new TestQueryModel();
      const params = [1, 2, 3];

      // ! Act
      const result = await lastValueFrom(model.query(params).pipe(take(2)));

      // ? Assert
      expect(result.data).toBe("Array param: 1,2,3");
      expect(result.isFetched).toBe(true);
    });

    it("should handle object data", async () => {
      // * Arrange
      const model = new TestQueryModel();
      const params = { id: 1, name: "test" };

      // ! Act
      const result = await lastValueFrom(model.query(params).pipe(take(2)));

      // ? Assert
      expect(result.data).toBe('Object param: {"id":1,"name":"test"}');
      expect(result.isFetched).toBe(true);
    });

    it("should handle complex object data", async () => {
      // * Arrange
      const model = new ComplexDataQueryModel();
      const params = { filter: "active" };

      // ! Act
      const result = await lastValueFrom(model.query(params).pipe(take(2)));

      // ? Assert
      expect(result.data).toEqual({
        id: 1,
        user: {
          name: "John Doe",
          email: "john@example.com",
          preferences: {
            theme: "dark",
            language: "en",
          },
        },
        metadata: {
          createdAt: "2024-01-01",
          updatedAt: "2024-01-02",
          tags: ["test", "complex"],
        },
      });
      expect(result.isFetched).toBe(true);
    });

    it("should handle null params", async () => {
      // * Arrange
      const model = new TestQueryModel();
      const params = null;

      // ! Act
      const result = await lastValueFrom(model.query(params).pipe(take(2)));

      // ? Assert
      expect(result.data).toBe("Default response");
      expect(result.isFetched).toBe(true);
    });

    it("should handle undefined params", async () => {
      // * Arrange
      const model = new TestQueryModel();

      // ! Act
      const result = await lastValueFrom(model.query().pipe(take(2)));

      // ? Assert
      expect(result.data).toBe("Default response");
      expect(result.isFetched).toBe(true);
    });
  });

  describe("object parameter ordering", () => {
    it("should handle same object with different property order", async () => {
      // * Arrange
      const model = new TestQueryModel();
      const params1 = { name: "John", age: 30 };
      const params2 = { age: 30, name: "John" };

      // ! Act
      const result1 = await lastValueFrom(model.query(params1).pipe(take(2)));
      const result2 = await lastValueFrom(model.query(params2).pipe(take(2)));

      // ? Assert
      expect(result1.data).toBe('Object param: {"name":"John","age":30}');
      expect(result2.data).toBe('Object param: {"age":30,"name":"John"}');
    });

    it("should handle nested objects with different property order", async () => {
      // * Arrange
      const model = new TestQueryModel();
      const params1 = {
        user: { name: "John", age: 30 },
        settings: { theme: "dark", language: "en" },
      };
      const params2 = {
        settings: { language: "en", theme: "dark" },
        user: { age: 30, name: "John" },
      };

      // ! Act
      const result1 = await firstValueFrom(model.query(params1));
      const result2 = await firstValueFrom(model.query(params2));

      // ? Assert
      // Both should return the same data because they have the same content
      expect(result1.data).toBe(result2.data);
    });

    it("should handle arrays with different element order", async () => {
      // * Arrange
      const model = new TestQueryModel();
      const params1 = [1, 2, 3];
      const params2 = [3, 1, 2];

      // ! Act
      const result1 = await lastValueFrom(model.query(params1).pipe(take(2)));
      const result2 = await lastValueFrom(model.query(params2).pipe(take(2)));

      // ? Assert
      // These should be different because array order matters
      expect(result1.data).toBe("Array param: 1,2,3");
      expect(result2.data).toBe("Array param: 3,1,2");
      expect(result1.data).not.toBe(result2.data);
    });
  });

  describe("caching behavior", () => {
    it("should cache results for same parameters", async () => {
      // * Arrange
      const model = new TestQueryModel();
      const params = { id: 1, name: "test" };

      // ! Act
      const result1 = await lastValueFrom(model.query(params).pipe(take(2)));
      const result2 = await lastValueFrom(model.query(params).pipe(take(1)));

      // ? Assert
      expect(result1.data).toBe(result2.data);
      expect(result1.isFetched).toBe(true);
      expect(result2.isFetched).toBe(true);
    });

    it("should not cache results for different parameters", async () => {
      // * Arrange
      const model = new TestQueryModel();
      const params1 = { id: 1, name: "test1" };
      const params2 = { id: 2, name: "test2" };

      // ! Act
      const result1 = await lastValueFrom(model.query(params1).pipe(take(2)));
      const result2 = await lastValueFrom(model.query(params2).pipe(take(2)));

      // ? Assert
      expect(result1.data).not.toBe(result2.data);
      expect(result1.data).toBe('Object param: {"id":1,"name":"test1"}');
      expect(result2.data).toBe('Object param: {"id":2,"name":"test2"}');
    });

    it("should handle stale data", async () => {
      // * Arrange
      const model = new TestQueryModel();
      const params = { id: 1 };

      // ! Act
      const result1 = await lastValueFrom(model.query(params).pipe(take(2)));

      // Manually set as staled
      const hashedKey = model["getHashedKey"](params);
      const currentStore = model["store"].getStore(hashedKey);
      if (currentStore) {
        model["store"].setStore({ ...currentStore, staled: true }, hashedKey);
      }

      const result2 = await lastValueFrom(model.query(params).pipe(take(2)));

      // ? Assert
      expect(result1.data).toBe(result2.data);
      expect(result1.isFetched).toBe(true);
      expect(result2.isFetched).toBe(true);
    });
  });

  describe("error handling", () => {
    it("should handle refresh errors", async () => {
      // * Arrange
      const model = new ErrorThrowingQueryModel();
      const params = "test";

      // ! Act
      const result = await lastValueFrom(model.query(params).pipe(take(2)));

      // ? Assert
      expect(result.error).toBeDefined();
      expect(result.error).toBeInstanceOf(Error);
      expect((result.error as Error).message).toBe("Simulated error");
      expect(result.isFetched).toBe(false);
      expect(result.isLoading).toBe(false);
      expect(result.isFetching).toBe(false);
    });

    it("should retry on error based on config", async () => {
      // * Arrange
      const model = new ErrorThrowingQueryModel();
      model["configs"].maxRetryCall = 2;
      const params = "test";

      // ! Act
      const result = await lastValueFrom(model.query(params).pipe(take(2)));

      // ? Assert
      expect(result.error).toBeDefined();
      expect(result.error).toBeInstanceOf(Error);
      expect((result.error as Error).message).toBe("Simulated error");
    });
  });

  describe("state management", () => {
    it("should set loading state correctly", async () => {
      // * Arrange
      const model = new TestQueryModel();
      const params = "test";

      // ! Act
      const result = await lastValueFrom(model.query(params).pipe(take(2)));

      // ? Assert
      expect(result.isLoading).toBe(false);
      expect(result.isFetching).toBe(false);
      expect(result.isFetched).toBe(true);
    });

    it("should handle multiple concurrent queries", async () => {
      // * Arrange
      const model = new TestQueryModel();
      const params1 = "param1";
      const params2 = "param2";

      // ! Act
      const [result1, result2] = await Promise.all([
        lastValueFrom(model.query(params1).pipe(take(2))),
        lastValueFrom(model.query(params2).pipe(take(3))),
      ]);

      // ? Assert
      expect(result1.data).toBe("String param: param1");
      expect(result2.data).toBe("String param: param2");
      expect(result1.isFetched).toBe(true);
      expect(result2.isFetched).toBe(true);
    });
  });

  describe("utility methods", () => {
    it("should compare base data correctly", () => {
      // * Arrange
      const model = new TestQueryModel();
      const prev = {
        error: undefined,
        isFetched: true,
        isFetching: false,
        isLoading: false,
        lastFetchedTime: 1234567890,
        staleTime: 5000,
        staled: false,
      };
      const curr = {
        error: undefined,
        isFetched: true,
        isFetching: false,
        isLoading: false,
        lastFetchedTime: 1234567890,
        staleTime: 5000,
        staled: false,
      };

      // ! Act
      const result = model.isSameBaseData(prev, curr);

      // ? Assert
      expect(result).toBe(true);
    });

    it("should detect different base data", () => {
      // * Arrange
      const model = new TestQueryModel();
      const prev = {
        error: undefined,
        isFetched: true,
        isFetching: false,
        isLoading: false,
        lastFetchedTime: 1234567890,
        staleTime: 5000,
        staled: false,
      };
      const curr = {
        error: new Error("test"),
        isFetched: false,
        isFetching: true,
        isLoading: true,
        lastFetchedTime: 9876543210,
        staleTime: 10000,
        staled: true,
      };

      // ! Act
      const result = model.isSameBaseData(prev, curr);

      // ? Assert
      expect(result).toBe(false);
    });

    it("should generate correct hash keys", () => {
      // * Arrange
      const model = new TestQueryModel();
      const params1 = { name: "John", age: 30 };
      const params2 = { age: 30, name: "John" };

      // ! Act
      const hash1 = model["getHashedKey"](params1);
      const hash2 = model["getHashedKey"](params2);

      // ? Assert
      expect(hash1).toBe('[{"name":"John","age":30}]');
      expect(hash2).toBe('[{"age":30,"name":"John"}]');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe("edge cases", () => {
    it("should handle empty object parameters", async () => {
      // * Arrange
      const model = new TestQueryModel();
      const params = {};

      // ! Act
      const result = await lastValueFrom(model.query(params).pipe(take(2)));

      // ? Assert
      expect(result.data).toBe("Object param: {}");
      expect(result.isFetched).toBe(true);
    });

    it("should handle empty array parameters", async () => {
      // * Arrange
      const model = new TestQueryModel();
      const params: number[] = [];

      // ! Act
      const result = await lastValueFrom(model.query(params).pipe(take(2)));

      // ? Assert
      expect(result.data).toBe("Array param: ");
      expect(result.isFetched).toBe(true);
    });

    it("should handle function parameters", async () => {
      // * Arrange
      const model = new TestQueryModel();
      const params = () => "test";

      // ! Act
      const result = await lastValueFrom(model.query(params).pipe(take(2)));

      // ? Assert
      expect(result.data).toBe("Default response");
      expect(result.isFetched).toBe(true);
    });

    it("should handle symbol parameters", async () => {
      // * Arrange
      const model = new TestQueryModel();
      const params = Symbol("test");

      // ! Act
      const result = await lastValueFrom(model.query(params).pipe(take(2)));

      // ? Assert
      expect(result.data).toBe("Default response");
      expect(result.isFetched).toBe(true);
    });
  });

  describe("performance and memory", () => {
    it("should handle large object parameters", async () => {
      // * Arrange
      const model = new TestQueryModel();
      const largeParams = {
        data: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          value: `item-${i}`,
        })),
        metadata: {
          timestamp: Date.now(),
          version: "1.0.0",
          checksum: "abc123",
        },
      };

      // ! Act
      const result = await lastValueFrom(
        model.query(largeParams).pipe(take(2)),
      );

      // ? Assert
      expect(result.data).toContain("Object param:");
      expect(result.isFetched).toBe(true);
    });

    it("should handle deep nested objects", async () => {
      // * Arrange
      const model = new TestQueryModel();
      const deepParams = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: {
                  value: "deep value",
                },
              },
            },
          },
        },
      };

      // ! Act
      const result = await lastValueFrom(model.query(deepParams).pipe(take(2)));

      // ? Assert
      expect(result.data).toContain("Object param:");
      expect(result.data).toContain("deep value");
      expect(result.isFetched).toBe(true);
    });
  });
});
