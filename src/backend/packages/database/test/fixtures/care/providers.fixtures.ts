import { IProvider } from '@austa/interfaces/journey/care';

/**
 * Interface for provider test fixtures with additional testing properties
 */
export interface ProviderFixture extends IProvider {
  /**
   * Unique identifier for the provider
   */
  id: string;
  
  /**
   * Name of the provider
   */
  name: string;
  
  /**
   * Medical specialty of the provider
   */
  specialty: string;
  
  /**
   * Location of the provider's practice
   */
  location: string;
  
  /**
   * Contact phone number of the provider
   */
  phone: string;
  
  /**
   * Contact email address of the provider
   */
  email: string;
  
  /**
   * Indicates whether the provider offers telemedicine services
   */
  telemedicineAvailable: boolean;
  
  /**
   * Record creation timestamp
   */
  createdAt: Date;
  
  /**
   * Record update timestamp
   */
  updatedAt: Date;
}

/**
 * Interface representing provider availability for testing
 */
export interface ProviderAvailability {
  /**
   * Provider ID this availability belongs to
   */
  providerId: string;
  
  /**
   * Day of the week (0-6, where 0 is Sunday)
   */
  dayOfWeek: number;
  
  /**
   * Start time in 24-hour format (HH:MM)
   */
  startTime: string;
  
  /**
   * End time in 24-hour format (HH:MM)
   */
  endTime: string;
  
  /**
   * Whether this time slot is available for telemedicine
   */
  telemedicineAvailable: boolean;
  
  /**
   * Whether this time slot is already booked
   */
  isBooked?: boolean;
}

/**
 * Provider specialties extracted from seed data
 */
export const PROVIDER_SPECIALTIES = {
  CARDIOLOGY: 'Cardiologia',
  DERMATOLOGY: 'Dermatologia',
  ORTHOPEDICS: 'Ortopedia',
  PEDIATRICS: 'Pediatria',
  PSYCHIATRY: 'Psiquiatria',
};

/**
 * Base provider fixture with default values
 */
const baseProviderFixture: Omit<ProviderFixture, 'id' | 'specialty'> = {
  name: 'Dr. Test Provider',
  location: 'São Paulo, SP',
  phone: '+5511999999999',
  email: 'provider@test.com',
  telemedicineAvailable: true,
  createdAt: new Date('2023-01-01T00:00:00Z'),
  updatedAt: new Date('2023-01-01T00:00:00Z'),
};

/**
 * Creates a provider fixture with the specified specialty
 * 
 * @param id - Provider ID
 * @param specialty - Medical specialty
 * @param overrides - Optional property overrides
 * @returns A provider fixture
 */
export const createProviderFixture = (
  id: string,
  specialty: string,
  overrides: Partial<ProviderFixture> = {}
): ProviderFixture => {
  return {
    ...baseProviderFixture,
    id,
    specialty,
    ...overrides,
  };
};

/**
 * Creates a cardiologist provider fixture
 * 
 * @param id - Provider ID
 * @param overrides - Optional property overrides
 * @returns A cardiologist provider fixture
 */
export const createCardiologistFixture = (
  id: string = '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p',
  overrides: Partial<ProviderFixture> = {}
): ProviderFixture => {
  return createProviderFixture(
    id,
    PROVIDER_SPECIALTIES.CARDIOLOGY,
    {
      name: 'Dr. Carlos Cardoso',
      email: 'carlos.cardoso@austa.com.br',
      ...overrides,
    }
  );
};

/**
 * Creates a dermatologist provider fixture
 * 
 * @param id - Provider ID
 * @param overrides - Optional property overrides
 * @returns A dermatologist provider fixture
 */
export const createDermatologistFixture = (
  id: string = '2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q',
  overrides: Partial<ProviderFixture> = {}
): ProviderFixture => {
  return createProviderFixture(
    id,
    PROVIDER_SPECIALTIES.DERMATOLOGY,
    {
      name: 'Dra. Daniela Dermato',
      email: 'daniela.dermato@austa.com.br',
      ...overrides,
    }
  );
};

/**
 * Creates an orthopedist provider fixture
 * 
 * @param id - Provider ID
 * @param overrides - Optional property overrides
 * @returns An orthopedist provider fixture
 */
export const createOrthopedistFixture = (
  id: string = '3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r',
  overrides: Partial<ProviderFixture> = {}
): ProviderFixture => {
  return createProviderFixture(
    id,
    PROVIDER_SPECIALTIES.ORTHOPEDICS,
    {
      name: 'Dr. Otávio Ortopedista',
      email: 'otavio.ortopedista@austa.com.br',
      ...overrides,
    }
  );
};

/**
 * Creates a pediatrician provider fixture
 * 
 * @param id - Provider ID
 * @param overrides - Optional property overrides
 * @returns A pediatrician provider fixture
 */
export const createPediatricianFixture = (
  id: string = '4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s',
  overrides: Partial<ProviderFixture> = {}
): ProviderFixture => {
  return createProviderFixture(
    id,
    PROVIDER_SPECIALTIES.PEDIATRICS,
    {
      name: 'Dra. Paula Pediatra',
      email: 'paula.pediatra@austa.com.br',
      ...overrides,
    }
  );
};

/**
 * Creates a psychiatrist provider fixture
 * 
 * @param id - Provider ID
 * @param overrides - Optional property overrides
 * @returns A psychiatrist provider fixture
 */
export const createPsychiatristFixture = (
  id: string = '5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t',
  overrides: Partial<ProviderFixture> = {}
): ProviderFixture => {
  return createProviderFixture(
    id,
    PROVIDER_SPECIALTIES.PSYCHIATRY,
    {
      name: 'Dr. Paulo Psiquiatra',
      email: 'paulo.psiquiatra@austa.com.br',
      ...overrides,
    }
  );
};

/**
 * Creates a collection of providers with different specialties
 * 
 * @param count - Number of providers to create (default: 1 of each specialty)
 * @returns An array of provider fixtures
 */
export const createProviderCollection = (count: number = 1): ProviderFixture[] => {
  const providers: ProviderFixture[] = [];
  
  for (let i = 0; i < count; i++) {
    const idSuffix = i > 0 ? `-${i}` : '';
    
    providers.push(createCardiologistFixture(`card-${i}${idSuffix}`));
    providers.push(createDermatologistFixture(`derm-${i}${idSuffix}`));
    providers.push(createOrthopedistFixture(`orth-${i}${idSuffix}`));
    providers.push(createPediatricianFixture(`pedi-${i}${idSuffix}`));
    providers.push(createPsychiatristFixture(`psyc-${i}${idSuffix}`));
  }
  
  return providers;
};

/**
 * Creates a standard weekly availability pattern for a provider
 * 
 * @param providerId - Provider ID
 * @param telemedicineAvailable - Whether telemedicine is available for these slots
 * @returns An array of availability slots
 */
export const createStandardAvailability = (
  providerId: string,
  telemedicineAvailable: boolean = true
): ProviderAvailability[] => {
  // Create availability for Monday through Friday, 9 AM to 5 PM
  const availability: ProviderAvailability[] = [];
  
  // Days 1-5 (Monday to Friday)
  for (let day = 1; day <= 5; day++) {
    availability.push({
      providerId,
      dayOfWeek: day,
      startTime: '09:00',
      endTime: '12:00',
      telemedicineAvailable,
    });
    
    availability.push({
      providerId,
      dayOfWeek: day,
      startTime: '13:00',
      endTime: '17:00',
      telemedicineAvailable,
    });
  }
  
  return availability;
};

/**
 * Creates a limited availability pattern (fewer hours, specific days)
 * 
 * @param providerId - Provider ID
 * @param telemedicineAvailable - Whether telemedicine is available for these slots
 * @returns An array of availability slots
 */
export const createLimitedAvailability = (
  providerId: string,
  telemedicineAvailable: boolean = false
): ProviderAvailability[] => {
  // Create availability for Monday, Wednesday, Friday, 10 AM to 3 PM
  const availability: ProviderAvailability[] = [];
  
  // Days 1, 3, 5 (Monday, Wednesday, Friday)
  [1, 3, 5].forEach(day => {
    availability.push({
      providerId,
      dayOfWeek: day,
      startTime: '10:00',
      endTime: '15:00',
      telemedicineAvailable,
    });
  });
  
  return availability;
};

/**
 * Creates an availability pattern with some booked slots
 * 
 * @param providerId - Provider ID
 * @param bookedSlots - Number of slots to mark as booked
 * @returns An array of availability slots with some marked as booked
 */
export const createAvailabilityWithBookings = (
  providerId: string,
  bookedSlots: number = 3
): ProviderAvailability[] => {
  const availability = createStandardAvailability(providerId);
  
  // Mark some slots as booked
  for (let i = 0; i < Math.min(bookedSlots, availability.length); i++) {
    availability[i].isBooked = true;
  }
  
  return availability;
};

/**
 * Creates a telemedicine-only availability pattern
 * 
 * @param providerId - Provider ID
 * @returns An array of telemedicine-only availability slots
 */
export const createTelemedicineOnlyAvailability = (
  providerId: string
): ProviderAvailability[] => {
  // Create availability for all days, extended hours
  const availability: ProviderAvailability[] = [];
  
  // All days of the week
  for (let day = 0; day <= 6; day++) {
    availability.push({
      providerId,
      dayOfWeek: day,
      startTime: '08:00',
      endTime: '20:00',
      telemedicineAvailable: true,
    });
  }
  
  return availability;
};

/**
 * Creates a scenario for testing scheduling conflicts
 * 
 * @returns An object with providers and their availability
 */
export const createSchedulingConflictScenario = () => {
  const cardiologist = createCardiologistFixture();
  const dermatologist = createDermatologistFixture();
  
  // Create availability with some conflicts
  const cardiologistAvailability = createAvailabilityWithBookings(cardiologist.id, 2);
  const dermatologistAvailability = createStandardAvailability(dermatologist.id);
  
  return {
    providers: [cardiologist, dermatologist],
    availability: [...cardiologistAvailability, ...dermatologistAvailability],
  };
};

/**
 * Creates a scenario for testing provider search and filtering
 * 
 * @returns An object with a collection of providers with different specialties
 */
export const createProviderSearchScenario = () => {
  return {
    providers: createProviderCollection(3), // Create 3 providers of each specialty
  };
};

/**
 * Creates a scenario for testing telemedicine availability
 * 
 * @returns An object with providers and their telemedicine availability
 */
export const createTelemedicineScenario = () => {
  const telemedicineProvider = createPsychiatristFixture('tele-1', {
    telemedicineAvailable: true,
    name: 'Dra. Teresa Telemedicina',
  });
  
  const inPersonOnlyProvider = createOrthopedistFixture('in-person-1', {
    telemedicineAvailable: false,
    name: 'Dr. Ivan InPerson',
  });
  
  return {
    providers: [telemedicineProvider, inPersonOnlyProvider],
    availability: [
      ...createTelemedicineOnlyAvailability(telemedicineProvider.id),
      ...createStandardAvailability(inPersonOnlyProvider.id, false),
    ],
  };
};