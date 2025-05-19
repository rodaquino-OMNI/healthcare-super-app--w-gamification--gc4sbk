/**
 * @file Provider interface for the Care journey
 * @description Defines the standard interface for healthcare provider data across the AUSTA SuperApp
 */

/**
 * Interface representing a healthcare provider.
 * Used for consistent typing across the Care journey services and client applications.
 */
export interface IProvider {
  /**
   * Unique identifier for the provider.
   */
  id: string;

  /**
   * Name of the provider.
   */
  name: string;

  /**
   * Medical specialty of the provider.
   */
  specialty: string;

  /**
   * Location of the provider's practice.
   */
  location: string;

  /**
   * Contact phone number of the provider.
   */
  phone: string;

  /**
   * Contact email address of the provider.
   */
  email: string;

  /**
   * Indicates whether the provider offers telemedicine services.
   */
  telemedicineAvailable: boolean;
}