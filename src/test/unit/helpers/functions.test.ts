import { recursiveCallWithRetry } from "@/helpers/functions";

describe("recursiveCallWithRetry", () => {
  describe("successful calls", () => {
    it("should return the result on first successful call", async () => {
      // * Arrange
      const expectedResult = { data: "success" };
      const handler = vi.fn().mockResolvedValue(expectedResult);

      // ! Act
      const result = await recursiveCallWithRetry(handler);

      // ? Assert
      expect(result).toEqual(expectedResult);
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should work with different data types", async () => {
      // * Arrange
      const stringResult = "test string";
      const numberResult = 42;
      const arrayResult = [1, 2, 3];
      const objectResult = { key: "value" };

      const stringHandler = vi.fn().mockResolvedValue(stringResult);
      const numberHandler = vi.fn().mockResolvedValue(numberResult);
      const arrayHandler = vi.fn().mockResolvedValue(arrayResult);
      const objectHandler = vi.fn().mockResolvedValue(objectResult);

      // ! Act & Assert
      expect(await recursiveCallWithRetry(stringHandler)).toBe(stringResult);
      expect(await recursiveCallWithRetry(numberHandler)).toBe(numberResult);
      expect(await recursiveCallWithRetry(arrayHandler)).toEqual(arrayResult);
      expect(await recursiveCallWithRetry(objectHandler)).toEqual(objectResult);
    });
  });

  describe("retry behavior", () => {
    it("should retry once and succeed on second attempt", async () => {
      // * Arrange
      const expectedResult = { data: "success" };
      const error = new Error("First attempt failed");
      const handler = vi
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(expectedResult);

      // ! Act
      const result = await recursiveCallWithRetry(handler, 2);

      // ? Assert
      expect(result).toEqual(expectedResult);
      expect(handler).toHaveBeenCalledTimes(2);
    });

    it("should retry twice and succeed on third attempt", async () => {
      // * Arrange
      const expectedResult = { data: "success" };
      const error1 = new Error("First attempt failed");
      const error2 = new Error("Second attempt failed");
      const handler = vi
        .fn()
        .mockRejectedValueOnce(error1)
        .mockRejectedValueOnce(error2)
        .mockResolvedValueOnce(expectedResult);

      // ! Act
      const result = await recursiveCallWithRetry(handler, 3);

      // ? Assert
      expect(result).toEqual(expectedResult);
      expect(handler).toHaveBeenCalledTimes(3);
    });

    it("should use default maxCallTimes of 2", async () => {
      // * Arrange
      const expectedResult = { data: "success" };
      const error = new Error("First attempt failed");
      const handler = vi
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(expectedResult);

      // ! Act
      const result = await recursiveCallWithRetry(handler);

      // ? Assert
      expect(result).toEqual(expectedResult);
      expect(handler).toHaveBeenCalledTimes(2);
    });
  });

  describe("error handling", () => {
    it("should throw error after max retries exceeded", async () => {
      // * Arrange
      const error1 = new Error("First attempt failed");
      const error2 = new Error("Second attempt failed");
      const finalError = new Error("Final attempt failed");
      const handler = vi
        .fn()
        .mockRejectedValueOnce(error1)
        .mockRejectedValueOnce(error2)
        .mockRejectedValueOnce(finalError);

      // ! Act & Assert
      await expect(recursiveCallWithRetry(handler, 2)).rejects.toThrow(
        "Second attempt failed",
      );
      expect(handler).toHaveBeenCalledTimes(2);
    });

    it("should throw error immediately when maxCallTimes is 1", async () => {
      // * Arrange
      const error = new Error("Operation failed");
      const handler = vi.fn().mockRejectedValue(error);

      // ! Act & Assert
      await expect(recursiveCallWithRetry(handler, 1)).rejects.toThrow(
        "Operation failed",
      );
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should throw error when maxCallTimes is 0", async () => {
      // * Arrange
      const error = new Error("Operation failed");
      const handler = vi.fn().mockRejectedValue(error);

      // ! Act & Assert
      await expect(recursiveCallWithRetry(handler, 0)).rejects.toThrow(
        "Operation failed",
      );
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should preserve the original error message", async () => {
      // * Arrange
      const customError = new Error("Custom error message");
      const handler = vi
        .fn()
        .mockRejectedValueOnce(customError)
        .mockRejectedValueOnce(customError);

      // ! Act & Assert
      await expect(recursiveCallWithRetry(handler, 2)).rejects.toThrow(
        "Custom error message",
      );
    });

    it("should handle different error types", async () => {
      // * Arrange
      const typeError = new TypeError("Type error");
      const referenceError = new ReferenceError("Reference error");
      const handler = vi
        .fn()
        .mockRejectedValueOnce(typeError)
        .mockRejectedValueOnce(referenceError);

      // ! Act & Assert
      await expect(recursiveCallWithRetry(handler, 2)).rejects.toThrow(
        "Reference error",
      );
    });
  });

  describe("edge cases", () => {
    it("should handle async functions that return immediately", async () => {
      // * Arrange
      const handler = vi.fn().mockImplementation(async () => {
        return "immediate result";
      });

      // ! Act
      const result = await recursiveCallWithRetry(handler);

      // ? Assert
      expect(result).toBe("immediate result");
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should handle async functions with delays", async () => {
      // * Arrange
      const handler = vi.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return "delayed result";
      });

      // ! Act
      const result = await recursiveCallWithRetry(handler);

      // ? Assert
      expect(result).toBe("delayed result");
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should handle functions that throw synchronously", async () => {
      // * Arrange
      const error = new Error("Synchronous error");
      const handler = vi.fn().mockImplementation(() => {
        throw error;
      });

      // ! Act & Assert
      await expect(recursiveCallWithRetry(handler, 2)).rejects.toThrow(
        "Synchronous error",
      );
      expect(handler).toHaveBeenCalledTimes(2);
    });

    it("should handle functions that return undefined", async () => {
      // * Arrange
      const handler = vi.fn().mockResolvedValue(undefined);

      // ! Act
      const result = await recursiveCallWithRetry(handler);

      // ? Assert
      expect(result).toBeUndefined();
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should handle functions that return null", async () => {
      // * Arrange
      const handler = vi.fn().mockResolvedValue(null);

      // ! Act
      const result = await recursiveCallWithRetry(handler);

      // ? Assert
      expect(result).toBeNull();
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe("parameter validation", () => {
    it("should work with custom maxCallTimes", async () => {
      // * Arrange
      const expectedResult = { data: "success" };
      const error1 = new Error("First attempt failed");
      const error2 = new Error("Second attempt failed");
      const error3 = new Error("Third attempt failed");
      const handler = vi
        .fn()
        .mockRejectedValueOnce(error1)
        .mockRejectedValueOnce(error2)
        .mockRejectedValueOnce(error3)
        .mockResolvedValueOnce(expectedResult);

      // ! Act
      const result = await recursiveCallWithRetry(handler, 4);

      // ? Assert
      expect(result).toEqual(expectedResult);
      expect(handler).toHaveBeenCalledTimes(4);
    });

    it("should handle negative maxCallTimes as 1", async () => {
      // * Arrange
      const error = new Error("Operation failed");
      const handler = vi.fn().mockRejectedValue(error);

      // ! Act & Assert
      await expect(recursiveCallWithRetry(handler, -1)).rejects.toThrow(
        "Operation failed",
      );
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe("real-world scenarios", () => {
    it("should handle API calls that fail intermittently", async () => {
      // * Arrange
      let callCount = 0;
      const handler = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount < 3) {
          throw new Error(`API call failed (attempt ${callCount})`);
        }
        return { status: "success", data: "api response" };
      });

      // ! Act
      const result = await recursiveCallWithRetry(handler, 3);

      // ? Assert
      expect(result).toEqual({ status: "success", data: "api response" });
      expect(handler).toHaveBeenCalledTimes(3);
    });

    it("should handle network timeouts", async () => {
      // * Arrange
      const timeoutError = new Error("Request timeout");
      const handler = vi
        .fn()
        .mockRejectedValueOnce(timeoutError)
        .mockRejectedValueOnce(timeoutError)
        .mockResolvedValueOnce({ data: "network response" });

      // ! Act
      const result = await recursiveCallWithRetry(handler, 3);

      // ? Assert
      expect(result).toEqual({ data: "network response" });
      expect(handler).toHaveBeenCalledTimes(3);
    });
  });
});
