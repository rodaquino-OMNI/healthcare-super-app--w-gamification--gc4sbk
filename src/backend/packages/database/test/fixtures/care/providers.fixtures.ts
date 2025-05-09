/**
 * @file Provider test fixtures for the Care journey
 * @description Provides standardized test data for healthcare providers with different specialties,
 * availability patterns, and telemedicine capabilities to enable testing of provider search,
 * filtering, availability checking, and appointment scheduling functionality.
 */

import { IProvider } from '@austa/interfaces/journey/care';

/**
 * Interface for provider test data with availability information
 * Extends the standard IProvider interface with test-specific properties
 */
export interface IProviderFixture extends IProvider {
  /**
   * Array of available time slots for testing appointment scheduling
   * Each string represents a time in 24-hour format (HH:MM)
   */
  availableTimeSlots?: string[];
}

/**
 * Interface for provider availability scenarios
 * Used for testing scheduling conflicts and availability checking
 */
export interface IProviderAvailabilityScenario {
  /**
   * Provider fixture to use for the scenario
   */
  provider: IProviderFixture;
  
  /**
   * Date for which the availability scenario applies
   */
  date: Date;
  
  /**
   * Array of available time slots for the specified date
   * Each string represents a time in 24-hour format (HH:MM)
   */
  availableSlots: string[];
  
  /**
   * Array of booked time slots for the specified date
   * Each string represents a time in 24-hour format (HH:MM)
   */
  bookedSlots: string[];
}

/**
 * Provider specialties extracted from seed script
 * Used for consistent specialty values across tests
 */
export enum ProviderSpecialty {
  CARDIOLOGY = 'Cardiologia',
  DERMATOLOGY = 'Dermatologia',
  ORTHOPEDICS = 'Ortopedia',
  PEDIATRICS = 'Pediatria',
  PSYCHIATRY = 'Psiquiatria'
}

/**
 * Common locations for provider fixtures
 * Used for testing location-based filtering
 */
export enum ProviderLocation {
  SAO_PAULO = 'São Paulo, SP',
  RIO_DE_JANEIRO = 'Rio de Janeiro, RJ',
  BELO_HORIZONTE = 'Belo Horizonte, MG',
  PORTO_ALEGRE = 'Porto Alegre, RS',
  RECIFE = 'Recife, PE'
}

/**
 * Factory function to create a provider fixture with default values
 * 
 * @param overrides Optional properties to override default values
 * @returns A provider fixture with default values merged with overrides
 */
export function createProviderFixture(overrides?: Partial<IProviderFixture>): IProviderFixture {
  return {
    id: `provider-${Math.floor(Math.random() * 10000)}`,
    name: 'Dr. Test Provider',
    specialty: ProviderSpecialty.CARDIOLOGY,
    location: ProviderLocation.SAO_PAULO,
    phone: '+5511999999999',
    email: 'provider@test.com',
    telemedicineAvailable: false,
    availableTimeSlots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
    ...overrides
  };
}

/**
 * Factory function to create a provider fixture with a specific specialty
 * 
 * @param specialty The medical specialty for the provider
 * @param overrides Optional properties to override default values
 * @returns A provider fixture with the specified specialty
 */
export function createProviderWithSpecialty(
  specialty: ProviderSpecialty,
  overrides?: Partial<IProviderFixture>
): IProviderFixture {
  return createProviderFixture({
    specialty,
    name: `Dr. ${getNameForSpecialty(specialty)}`,
    ...overrides
  });
}

/**
 * Factory function to create a provider fixture with telemedicine capability
 * 
 * @param overrides Optional properties to override default values
 * @returns A provider fixture with telemedicine capability
 */
export function createTelemedicineProvider(overrides?: Partial<IProviderFixture>): IProviderFixture {
  return createProviderFixture({
    telemedicineAvailable: true,
    ...overrides
  });
}

/**
 * Factory function to create a provider fixture with a specific location
 * 
 * @param location The practice location for the provider
 * @param overrides Optional properties to override default values
 * @returns A provider fixture with the specified location
 */
export function createProviderWithLocation(
  location: ProviderLocation,
  overrides?: Partial<IProviderFixture>
): IProviderFixture {
  return createProviderFixture({
    location,
    ...overrides
  });
}

/**
 * Factory function to create a provider fixture with specific availability
 * 
 * @param availableTimeSlots Array of available time slots in 24-hour format (HH:MM)
 * @param overrides Optional properties to override default values
 * @returns A provider fixture with the specified availability
 */
export function createProviderWithAvailability(
  availableTimeSlots: string[],
  overrides?: Partial<IProviderFixture>
): IProviderFixture {
  return createProviderFixture({
    availableTimeSlots,
    ...overrides
  });
}

/**
 * Helper function to generate a realistic name based on specialty
 * 
 * @param specialty The medical specialty
 * @returns A name appropriate for the specialty
 */
function getNameForSpecialty(specialty: ProviderSpecialty): string {
  const specialtyNames = {
    [ProviderSpecialty.CARDIOLOGY]: 'Carlos Cardoso',
    [ProviderSpecialty.DERMATOLOGY]: 'Daniela Dermato',
    [ProviderSpecialty.ORTHOPEDICS]: 'Otávio Ortiz',
    [ProviderSpecialty.PEDIATRICS]: 'Paula Pedreira',
    [ProviderSpecialty.PSYCHIATRY]: 'Paulo Psiquê'
  };
  
  return specialtyNames[specialty] || 'Test Provider';
}

/**
 * Predefined provider fixtures for common test scenarios
 */
export const providerFixtures = {
  /**
   * Cardiologist with telemedicine capability in São Paulo
   */
  cardiologist: createProviderWithSpecialty(ProviderSpecialty.CARDIOLOGY, {
    id: 'provider-cardio-1',
    telemedicineAvailable: true,
    location: ProviderLocation.SAO_PAULO
  }),
  
  /**
   * Dermatologist without telemedicine capability in Rio de Janeiro
   */
  dermatologist: createProviderWithSpecialty(ProviderSpecialty.DERMATOLOGY, {
    id: 'provider-derm-1',
    telemedicineAvailable: false,
    location: ProviderLocation.RIO_DE_JANEIRO
  }),
  
  /**
   * Orthopedist with telemedicine capability in Belo Horizonte
   */
  orthopedist: createProviderWithSpecialty(ProviderSpecialty.ORTHOPEDICS, {
    id: 'provider-ortho-1',
    telemedicineAvailable: true,
    location: ProviderLocation.BELO_HORIZONTE
  }),
  
  /**
   * Pediatrician with telemedicine capability in Porto Alegre
   */
  pediatrician: createProviderWithSpecialty(ProviderSpecialty.PEDIATRICS, {
    id: 'provider-ped-1',
    telemedicineAvailable: true,
    location: ProviderLocation.PORTO_ALEGRE
  }),
  
  /**
   * Psychiatrist without telemedicine capability in Recife
   */
  psychiatrist: createProviderWithSpecialty(ProviderSpecialty.PSYCHIATRY, {
    id: 'provider-psych-1',
    telemedicineAvailable: false,
    location: ProviderLocation.RECIFE
  }),
  
  /**
   * Cardiologist with limited availability in São Paulo
   */
  cardiologistLimitedAvailability: createProviderWithSpecialty(ProviderSpecialty.CARDIOLOGY, {
    id: 'provider-cardio-2',
    telemedicineAvailable: true,
    location: ProviderLocation.SAO_PAULO,
    availableTimeSlots: ['09:00', '14:00'] // Only two slots available
  }),
  
  /**
   * Dermatologist with full availability in Rio de Janeiro
   */
  dermatologistFullAvailability: createProviderWithSpecialty(ProviderSpecialty.DERMATOLOGY, {
    id: 'provider-derm-2',
    telemedicineAvailable: true,
    location: ProviderLocation.RIO_DE_JANEIRO,
    availableTimeSlots: ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'] // Full day availability
  }),
  
  /**
   * Pediatrician with no availability in São Paulo
   */
  pediatricianNoAvailability: createProviderWithSpecialty(ProviderSpecialty.PEDIATRICS, {
    id: 'provider-ped-2',
    telemedicineAvailable: true,
    location: ProviderLocation.SAO_PAULO,
    availableTimeSlots: [] // No availability
  })
};

/**
 * Predefined availability scenarios for testing scheduling conflicts
 */
export const availabilityScenarios: IProviderAvailabilityScenario[] = [
  {
    provider: providerFixtures.cardiologist,
    date: new Date('2023-06-15T00:00:00Z'),
    availableSlots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
    bookedSlots: []
  },
  {
    provider: providerFixtures.cardiologist,
    date: new Date('2023-06-16T00:00:00Z'),
    availableSlots: ['09:00', '11:00', '15:00', '16:00'],
    bookedSlots: ['10:00', '14:00'] // Some slots are booked
  },
  {
    provider: providerFixtures.dermatologist,
    date: new Date('2023-06-15T00:00:00Z'),
    availableSlots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
    bookedSlots: []
  },
  {
    provider: providerFixtures.dermatologist,
    date: new Date('2023-06-16T00:00:00Z'),
    availableSlots: [],
    bookedSlots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'] // Fully booked
  },
  {
    provider: providerFixtures.orthopedist,
    date: new Date('2023-06-15T00:00:00Z'),
    availableSlots: ['09:00', '10:00', '14:00', '15:00'],
    bookedSlots: ['11:00', '16:00'] // Some slots are booked
  },
  {
    provider: providerFixtures.pediatrician,
    date: new Date('2023-06-15T00:00:00Z'),
    availableSlots: ['09:00', '10:00', '11:00'],
    bookedSlots: ['14:00', '15:00', '16:00'] // Afternoon is booked
  },
  {
    provider: providerFixtures.psychiatrist,
    date: new Date('2023-06-15T00:00:00Z'),
    availableSlots: ['14:00', '15:00', '16:00'],
    bookedSlots: ['09:00', '10:00', '11:00'] // Morning is booked
  }
];

/**
 * Collection of all provider fixtures for bulk testing
 */
export const allProviders: IProviderFixture[] = Object.values(providerFixtures);

/**
 * Collection of providers with telemedicine capability
 */
export const telemedicineProviders: IProviderFixture[] = allProviders.filter(
  provider => provider.telemedicineAvailable
);

/**
 * Collection of providers by specialty
 */
export const providersBySpecialty: Record<ProviderSpecialty, IProviderFixture[]> = {
  [ProviderSpecialty.CARDIOLOGY]: allProviders.filter(
    provider => provider.specialty === ProviderSpecialty.CARDIOLOGY
  ),
  [ProviderSpecialty.DERMATOLOGY]: allProviders.filter(
    provider => provider.specialty === ProviderSpecialty.DERMATOLOGY
  ),
  [ProviderSpecialty.ORTHOPEDICS]: allProviders.filter(
    provider => provider.specialty === ProviderSpecialty.ORTHOPEDICS
  ),
  [ProviderSpecialty.PEDIATRICS]: allProviders.filter(
    provider => provider.specialty === ProviderSpecialty.PEDIATRICS
  ),
  [ProviderSpecialty.PSYCHIATRY]: allProviders.filter(
    provider => provider.specialty === ProviderSpecialty.PSYCHIATRY
  )
};

/**
 * Collection of providers by location
 */
export const providersByLocation: Record<ProviderLocation, IProviderFixture[]> = {
  [ProviderLocation.SAO_PAULO]: allProviders.filter(
    provider => provider.location === ProviderLocation.SAO_PAULO
  ),
  [ProviderLocation.RIO_DE_JANEIRO]: allProviders.filter(
    provider => provider.location === ProviderLocation.RIO_DE_JANEIRO
  ),
  [ProviderLocation.BELO_HORIZONTE]: allProviders.filter(
    provider => provider.location === ProviderLocation.BELO_HORIZONTE
  ),
  [ProviderLocation.PORTO_ALEGRE]: allProviders.filter(
    provider => provider.location === ProviderLocation.PORTO_ALEGRE
  ),
  [ProviderLocation.RECIFE]: allProviders.filter(
    provider => provider.location === ProviderLocation.RECIFE
  )
};