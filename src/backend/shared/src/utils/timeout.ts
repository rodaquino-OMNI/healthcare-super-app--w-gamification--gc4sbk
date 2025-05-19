/**
 * Error thrown when a promise times out.
 */
export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Wraps a promise with a timeout.
 * If the promise doesn't resolve within the specified time, it will reject with a TimeoutError.
 * 
 * @param promise Promise to wrap with timeout
 * @param ms Timeout in milliseconds
 * @param errorMessage Optional custom error message
 * @returns Promise that will reject if the original promise doesn't resolve within the timeout
 */
export async function timeout<T>(
  promise: Promise<T>,
  ms: number,
  errorMessage: string = 'Operation timed out'
): Promise<T> {
  // Create a promise that rejects after the specified timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(new TimeoutError(errorMessage));
    }, ms);
  });
  
  // Race the original promise against the timeout
  return Promise.race([promise, timeoutPromise]);
}