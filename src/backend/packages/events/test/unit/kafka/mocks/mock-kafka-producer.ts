import { EventEmitter } from 'events';
import { Producer, Transaction, ProducerBatch, Message, TopicMessages, ProducerRecord } from 'kafkajs';

/**
 * Mock implementation of KafkaJS Producer for unit testing.
 * 
 * This class simulates the behavior of a real Kafka producer without requiring
 * an actual Kafka connection. It tracks produced messages for verification in tests
 * and supports testing error scenarios.
 */
export class MockKafkaProducer extends EventEmitter implements Producer {
  private connected: boolean = false;
  private sentMessages: Array<{ topic: string, messages: Message[] }> = [];
  private sentBatches: ProducerBatch[] = [];
  private shouldFailConnect: boolean = false;
  private shouldFailSend: boolean = false;
  private shouldFailSendBatch: boolean = false;
  private shouldFailTransaction: boolean = false;
  private shouldFailDisconnect: boolean = false;
  private transactionAborted: boolean = false;
  private transactionCommitted: boolean = false;

  /**
   * Creates a new MockKafkaProducer instance.
   */
  constructor() {
    super();
  }

  /**
   * Simulates connecting to a Kafka broker.
   * 
   * @returns A promise that resolves when the mock connection is established
   * @throws Error if shouldFailConnect is set to true
   */
  async connect(): Promise<void> {
    if (this.shouldFailConnect) {
      const error = new Error('Failed to connect producer');
      this.emit('producer.connect.error', error);
      throw error;
    }

    this.connected = true;
    this.emit('producer.connect');
  }

  /**
   * Simulates disconnecting from a Kafka broker.
   * 
   * @returns A promise that resolves when the mock disconnection is complete
   * @throws Error if shouldFailDisconnect is set to true
   */
  async disconnect(): Promise<void> {
    if (this.shouldFailDisconnect) {
      const error = new Error('Failed to disconnect producer');
      this.emit('producer.disconnect.error', error);
      throw error;
    }

    this.connected = false;
    this.emit('producer.disconnect');
  }

  /**
   * Simulates sending messages to a Kafka topic.
   * 
   * @param record - The producer record containing topic and messages
   * @returns A promise that resolves with the record metadata
   * @throws Error if shouldFailSend is set to true or if not connected
   */
  async send(record: ProducerRecord): Promise<any> {
    if (!this.connected) {
      const error = new Error('Producer not connected');
      this.emit('producer.send.error', error);
      throw error;
    }

    if (this.shouldFailSend) {
      const error = new Error('Failed to send messages');
      this.emit('producer.send.error', error);
      throw error;
    }

    // Store the sent messages for later verification
    this.sentMessages.push({
      topic: record.topic,
      messages: record.messages
    });

    this.emit('producer.send', record);
    
    // Return mock record metadata
    return {
      topicName: record.topic,
      partition: 0,
      errorCode: 0,
      baseOffset: '0',
      logAppendTime: '-1',
      logStartOffset: '0'
    };
  }

  /**
   * Simulates sending a batch of messages to Kafka topics.
   * 
   * @param batch - The producer batch containing topic messages
   * @returns A promise that resolves with the batch metadata
   * @throws Error if shouldFailSendBatch is set to true or if not connected
   */
  async sendBatch(batch: ProducerBatch): Promise<any> {
    if (!this.connected) {
      const error = new Error('Producer not connected');
      this.emit('producer.send.error', error);
      throw error;
    }

    if (this.shouldFailSendBatch) {
      const error = new Error('Failed to send batch');
      this.emit('producer.send.error', error);
      throw error;
    }

    // Store the sent batch for later verification
    this.sentBatches.push(batch);

    // Also track individual messages for consistency
    for (const topicMessages of batch.topicMessages) {
      this.sentMessages.push({
        topic: topicMessages.topic,
        messages: topicMessages.messages
      });
    }

    this.emit('producer.send', batch);

    // Return mock batch metadata
    return batch.topicMessages.map(topicMessage => ({
      topicName: topicMessage.topic,
      partition: 0,
      errorCode: 0,
      baseOffset: '0',
      logAppendTime: '-1',
      logStartOffset: '0'
    }));
  }

  /**
   * Simulates starting a Kafka transaction.
   * 
   * @returns A promise that resolves with a mock transaction
   * @throws Error if shouldFailTransaction is set to true or if not connected
   */
  async transaction(): Promise<Transaction> {
    if (!this.connected) {
      const error = new Error('Producer not connected');
      this.emit('producer.transaction.error', error);
      throw error;
    }

    if (this.shouldFailTransaction) {
      const error = new Error('Failed to start transaction');
      this.emit('producer.transaction.error', error);
      throw error;
    }

    this.transactionAborted = false;
    this.transactionCommitted = false;
    
    // Create a mock transaction
    const mockTransaction: Transaction = {
      send: async (record: ProducerRecord) => {
        if (this.transactionAborted) {
          throw new Error('Transaction was aborted');
        }
        
        // Store the sent messages with transaction flag
        this.sentMessages.push({
          topic: record.topic,
          messages: record.messages.map(msg => ({
            ...msg,
            // Add a flag to indicate this was part of a transaction
            headers: { ...msg.headers, transactional: Buffer.from('true') }
          }))
        });
        
        return {
          topicName: record.topic,
          partition: 0,
          errorCode: 0,
          baseOffset: '0',
          logAppendTime: '-1',
          logStartOffset: '0'
        };
      },
      
      sendBatch: async (batch: ProducerBatch) => {
        if (this.transactionAborted) {
          throw new Error('Transaction was aborted');
        }
        
        // Store the sent batch with transaction flag
        this.sentBatches.push(batch);
        
        // Also track individual messages
        for (const topicMessages of batch.topicMessages) {
          this.sentMessages.push({
            topic: topicMessages.topic,
            messages: topicMessages.messages.map(msg => ({
              ...msg,
              // Add a flag to indicate this was part of a transaction
              headers: { ...msg.headers, transactional: Buffer.from('true') }
            }))
          });
        }
        
        return batch.topicMessages.map(topicMessage => ({
          topicName: topicMessage.topic,
          partition: 0,
          errorCode: 0,
          baseOffset: '0',
          logAppendTime: '-1',
          logStartOffset: '0'
        }));
      },
      
      commit: async () => {
        if (this.transactionAborted) {
          throw new Error('Transaction was aborted');
        }
        
        this.transactionCommitted = true;
        this.emit('producer.transaction.commit');
      },
      
      abort: async () => {
        this.transactionAborted = true;
        this.emit('producer.transaction.abort');
      },
      
      sendOffsets: async ({ consumerGroupId, topics }) => {
        if (this.transactionAborted) {
          throw new Error('Transaction was aborted');
        }
        
        this.emit('producer.transaction.sendOffsets', { consumerGroupId, topics });
      }
    };
    
    this.emit('producer.transaction.start');
    return mockTransaction;
  }

  /**
   * Configures the mock producer to fail on connect.
   * 
   * @param shouldFail - Whether connect should fail
   */
  setConnectFailure(shouldFail: boolean): void {
    this.shouldFailConnect = shouldFail;
  }

  /**
   * Configures the mock producer to fail on send.
   * 
   * @param shouldFail - Whether send should fail
   */
  setSendFailure(shouldFail: boolean): void {
    this.shouldFailSend = shouldFail;
  }

  /**
   * Configures the mock producer to fail on sendBatch.
   * 
   * @param shouldFail - Whether sendBatch should fail
   */
  setSendBatchFailure(shouldFail: boolean): void {
    this.shouldFailSendBatch = shouldFail;
  }

  /**
   * Configures the mock producer to fail on transaction.
   * 
   * @param shouldFail - Whether transaction should fail
   */
  setTransactionFailure(shouldFail: boolean): void {
    this.shouldFailTransaction = shouldFail;
  }

  /**
   * Configures the mock producer to fail on disconnect.
   * 
   * @param shouldFail - Whether disconnect should fail
   */
  setDisconnectFailure(shouldFail: boolean): void {
    this.shouldFailDisconnect = shouldFail;
  }

  /**
   * Retrieves all messages sent by this producer.
   * 
   * @returns Array of sent messages grouped by topic
   */
  getSentMessages(): Array<{ topic: string, messages: Message[] }> {
    return this.sentMessages;
  }

  /**
   * Retrieves all batches sent by this producer.
   * 
   * @returns Array of sent batches
   */
  getSentBatches(): ProducerBatch[] {
    return this.sentBatches;
  }

  /**
   * Checks if a specific message was sent to a topic.
   * 
   * @param topic - The topic to check
   * @param predicate - Function to match the message
   * @returns True if a matching message was found
   */
  hasMessageBeenSent(topic: string, predicate: (message: Message) => boolean): boolean {
    return this.sentMessages.some(entry => 
      entry.topic === topic && entry.messages.some(predicate)
    );
  }

  /**
   * Clears all tracked messages and batches.
   */
  clearSentMessages(): void {
    this.sentMessages = [];
    this.sentBatches = [];
  }

  /**
   * Checks if the producer is connected.
   * 
   * @returns True if the producer is connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Checks if a transaction was committed.
   * 
   * @returns True if a transaction was committed
   */
  wasTransactionCommitted(): boolean {
    return this.transactionCommitted;
  }

  /**
   * Checks if a transaction was aborted.
   * 
   * @returns True if a transaction was aborted
   */
  wasTransactionAborted(): boolean {
    return this.transactionAborted;
  }
}