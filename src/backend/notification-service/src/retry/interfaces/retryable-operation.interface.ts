/**
 * Interface for operations that can be retried.
 * Provides methods for executing the operation and retrieving its payload and metadata.
 */
export interface IRetryableOperation {
  /**
   * Executes the operation.
   * 
   * @returns Promise that resolves when the operation completes successfully
   * @throws Error if the operation fails
   */
  execute(): Promise<void>;

  /**
   * Gets the payload of the operation.
   * This is used for storing the operation in the DLQ if it fails.
   * 
   * @returns The operation payload
   */
  getPayload(): any;

  /**
   * Gets metadata about the operation.
   * This can include information about the context, source, and purpose of the operation.
   * 
   * @returns Metadata object
   */
  getMetadata(): Record<string, any>;
}