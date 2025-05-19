/**
 * Provider Interface
 * 
 * Defines the structure for healthcare providers in the AUSTA SuperApp Care journey.
 * This interface represents healthcare providers available in the system, including
 * properties for provider identification, specialty, location, contact information,
 * availability, and telemedicine capabilities.
 * 
 * @module care
 */

/**
 * Represents a geographic coordinate point for provider location
 */
export interface GeoCoordinates {
  /** Latitude coordinate */
  latitude: number;
  /** Longitude coordinate */
  longitude: number;
}

/**
 * Represents a physical address for a provider
 */
export interface ProviderAddress {
  /** Street address including building/suite number */
  street: string;
  /** City name */
  city: string;
  /** State or province */
  state: string;
  /** Postal code */
  zipCode: string;
  /** Country */
  country: string;
  /** Geographic coordinates for mapping and distance calculations */
  coordinates?: GeoCoordinates;
  /** Whether this is the primary practice location */
  isPrimary: boolean;
}

/**
 * Represents a time slot in a provider's schedule
 */
export interface TimeSlot {
  /** Start time in 24-hour format (HH:MM) */
  startTime: string;
  /** End time in 24-hour format (HH:MM) */
  endTime: string;
}

/**
 * Days of the week
 */
export enum WeekDay {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY'
}

/**
 * Represents a provider's availability for a specific day
 */
export interface DailyAvailability {
  /** Day of the week */
  day: WeekDay;
  /** Available time slots for this day */
  timeSlots: TimeSlot[];
  /** Whether the provider is available on this day */
  isAvailable: boolean;
}

/**
 * Types of telemedicine services offered by providers
 */
export enum TelemedicineServiceType {
  VIDEO_CONSULTATION = 'VIDEO_CONSULTATION',
  AUDIO_ONLY = 'AUDIO_ONLY',
  SECURE_MESSAGING = 'SECURE_MESSAGING',
  REMOTE_MONITORING = 'REMOTE_MONITORING'
}

/**
 * Represents a provider's telemedicine capabilities
 */
export interface TelemedicineCapability {
  /** Whether the provider offers telemedicine services */
  isAvailable: boolean;
  /** Types of telemedicine services offered */
  serviceTypes: TelemedicineServiceType[];
  /** Supported platforms or applications */
  platforms: string[];
  /** Special instructions for telemedicine appointments */
  instructions?: string;
}

/**
 * Provider specialties based on standard medical taxonomy
 */
export enum ProviderSpecialty {
  FAMILY_MEDICINE = 'FAMILY_MEDICINE',
  INTERNAL_MEDICINE = 'INTERNAL_MEDICINE',
  PEDIATRICS = 'PEDIATRICS',
  OBSTETRICS_GYNECOLOGY = 'OBSTETRICS_GYNECOLOGY',
  CARDIOLOGY = 'CARDIOLOGY',
  DERMATOLOGY = 'DERMATOLOGY',
  ENDOCRINOLOGY = 'ENDOCRINOLOGY',
  GASTROENTEROLOGY = 'GASTROENTEROLOGY',
  NEUROLOGY = 'NEUROLOGY',
  ONCOLOGY = 'ONCOLOGY',
  OPHTHALMOLOGY = 'OPHTHALMOLOGY',
  ORTHOPEDICS = 'ORTHOPEDICS',
  PSYCHIATRY = 'PSYCHIATRY',
  PSYCHOLOGY = 'PSYCHOLOGY',
  PULMONOLOGY = 'PULMONOLOGY',
  RADIOLOGY = 'RADIOLOGY',
  UROLOGY = 'UROLOGY',
  PHYSICAL_THERAPY = 'PHYSICAL_THERAPY',
  NUTRITION = 'NUTRITION',
  OTHER = 'OTHER'
}

/**
 * Provider types in the healthcare system
 */
export enum ProviderType {
  PHYSICIAN = 'PHYSICIAN',
  NURSE_PRACTITIONER = 'NURSE_PRACTITIONER',
  PHYSICIAN_ASSISTANT = 'PHYSICIAN_ASSISTANT',
  REGISTERED_NURSE = 'REGISTERED_NURSE',
  THERAPIST = 'THERAPIST',
  COUNSELOR = 'COUNSELOR',
  DIETITIAN = 'DIETITIAN',
  SPECIALIST = 'SPECIALIST',
  OTHER = 'OTHER'
}

/**
 * Represents a healthcare provider's education
 */
export interface ProviderEducation {
  /** Name of the institution */
  institution: string;
  /** Degree or certification obtained */
  degree: string;
  /** Field of study */
  fieldOfStudy: string;
  /** Year the degree was obtained */
  graduationYear: number;
}

/**
 * Represents a healthcare provider's certification
 */
export interface ProviderCertification {
  /** Name of the certification */
  name: string;
  /** Organization that issued the certification */
  issuingOrganization: string;
  /** Year the certification was obtained */
  issueYear: number;
  /** Year the certification expires (if applicable) */
  expirationYear?: number;
}

/**
 * Represents a healthcare provider's hospital affiliation
 */
export interface HospitalAffiliation {
  /** Hospital name */
  hospitalName: string;
  /** Affiliation status (e.g., "Active", "Courtesy") */
  affiliationStatus: string;
  /** Start year of the affiliation */
  startYear: number;
  /** End year of the affiliation (if applicable) */
  endYear?: number;
}

/**
 * Represents a healthcare provider in the AUSTA SuperApp Care journey
 */
export interface Provider {
  /** Unique identifier for the provider */
  id: string;
  /** National Provider Identifier number */
  npiNumber?: string;
  /** Provider's full name */
  name: string;
  /** Provider's professional credentials (e.g., MD, RN, etc.) */
  credentials: string;
  /** Provider type */
  type: ProviderType;
  /** Provider's primary specialty */
  primarySpecialty: ProviderSpecialty;
  /** Provider's additional specialties */
  additionalSpecialties?: ProviderSpecialty[];
  /** Brief professional description */
  biography?: string;
  /** URL to provider's profile image */
  profileImageUrl?: string;
  /** Provider's practice locations */
  locations: ProviderAddress[];
  /** Provider's contact phone number */
  phoneNumber: string;
  /** Provider's fax number */
  faxNumber?: string;
  /** Provider's email address */
  email?: string;
  /** Provider's website */
  website?: string;
  /** Languages spoken by the provider */
  languages: string[];
  /** Provider's regular availability schedule */
  availability: DailyAvailability[];
  /** Provider's telemedicine capabilities */
  telemedicineCapability: TelemedicineCapability;
  /** Whether the provider is accepting new patients */
  acceptingNewPatients: boolean;
  /** Insurance plans accepted by the provider */
  acceptedInsurancePlans: string[];
  /** Provider's educational background */
  education?: ProviderEducation[];
  /** Provider's professional certifications */
  certifications?: ProviderCertification[];
  /** Provider's hospital affiliations */
  hospitalAffiliations?: HospitalAffiliation[];
  /** Years of professional experience */
  yearsOfExperience?: number;
  /** Average patient rating (1-5 scale) */
  rating?: number;
  /** Number of patient reviews */
  reviewCount?: number;
  /** Date when the provider information was last updated */
  lastUpdated: Date;
}