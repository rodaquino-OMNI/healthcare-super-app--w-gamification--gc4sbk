/**
 * Represents metadata about a Kafka message that is passed to consumer callbacks.
 */
export interface KafkaMessage {
  /**
   * The message key, if provided.
   */
  key?: string;

  /**
   * The message headers as key-value pairs.
   */
  headers: Record<string, string>;

  /**
   * The topic the message was consumed from.
   */
  topic: string;

  /**
   * The partition the message was consumed from.
   */
  partition: number;

  /**
   * The offset of the message in the partition.
   */
  offset: string;

  /**
   * The timestamp of the message.
   */
  timestamp: string;
}