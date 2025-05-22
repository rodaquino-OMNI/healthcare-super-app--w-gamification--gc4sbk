/**
 * Represents a healthcare provider interface for the care journey.
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