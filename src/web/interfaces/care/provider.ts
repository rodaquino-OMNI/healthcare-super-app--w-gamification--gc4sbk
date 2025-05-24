/**
 * @file Provider interface for the AUSTA SuperApp Care journey
 * 
 * This file defines the Provider interface which represents healthcare providers
 * available in the system. It includes properties for provider identification,
 * specialty, location, contact information, availability, and telemedicine capabilities.
 * 
 * The Provider interface is used throughout the Care journey for provider search,
 * appointment scheduling, and displaying provider information.
 */

import { Nullable } from '../common/types';

/**
 * Represents a medical specialty that a healthcare provider may practice
 */
export enum MedicalSpecialty {
  GENERAL_PRACTICE = 'GENERAL_PRACTICE',
  CARDIOLOGY = 'CARDIOLOGY',
  DERMATOLOGY = 'DERMATOLOGY',
  ENDOCRINOLOGY = 'ENDOCRINOLOGY',
  GASTROENTEROLOGY = 'GASTROENTEROLOGY',
  NEUROLOGY = 'NEUROLOGY',
  OBSTETRICS_GYNECOLOGY = 'OBSTETRICS_GYNECOLOGY',
  ONCOLOGY = 'ONCOLOGY',
  OPHTHALMOLOGY = 'OPHTHALMOLOGY',
  ORTHOPEDICS = 'ORTHOPEDICS',
  PEDIATRICS = 'PEDIATRICS',
  PSYCHIATRY = 'PSYCHIATRY',
  PULMONOLOGY = 'PULMONOLOGY',
  RHEUMATOLOGY = 'RHEUMATOLOGY',
  UROLOGY = 'UROLOGY',
  OTHER = 'OTHER',
}

/**
 * Represents a provider's certification status
 */
export enum ProviderCertificationStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
}

/**
 * Represents a geographic location with coordinates
 */
export interface GeoLocation {
  /** Latitude coordinate */
  latitude: number;
  /** Longitude coordinate */
  longitude: number;
}

/**
 * Represents a physical address
 */
export interface Address {
  /** Street name and number */
  street: string;
  /** Additional address details (apt, suite, etc.) */
  complement?: string;
  /** City name */
  city: string;
  /** State or province */
  state: string;
  /** Postal or ZIP code */
  postalCode: string;
  /** Country name */
  country: string;
  /** Geographic coordinates for mapping */
  coordinates?: GeoLocation;
}

/**
 * Represents a day of the week
 */
export enum DayOfWeek {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}

/**
 * Represents a time range with start and end times
 */
export interface TimeRange {
  /** Start time in 24-hour format (HH:MM) */
  startTime: string;
  /** End time in 24-hour format (HH:MM) */
  endTime: string;
}

/**
 * Represents a provider's availability for a specific day
 */
export interface DailyAvailability {
  /** Day of the week */
  day: DayOfWeek;
  /** Whether the provider is available on this day */
  isAvailable: boolean;
  /** Time ranges when the provider is available */
  timeRanges: TimeRange[];
}

/**
 * Represents a healthcare provider's telemedicine capabilities
 */
export interface TelemedicineCapability {
  /** Whether the provider supports telemedicine */
  isSupported: boolean;
  /** Platforms supported for telemedicine (e.g., 'app', 'web', 'phone') */
  supportedPlatforms?: string[];
  /** Additional notes about telemedicine services */
  notes?: string;
}

/**
 * Represents a healthcare provider in the AUSTA SuperApp
 */
export interface Provider {
  /** Unique identifier for the provider */
  id: string;
  
  /** Provider's full name */
  name: string;
  
  /** Provider's professional title (e.g., 'MD', 'DO', 'NP') */
  title: string;
  
  /** URL to the provider's profile image */
  profileImageUrl?: string;
  
  /** Provider's medical license number */
  licenseNumber: string;
  
  /** Current status of the provider's certification */
  certificationStatus: ProviderCertificationStatus;
  
  /** Primary medical specialty */
  primarySpecialty: MedicalSpecialty;
  
  /** Additional medical specialties */
  additionalSpecialties?: MedicalSpecialty[];
  
  /** Years of professional experience */
  yearsOfExperience: number;
  
  /** Brief professional biography */
  biography?: string;
  
  /** Languages spoken by the provider */
  languages: string[];
  
  /** Provider's office address */
  address: Address;
  
  /** Provider's contact phone number */
  phoneNumber: string;
  
  /** Provider's email address */
  email: string;
  
  /** Provider's website URL */
  website?: string;
  
  /** Whether the provider is accepting new patients */
  acceptingNewPatients: boolean;
  
  /** Insurance networks accepted by the provider */
  acceptedInsurance: string[];
  
  /** Provider's regular availability schedule */
  availability: DailyAvailability[];
  
  /** Provider's telemedicine capabilities */
  telemedicineCapability: TelemedicineCapability;
  
  /** Average rating from patient reviews (1-5 scale) */
  averageRating?: Nullable<number>;
  
  /** Number of patient reviews */
  reviewCount?: number;
  
  /** Whether the provider offers home visits */
  offersHomeVisits: boolean;
  
  /** Additional services offered by the provider */
  additionalServices?: string[];
  
  /** Date when the provider joined the platform */
  joinedDate: string;
  
  /** Date when the provider information was last updated */
  lastUpdated: string;
}

/**
 * Represents search parameters for finding providers
 */
export interface ProviderSearchParams {
  /** Search by provider name */
  name?: string;
  
  /** Filter by medical specialty */
  specialty?: MedicalSpecialty;
  
  /** Filter by location (city, state, or postal code) */
  location?: string;
  
  /** Filter by proximity to coordinates (requires radius) */
  coordinates?: GeoLocation;
  
  /** Radius in kilometers for proximity search */
  radius?: number;
  
  /** Filter by insurance accepted */
  insurance?: string;
  
  /** Filter by languages spoken */
  language?: string;
  
  /** Filter by availability on specific day */
  availableDay?: DayOfWeek;
  
  /** Filter by gender */
  gender?: string;
  
  /** Filter by minimum rating */
  minRating?: number;
  
  /** Filter to only show providers accepting new patients */
  acceptingNewPatientsOnly?: boolean;
  
  /** Filter to only show providers with telemedicine capability */
  telemedicineOnly?: boolean;
  
  /** Number of results to return per page */
  limit?: number;
  
  /** Page number for paginated results */
  page?: number;
  
  /** Field to sort results by */
  sortBy?: 'name' | 'rating' | 'distance' | 'availability';
  
  /** Sort direction */
  sortDirection?: 'asc' | 'desc';
}