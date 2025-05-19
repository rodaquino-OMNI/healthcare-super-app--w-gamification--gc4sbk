import { DeviceConnection } from './device';
import { HealthMetric } from './metric';

/**
 * Interface defining the contract for wearable device adapters.
 * All wearable-specific adapters must implement this interface.
 * 
 * @interface WearableAdapter
 */
export interface WearableAdapter {
  /**
   * Initiates the connection to a wearable device.
   * 
   * @param userId - The user ID to associate with the device connection
   * @returns A promise resolving to a DeviceConnection entity
   */
  connect(userId: string): Promise<DeviceConnection>;

  /**
   * Retrieves health metrics from a wearable device for a specific date range.
   * 
   * @param userId - The user ID associated with the device connection
   * @param startDate - The start date for retrieving metrics
   * @param endDate - The end date for retrieving metrics
   * @returns A promise resolving to an array of HealthMetric entities
   */
  getHealthMetrics(userId: string, startDate: Date, endDate: Date): Promise<HealthMetric[]>;

  /**
   * Disconnects a wearable device from a user's profile.
   * 
   * @param userId - The user ID associated with the device connection
   * @returns A promise that resolves when the device has been disconnected
   */
  disconnect(userId: string): Promise<void>;
}

/**
 * Enum defining the supported wearable device types.
 */
export enum WearableDeviceType {
  GOOGLE_FIT = 'googlefit',
  HEALTH_KIT = 'healthkit',
  FITBIT = 'fitbit',
  GARMIN = 'garmin',
  SAMSUNG_HEALTH = 'samsunghealth',
  WITHINGS = 'withings',
  OURA = 'oura',
  WHOOP = 'whoop'
}

/**
 * Enum defining the possible connection statuses for wearable devices.
 */
export enum ConnectionStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  PENDING = 'pending',
  ERROR = 'error'
}

/**
 * Interface defining the configuration options for wearable device connections.
 */
export interface WearableConnectionOptions {
  /**
   * The OAuth client ID for the wearable service.
   */
  clientId: string;
  
  /**
   * The OAuth client secret for the wearable service.
   */
  clientSecret: string;
  
  /**
   * The OAuth redirect URI for the wearable service.
   */
  redirectUri: string;
  
  /**
   * The scopes to request from the wearable service.
   */
  scopes: string[];
  
  /**
   * Additional options specific to the wearable service.
   */
  additionalOptions?: Record<string, any>;
}