import { NotificationChannel, NotificationType, NotificationPriority } from '@austa/interfaces/notification/types';
import { INotificationBase, INotificationMetadata } from '@austa/interfaces/common';
import { IHealthJourneyPayload, ICareJourneyPayload, IPlanJourneyPayload, IGamificationJourneyPayload } from '@austa/interfaces/journey';
import { ISmsNotificationPayload } from '../../../interfaces/notification-payload.interface';
import { ISmsChannel, ISmsChannelCapabilities, ISmsChannelConfig, IChannelDeliveryResult, IChannelError, FailureClassification } from '../../../interfaces/notification-channel.interface';

/**
 * SMS-specific notification payload with additional SMS properties
 * Extends the base SMS notification payload from notification-payload.interface.ts
 */
export interface ISmsPayload extends ISmsNotificationPayload {
  /**
   * SMS message content (limited to 160 characters for standard SMS)
   * For longer messages, concatenation may be used if supported by the provider
   */
  message: string;

  /**
   * Optional metadata specific to SMS delivery
   */
  smsMetadata?: ISmsMetadata;
}

/**
 * SMS-specific metadata for tracking and configuration
 */
export interface ISmsMetadata extends INotificationMetadata {
  /**
   * Whether to use Unicode encoding for the message
   * Note: Unicode messages have a lower character limit (70 characters)
   */
  useUnicode?: boolean;

  /**
   * Whether to concatenate messages that exceed the character limit
   * If false, the message will be truncated to fit within the limit
   */
  allowConcatenation?: boolean;

  /**
   * Maximum number of message parts for concatenated messages
   * Typically limited to 3-5 parts depending on the provider
   */
  maxConcatenatedParts?: number;

  /**
   * Whether to include a prefix in the message (e.g., "AUSTA: ")
   */
  includePrefix?: boolean;

  /**
   * Whether to include opt-out instructions in the message
   */
  includeOptOut?: boolean;
}

/**
 * Twilio SMS message response interface
 * Maps to the response structure returned by the Twilio API
 */
export interface ITwilioMessageResponse {
  /**
   * Unique identifier for the message in Twilio's system
   */
  sid: string;

  /**
   * Date and time when the message was created
   */
  dateCreated: string;

  /**
   * Date and time when the message was updated
   */
  dateUpdated: string;

  /**
   * Date and time when the message was sent
   */
  dateSent: string | null;

  /**
   * Account SID that created the message
   */
  accountSid: string;

  /**
   * Phone number that sent the message
   */
  from: string;

  /**
   * Phone number that received the message
   */
  to: string;

  /**
   * Message body
   */
  body: string;

  /**
   * Current status of the message
   */
  status: TwilioMessageStatus;

  /**
   * Number of message segments
   */
  numSegments: string;

  /**
   * Number of media attachments
   */
  numMedia: string;

  /**
   * Direction of the message (inbound or outbound)
   */
  direction: 'inbound' | 'outbound-api' | 'outbound-call' | 'outbound-reply';

  /**
   * API version used to process the message
   */
  apiVersion: string;

  /**
   * Price of the message (if available)
   */
  price: string | null;

  /**
   * Currency of the price (if available)
   */
  priceUnit: string | null;

  /**
   * URL of the message resource
   */
  uri: string;

  /**
   * Any error information for the message
   */
  errorMessage: string | null;

  /**
   * Error code if the message failed
   */
  errorCode: number | null;
}

/**
 * Twilio message status types
 * Based on Twilio's message status lifecycle
 */
export type TwilioMessageStatus = 
  | 'accepted' 
  | 'queued' 
  | 'sending' 
  | 'sent' 
  | 'delivered' 
  | 'undelivered' 
  | 'failed'
  | 'receiving'
  | 'received';

/**
 * Maps Twilio message status to standardized notification status
 */
export interface ITwilioStatusMapping {
  /**
   * Maps from Twilio status to internal notification status
   */
  [key in TwilioMessageStatus]: 'pending' | 'sent' | 'delivered' | 'failed';
}

/**
 * Twilio error codes and their classifications for retry decisions
 */
export interface ITwilioErrorClassification {
  /**
   * Maps Twilio error codes to failure classifications
   */
  [errorCode: number]: FailureClassification;
}

/**
 * SMS delivery result extending the channel delivery result
 */
export interface ISmsDeliveryResult extends IChannelDeliveryResult {
  /**
   * Twilio message SID for reference
   */
  messageSid?: string;

  /**
   * Number of message segments sent
   */
  segments?: number;

  /**
   * Delivery status from the provider
   */
  providerStatus?: TwilioMessageStatus;

  /**
   * Cost of the message if available
   */
  cost?: {
    amount: string;
    currency: string;
  };
}

/**
 * SMS error extending the channel error
 */
export interface ISmsError extends IChannelError {
  /**
   * Twilio-specific error code
   */
  twilioErrorCode?: number;

  /**
   * Whether the error is related to the recipient's phone number
   */
  isRecipientError?: boolean;

  /**
   * Whether the error is related to message content
   */
  isContentError?: boolean;
}

/**
 * SMS delivery options
 */
export interface ISmsDeliveryOptions {
  /**
   * Sender phone number or sender ID
   * If not provided, the default sender from configuration will be used
   */
  from?: string;

  /**
   * Whether to request delivery receipt
   */
  requestDeliveryReceipt?: boolean;

  /**
   * Validity period in seconds
   * How long the message is valid for delivery before expiring
   */
  validityPeriod?: number;

  /**
   * Whether to allow alpha sender ID
   * Some regions support alphabetic sender IDs instead of phone numbers
   */
  allowAlphaSenderId?: boolean;

  /**
   * SMS encoding to use
   */
  encoding?: 'GSM' | 'UCS2';

  /**
   * Maximum number of segments to use for the message
   */
  maxSegments?: number;

  /**
   * Smart encoding to automatically detect and optimize encoding
   */
  smartEncoding?: boolean;
}

/**
 * Journey-specific SMS payload interfaces
 */

/**
 * Health journey SMS payload
 */
export interface IHealthJourneySmsPayload extends ISmsPayload {
  /**
   * Health journey-specific data
   */
  data: IHealthJourneyPayload;
}

/**
 * Care journey SMS payload
 */
export interface ICareJourneySmsPayload extends ISmsPayload {
  /**
   * Care journey-specific data
   */
  data: ICareJourneyPayload;
}

/**
 * Plan journey SMS payload
 */
export interface IPlanJourneySmsPayload extends ISmsPayload {
  /**
   * Plan journey-specific data
   */
  data: IPlanJourneyPayload;
}

/**
 * Gamification journey SMS payload
 */
export interface IGamificationJourneySmsPayload extends ISmsPayload {
  /**
   * Gamification journey-specific data
   */
  data: IGamificationJourneyPayload;
}

/**
 * SMS service interface
 */
export interface ISmsService {
  /**
   * Sends an SMS message
   * @param phoneNumber - The recipient's phone number
   * @param message - The message content to send
   * @param options - Optional delivery options
   * @returns A promise that resolves to the SMS delivery result
   */
  sendSms(phoneNumber: string, message: string, options?: ISmsDeliveryOptions): Promise<ISmsDeliveryResult>;

  /**
   * Validates a phone number format
   * @param phoneNumber - The phone number to validate
   * @returns True if the phone number is valid
   */
  validatePhoneNumber(phoneNumber: string): boolean;

  /**
   * Gets the status of a previously sent message
   * @param messageSid - The Twilio message SID
   * @returns A promise that resolves to the current message status
   */
  getMessageStatus(messageSid: string): Promise<TwilioMessageStatus>;

  /**
   * Formats a phone number to E.164 format
   * @param phoneNumber - The phone number to format
   * @param defaultCountryCode - The default country code to use if not specified
   * @returns The formatted phone number
   */
  formatPhoneNumber(phoneNumber: string, defaultCountryCode?: string): string;
}