/**
 * Helper method to handle and call a handler method recursively multiple times if it throws an error
 * @returns Promise that resolves to the response or rejects with the final error
 * @param handler Async method to call
 * @param maxCallTimes Times that you want to be called if it throws an error
 */
export const recursiveCallWithRetry = async <Response>(
  handler: () => Promise<Response>,
  maxCallTimes: number = 2,
  calledTimes: number = 0,
): Promise<Response> => {
  let timeToCall = calledTimes;
  timeToCall += 1;

  try {
    return await handler();
  } catch (error) {
    if (timeToCall >= maxCallTimes) {
      throw error;
    }

    return recursiveCallWithRetry(handler, maxCallTimes, timeToCall);
  }
};

export default recursiveCallWithRetry;
