/**
 * @file sms.interfaces.ts
 * @description Defines SMS-specific interfaces and types that extend the standardized notification schemas.
 * This file provides type definitions for SMS notification payloads, delivery responses, configuration options,
 * and error types to ensure type safety and consistency between the SMS channel and the broader notification system.
 */

import { NotificationErrorCategory } from '@austa/interfaces/notification';
import { IChannelConfig, IChannelProvider, IDeliveryError, IDeliveryResult } from '../../interfaces/notification-channel.interface';
import { ISmsNotificationPayload } from '../../interfaces/notification-payload.interface';
import { IHealthJourneyPayload, ICareJourneyPayload, IPlanJourneyPayload, IGamificationPayload } from '../../interfaces/notification-payload.interface';

/**
 * SMS channel specific configuration that extends the base channel configuration.
 */
export interface ISmsChannelConfig extends IChannelConfig {
  /** SMS provider account SID (Twilio) */
  accountSid: string;
  
  /** SMS provider authentication token */
  authToken: string;
  
  /** Default sender phone number */
  defaultFrom: string;
  
  /** Maximum message length before splitting */
  maxMessageLength: number;
  
  /** Whether to split long messages into multiple SMS */
  splitLongMessages: boolean;
  
  /** Country code to prepend to phone numbers without one */
  defaultCountryCode?: string;
  
  /** Whether to validate phone numbers before sending */
  validatePhoneNumbers: boolean;
  
  /** Whether to include journey branding in messages */
  includeJourneyBranding: boolean;
}

/**
 * SMS provider interface for Twilio integration.
 */
export interface ITwilioSmsProvider extends IChannelProvider {
  /** Twilio client instance */
  twilioClient: any; // Using 'any' here as we don't want to import the Twilio types directly
  
  /** Sends an SMS message using the Twilio API */
  sendMessage(to: string, from: string, body: string, options?: ITwilioSendOptions): Promise<ITwilioMessageResponse>;
  
  /** Validates a phone number format */
  validatePhoneNumber(phoneNumber: string): boolean;
  
  /** Formats a phone number for delivery */
  formatPhoneNumber(phoneNumber: string, countryCode?: string): string;
}

/**
 * Options for sending SMS messages through Twilio.
 */
export interface ITwilioSendOptions {
  /** Status callback URL for delivery notifications */
  statusCallback?: string;
  
  /** Whether to validate the recipient's phone number */
  validateNumber?: boolean;
  
  /** Maximum price in USD that you are willing to pay to send the message */
  maxPrice?: number;
  
  /** Whether to attempt delivery if the destination is a landline */
  attemptDeliveryToLandline?: boolean;
  
  /** Whether to force delivery even if the recipient has opted out */
  forceDelivery?: boolean;
  
  /** Validity period in seconds */
  validityPeriod?: number;
  
  /** Media URLs to include (MMS) */
  mediaUrls?: string[];
}

/**
 * Twilio message response structure.
 */
export interface ITwilioMessageResponse {
  /** Unique identifier for the message */
  sid: string;
  
  /** Date the message was created */
  dateCreated: string;
  
  /** Date the message was updated */
  dateUpdated: string;
  
  /** Date the message was sent */
  dateSent: string | null;
  
  /** Account SID that created the message */
  accountSid: string;
  
  /** Phone number that sent the message */
  from: string;
  
  /** Phone number that received the message */
  to: string;
  
  /** Message body */
  body: string;
  
  /** Current status of the message */
  status: ITwilioMessageStatus;
  
  /** Number of segments the message was split into */
  numSegments: string;
  
  /** Direction of the message (inbound or outbound-api) */
  direction: 'inbound' | 'outbound-api';
  
  /** API version used to process the message */
  apiVersion: string;
  
  /** Price of the message in the currency specified */
  price: string | null;
  
  /** Currency in which price is measured */
  priceUnit: string | null;
  
  /** URL of the message resource */
  uri: string;
  
  /** Any error codes returned */
  errorCode?: string;
  
  /** Error message if the message failed */
  errorMessage?: string;
}

/**
 * Possible status values for Twilio messages.
 */
export type ITwilioMessageStatus = 
  | 'accepted'
  | 'queued'
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'undelivered'
  | 'failed'
  | 'received';

/**
 * SMS delivery result that extends the base delivery result.
 */
export interface ISmsDeliveryResult extends IDeliveryResult {
  /** Provider-specific response details */
  providerResponse?: ITwilioMessageResponse;
  
  /** Number of SMS segments sent */
  segments?: number;
  
  /** Cost of sending the SMS (if available) */
  cost?: {
    amount: string;
    currency: string;
  };
  
  /** Whether the message was split into multiple SMS */
  wasSplit?: boolean;
  
  /** Phone number the message was sent to (formatted) */
  phoneNumber?: string;
  
  /** Phone number the message was sent from */
  sender?: string;
}

/**
 * SMS-specific error types.
 */
export enum SmsErrorType {
  /** Invalid phone number format */
  INVALID_PHONE_NUMBER = 'INVALID_PHONE_NUMBER',
  
  /** Phone number is a landline that cannot receive SMS */
  LANDLINE_PHONE_NUMBER = 'LANDLINE_PHONE_NUMBER',
  
  /** Phone number is not in service */
  PHONE_NUMBER_NOT_IN_SERVICE = 'PHONE_NUMBER_NOT_IN_SERVICE',
  
  /** Message content is too long */
  MESSAGE_TOO_LONG = 'MESSAGE_TOO_LONG',
  
  /** Provider account has insufficient funds */
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  
  /** Provider API authentication failed */
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  
  /** Provider API rate limit exceeded */
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  /** Provider service is unavailable */
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  
  /** Recipient has opted out of messages */
  RECIPIENT_OPTED_OUT = 'RECIPIENT_OPTED_OUT',
  
  /** Message contains prohibited content */
  PROHIBITED_CONTENT = 'PROHIBITED_CONTENT',
  
  /** Unknown error */
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * SMS-specific delivery error that extends the base delivery error.
 */
export interface ISmsDeliveryError extends IDeliveryError {
  /** SMS-specific error type */
  smsErrorType: SmsErrorType;
  
  /** Twilio error code (if available) */
  twilioErrorCode?: string;
  
  /** Whether the error is related to the phone number */
  isPhoneNumberError: boolean;
  
  /** Whether the error is related to the message content */
  isMessageContentError: boolean;
  
  /** Whether the error is related to the provider account */
  isAccountError: boolean;
  
  /** Whether the error is likely to be resolved by retrying */
  isRetryable: boolean;
  
  /** Suggested corrective action */
  suggestedAction?: 'validate_phone' | 'shorten_message' | 'check_account' | 'contact_support';
}

/**
 * Maps Twilio error codes to SMS error types.
 */
export interface ITwilioErrorMapping {
  [twilioErrorCode: string]: {
    smsErrorType: SmsErrorType;
    category: NotificationErrorCategory;
    isTransient: boolean;
    isRetryable: boolean;
    suggestedAction?: 'validate_phone' | 'shorten_message' | 'check_account' | 'contact_support';
  };
}

/**
 * Extended SMS notification payload for health journey.
 */
export interface IHealthJourneySmsPayload extends ISmsNotificationPayload {
  /** Journey-specific data */
  data: IHealthJourneyPayload;
  
  /** Whether to include health metrics in the message */
  includeMetrics?: boolean;
  
  /** Whether to include goal progress in the message */
  includeGoalProgress?: boolean;
  
  /** Whether to include a deep link to the health section */
  includeDeepLink?: boolean;
}

/**
 * Extended SMS notification payload for care journey.
 */
export interface ICareJourneySmsPayload extends ISmsNotificationPayload {
  /** Journey-specific data */
  data: ICareJourneyPayload;
  
  /** Whether to include appointment details in the message */
  includeAppointmentDetails?: boolean;
  
  /** Whether to include provider contact information */
  includeProviderContact?: boolean;
  
  /** Whether to include a deep link to the care section */
  includeDeepLink?: boolean;
}

/**
 * Extended SMS notification payload for plan journey.
 */
export interface IPlanJourneySmsPayload extends ISmsNotificationPayload {
  /** Journey-specific data */
  data: IPlanJourneyPayload;
  
  /** Whether to include claim details in the message */
  includeClaimDetails?: boolean;
  
  /** Whether to include benefit information */
  includeBenefitInfo?: boolean;
  
  /** Whether to include a deep link to the plan section */
  includeDeepLink?: boolean;
}

/**
 * Extended SMS notification payload for gamification.
 */
export interface IGamificationSmsPayload extends ISmsNotificationPayload {
  /** Journey-specific data */
  data: IGamificationPayload;
  
  /** Whether to include achievement details in the message */
  includeAchievementDetails?: boolean;
  
  /** Whether to include XP earned information */
  includeXpInfo?: boolean;
  
  /** Whether to include a deep link to the achievements section */
  includeDeepLink?: boolean;
}

/**
 * Union type for journey-specific SMS notification payloads.
 */
export type IJourneySmsPayload =
  | IHealthJourneySmsPayload
  | ICareJourneySmsPayload
  | IPlanJourneySmsPayload
  | IGamificationSmsPayload;