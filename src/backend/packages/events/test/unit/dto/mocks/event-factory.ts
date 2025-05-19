import { v4 as uuidv4 } from 'uuid';
import { faker } from '@faker-js/faker';
import { EventTypesEnum } from '../../../../src/dto/event-types.enum';
import { BaseEventDto } from '../../../../src/dto/base-event.dto';
import { HealthMetricEventDto } from '../../../../src/dto/health-metric-event.dto';
import { HealthGoalEventDto } from '../../../../src/dto/health-goal-event.dto';
import { AppointmentEventDto } from '../../../../src/dto/appointment-event.dto';
import { MedicationEventDto } from '../../../../src/dto/medication-event.dto';
import { ClaimEventDto } from '../../../../src/dto/claim-event.dto';
import { BenefitEventDto } from '../../../../src/dto/benefit-event.dto';

/**
 * Journey types supported by the application
 */
export type JourneyType = 'health' | 'care' | 'plan';

/**
 * Event factory configuration options
 */
export interface EventFactoryOptions {
  userId?: string;
  timestamp?: string;
  metadata?: Record<string, any>;
  version?: string;
  correlationId?: string;
  source?: string;
  isValid?: boolean;
}

/**
 * Creates a base event with default values that can be overridden
 * 
 * @param type - The event type from EventTypesEnum
 * @param journey - The journey this event belongs to
 * @param data - The event payload
 * @param options - Optional configuration for the event
 * @returns A properly structured event object
 */
export function createBaseEvent<T = any>(
  type: string,
  journey: JourneyType,
  data: T,
  options: EventFactoryOptions = {}
): BaseEventDto {
  const {
    userId = uuidv4(),
    timestamp = new Date().toISOString(),
    metadata = {},
    version = '1.0.0',
    correlationId = uuidv4(),
    source = `${journey}-service`,
    isValid = true
  } = options;

  // Create the base event structure
  const event: BaseEventDto = {
    eventId: uuidv4(),
    type,
    userId,
    journey,
    timestamp,
    data,
    metadata: {
      ...metadata,
      version,
      correlationId,
      source
    }
  };

  // If we want to create an invalid event for testing validation
  if (!isValid) {
    // @ts-ignore - Intentionally creating an invalid event for testing
    delete event.userId;
  }

  return event;
}

/**
 * Creates an invalid event for testing validation error handling
 * 
 * @param type - The event type from EventTypesEnum
 * @param journey - The journey this event belongs to
 * @param invalidations - Array of fields to invalidate
 * @returns An invalid event object for testing validation
 */
export function createInvalidEvent<T = any>(
  type: string,
  journey: JourneyType,
  data: T,
  invalidations: Array<'userId' | 'type' | 'journey' | 'timestamp' | 'data' | 'metadata'> = ['userId']
): Partial<BaseEventDto> {
  const baseEvent = createBaseEvent(type, journey, data);
  const invalidEvent = { ...baseEvent };
  
  // Remove or invalidate specified fields
  invalidations.forEach(field => {
    if (field === 'metadata') {
      // @ts-ignore - Intentionally creating an invalid event for testing
      invalidEvent.metadata = null;
    } else if (field === 'data') {
      // @ts-ignore - Intentionally creating an invalid event for testing
      invalidEvent.data = null;
    } else {
      // @ts-ignore - Intentionally creating an invalid event for testing
      delete invalidEvent[field];
    }
  });

  return invalidEvent;
}

/**
 * Creates a random UUID for testing
 * @returns A random UUID string
 */
export function createRandomUserId(): string {
  return uuidv4();
}

/**
 * Creates a random timestamp for testing
 * @param pastDays - Number of days in the past (default: 7)
 * @returns An ISO timestamp string
 */
export function createRandomTimestamp(pastDays = 7): string {
  return faker.date.recent(pastDays).toISOString();
}

/**
 * Creates a random correlation ID for testing
 * @returns A random UUID string for correlation
 */
export function createRandomCorrelationId(): string {
  return uuidv4();
}

// Health Journey Event Factories

/**
 * Creates a health metric event for testing
 * 
 * @param metricType - Type of health metric (e.g., 'HEART_RATE', 'BLOOD_PRESSURE')
 * @param value - The metric value
 * @param options - Optional configuration for the event
 * @returns A health metric event
 */
export function createHealthMetricEvent(
  metricType: string = 'HEART_RATE',
  value: number = 75,
  options: EventFactoryOptions = {}
): BaseEventDto {
  const metricData: Partial<HealthMetricEventDto> = {
    metricType,
    value,
    unit: getUnitForMetricType(metricType),
    source: 'manual',
    recordedAt: options.timestamp || new Date().toISOString()
  };

  return createBaseEvent(
    EventTypesEnum.HEALTH_METRIC_RECORDED,
    'health',
    metricData,
    options
  );
}

/**
 * Creates a health goal event for testing
 * 
 * @param goalType - Type of health goal (e.g., 'STEPS', 'WEIGHT')
 * @param currentValue - Current progress value
 * @param targetValue - Target goal value
 * @param isAchieved - Whether the goal is achieved
 * @param options - Optional configuration for the event
 * @returns A health goal event
 */
export function createHealthGoalEvent(
  goalType: string = 'STEPS',
  currentValue: number = 8000,
  targetValue: number = 10000,
  isAchieved: boolean = false,
  options: EventFactoryOptions = {}
): BaseEventDto {
  const goalData: Partial<HealthGoalEventDto> = {
    goalType,
    currentValue,
    targetValue,
    isAchieved,
    unit: getUnitForMetricType(goalType),
    startDate: faker.date.recent(7).toISOString(),
    endDate: faker.date.soon(7).toISOString()
  };

  return createBaseEvent(
    isAchieved ? EventTypesEnum.GOAL_ACHIEVED : EventTypesEnum.GOAL_PROGRESS_UPDATED,
    'health',
    goalData,
    options
  );
}

/**
 * Creates a device sync event for testing
 * 
 * @param deviceType - Type of device (e.g., 'Smartwatch', 'Blood Pressure Monitor')
 * @param deviceId - Device identifier
 * @param options - Optional configuration for the event
 * @returns A device sync event
 */
export function createDeviceSyncEvent(
  deviceType: string = 'Smartwatch',
  deviceId: string = uuidv4(),
  options: EventFactoryOptions = {}
): BaseEventDto {
  const deviceData = {
    deviceType,
    deviceId,
    manufacturer: faker.company.name(),
    model: `${faker.commerce.productName()} ${faker.string.numeric(3)}`,
    lastSyncedAt: options.timestamp || new Date().toISOString(),
    batteryLevel: faker.number.int({ min: 1, max: 100 }),
    metrics: [
      { type: 'STEPS', count: faker.number.int({ min: 1000, max: 20000 }) },
      { type: 'HEART_RATE', averageValue: faker.number.int({ min: 60, max: 100 }) }
    ]
  };

  return createBaseEvent(
    EventTypesEnum.DEVICE_SYNCED,
    'health',
    deviceData,
    options
  );
}

// Care Journey Event Factories

/**
 * Creates an appointment event for testing
 * 
 * @param status - Appointment status (e.g., 'booked', 'completed', 'cancelled')
 * @param specialtyName - Medical specialty name
 * @param options - Optional configuration for the event
 * @returns An appointment event
 */
export function createAppointmentEvent(
  status: 'booked' | 'checked_in' | 'completed' | 'cancelled' = 'booked',
  specialtyName: string = 'Cardiologia',
  options: EventFactoryOptions = {}
): BaseEventDto {
  const appointmentData: Partial<AppointmentEventDto> = {
    appointmentId: uuidv4(),
    status,
    provider: {
      id: uuidv4(),
      name: faker.person.fullName(),
      specialty: specialtyName,
      crm: faker.string.numeric(6)
    },
    scheduledAt: faker.date.soon(14).toISOString(),
    location: {
      name: `${faker.company.name()} Medical Center`,
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state({ abbreviated: true }),
      postalCode: faker.location.zipCode()
    },
    notes: faker.lorem.sentence()
  };

  let eventType: string;
  switch (status) {
    case 'booked':
      eventType = EventTypesEnum.APPOINTMENT_BOOKED;
      break;
    case 'checked_in':
      eventType = EventTypesEnum.APPOINTMENT_CHECKED_IN;
      break;
    case 'completed':
      eventType = EventTypesEnum.APPOINTMENT_COMPLETED;
      break;
    case 'cancelled':
      eventType = EventTypesEnum.APPOINTMENT_CANCELLED;
      break;
    default:
      eventType = EventTypesEnum.APPOINTMENT_BOOKED;
  }

  return createBaseEvent(
    eventType,
    'care',
    appointmentData,
    options
  );
}

/**
 * Creates a medication event for testing
 * 
 * @param status - Medication status (e.g., 'taken', 'skipped', 'missed')
 * @param medicationName - Name of the medication
 * @param options - Optional configuration for the event
 * @returns A medication event
 */
export function createMedicationEvent(
  status: 'taken' | 'skipped' | 'missed' = 'taken',
  medicationName: string = 'Atorvastatina',
  options: EventFactoryOptions = {}
): BaseEventDto {
  const medicationData: Partial<MedicationEventDto> = {
    medicationId: uuidv4(),
    name: medicationName,
    status,
    dosage: {
      value: faker.number.int({ min: 1, max: 100 }),
      unit: 'mg'
    },
    scheduledTime: faker.date.recent().toISOString(),
    actualTime: status === 'taken' ? faker.date.recent().toISOString() : null,
    prescription: {
      id: uuidv4(),
      providerId: uuidv4(),
      providerName: faker.person.fullName(),
      issuedAt: faker.date.recent(30).toISOString(),
      instructions: faker.lorem.sentence()
    }
  };

  let eventType: string;
  switch (status) {
    case 'taken':
      eventType = EventTypesEnum.MEDICATION_TAKEN;
      break;
    case 'skipped':
      eventType = EventTypesEnum.MEDICATION_SKIPPED;
      break;
    case 'missed':
      eventType = EventTypesEnum.MEDICATION_MISSED;
      break;
    default:
      eventType = EventTypesEnum.MEDICATION_TAKEN;
  }

  return createBaseEvent(
    eventType,
    'care',
    medicationData,
    options
  );
}

/**
 * Creates a telemedicine event for testing
 * 
 * @param status - Session status (e.g., 'started', 'completed', 'cancelled')
 * @param durationMinutes - Duration of the session in minutes
 * @param options - Optional configuration for the event
 * @returns A telemedicine event
 */
export function createTelemedicineEvent(
  status: 'started' | 'completed' | 'cancelled' = 'completed',
  durationMinutes: number = 15,
  options: EventFactoryOptions = {}
): BaseEventDto {
  const telemedicineData = {
    sessionId: uuidv4(),
    status,
    provider: {
      id: uuidv4(),
      name: faker.person.fullName(),
      specialty: faker.helpers.arrayElement(['Cardiologia', 'Dermatologia', 'Ortopedia']),
      crm: faker.string.numeric(6)
    },
    startedAt: faker.date.recent().toISOString(),
    endedAt: status === 'completed' ? faker.date.recent().toISOString() : null,
    durationMinutes: status === 'completed' ? durationMinutes : null,
    notes: faker.lorem.paragraph(),
    technicalDetails: {
      connectionQuality: faker.helpers.arrayElement(['excellent', 'good', 'fair', 'poor']),
      deviceType: faker.helpers.arrayElement(['mobile', 'desktop', 'tablet']),
      browserOrApp: faker.helpers.arrayElement(['Chrome', 'Safari', 'Firefox', 'AUSTA App'])
    }
  };

  let eventType: string;
  switch (status) {
    case 'started':
      eventType = EventTypesEnum.TELEMEDICINE_SESSION_STARTED;
      break;
    case 'completed':
      eventType = EventTypesEnum.TELEMEDICINE_SESSION_COMPLETED;
      break;
    case 'cancelled':
      eventType = EventTypesEnum.TELEMEDICINE_SESSION_CANCELLED;
      break;
    default:
      eventType = EventTypesEnum.TELEMEDICINE_SESSION_COMPLETED;
  }

  return createBaseEvent(
    eventType,
    'care',
    telemedicineData,
    options
  );
}

// Plan Journey Event Factories

/**
 * Creates a claim event for testing
 * 
 * @param status - Claim status (e.g., 'submitted', 'approved', 'rejected')
 * @param claimType - Type of claim
 * @param amount - Claim amount
 * @param options - Optional configuration for the event
 * @returns A claim event
 */
export function createClaimEvent(
  status: 'submitted' | 'approved' | 'rejected' | 'pending' = 'submitted',
  claimType: string = 'Consulta Médica',
  amount: number = 250.0,
  options: EventFactoryOptions = {}
): BaseEventDto {
  const claimData: Partial<ClaimEventDto> = {
    claimId: uuidv4(),
    status,
    type: claimType,
    amount,
    currency: 'BRL',
    submittedAt: faker.date.recent().toISOString(),
    serviceDate: faker.date.recent(30).toISOString(),
    provider: {
      id: uuidv4(),
      name: faker.company.name(),
      category: faker.helpers.arrayElement(['Médico', 'Laboratório', 'Hospital', 'Clínica']),
      location: faker.location.city()
    },
    documents: Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () => ({
      id: uuidv4(),
      type: faker.helpers.arrayElement(['receipt', 'prescription', 'medical_report', 'exam_result']),
      filename: `${faker.system.commonFileName('pdf')}`,
      uploadedAt: faker.date.recent().toISOString()
    })),
    notes: faker.lorem.sentence()
  };

  let eventType: string;
  switch (status) {
    case 'submitted':
      eventType = EventTypesEnum.CLAIM_SUBMITTED;
      break;
    case 'approved':
      eventType = EventTypesEnum.CLAIM_APPROVED;
      break;
    case 'rejected':
      eventType = EventTypesEnum.CLAIM_REJECTED;
      break;
    case 'pending':
      eventType = EventTypesEnum.CLAIM_PENDING;
      break;
    default:
      eventType = EventTypesEnum.CLAIM_SUBMITTED;
  }

  return createBaseEvent(
    eventType,
    'plan',
    claimData,
    options
  );
}

/**
 * Creates a benefit event for testing
 * 
 * @param action - Benefit action (e.g., 'used', 'redeemed')
 * @param benefitType - Type of benefit
 * @param options - Optional configuration for the event
 * @returns A benefit event
 */
export function createBenefitEvent(
  action: 'used' | 'redeemed' | 'expired' = 'used',
  benefitType: string = 'Desconto em Farmácia',
  options: EventFactoryOptions = {}
): BaseEventDto {
  const benefitData: Partial<BenefitEventDto> = {
    benefitId: uuidv4(),
    type: benefitType,
    action,
    value: faker.number.float({ min: 10, max: 500, precision: 0.01 }),
    usedAt: faker.date.recent().toISOString(),
    expiresAt: faker.date.soon(90).toISOString(),
    provider: {
      id: uuidv4(),
      name: faker.company.name(),
      category: faker.helpers.arrayElement(['Farmácia', 'Academia', 'Nutrição', 'Bem-estar']),
      location: faker.location.city()
    },
    details: {
      discountPercentage: faker.number.int({ min: 5, max: 50 }),
      maxUsageCount: faker.number.int({ min: 1, max: 10 }),
      currentUsageCount: faker.number.int({ min: 0, max: 5 })
    }
  };

  let eventType: string;
  switch (action) {
    case 'used':
      eventType = EventTypesEnum.BENEFIT_USED;
      break;
    case 'redeemed':
      eventType = EventTypesEnum.BENEFIT_REDEEMED;
      break;
    case 'expired':
      eventType = EventTypesEnum.BENEFIT_EXPIRED;
      break;
    default:
      eventType = EventTypesEnum.BENEFIT_USED;
  }

  return createBaseEvent(
    eventType,
    'plan',
    benefitData,
    options
  );
}

/**
 * Creates a plan selection event for testing
 * 
 * @param planType - Type of plan selected
 * @param options - Optional configuration for the event
 * @returns A plan selection event
 */
export function createPlanSelectionEvent(
  planType: string = 'Standard',
  options: EventFactoryOptions = {}
): BaseEventDto {
  const planData = {
    planId: uuidv4(),
    type: planType,
    name: `Plano ${planType}`,
    monthlyPremium: planType === 'Básico' ? 250.0 : planType === 'Standard' ? 450.0 : 750.0,
    currency: 'BRL',
    coverageStartDate: faker.date.soon(30).toISOString(),
    selectedAt: faker.date.recent().toISOString(),
    benefits: Array.from({ length: faker.number.int({ min: 3, max: 8 }) }, () => ({
      id: uuidv4(),
      name: faker.helpers.arrayElement([
        'Consultas Médicas',
        'Exames Laboratoriais',
        'Internação',
        'Terapias',
        'Medicamentos',
        'Telemedicina',
        'Desconto em Farmácia',
        'Check-up Anual'
      ]),
      coveragePercentage: faker.number.int({ min: 50, max: 100 }),
      annualLimit: faker.number.float({ min: 1000, max: 50000, precision: 0.01 })
    }))
  };

  return createBaseEvent(
    EventTypesEnum.PLAN_SELECTED,
    'plan',
    planData,
    options
  );
}

// Utility functions

/**
 * Gets the appropriate unit for a given metric type
 * 
 * @param metricType - The type of health metric
 * @returns The appropriate unit for the metric
 */
function getUnitForMetricType(metricType: string): string {
  switch (metricType.toUpperCase()) {
    case 'HEART_RATE':
      return 'bpm';
    case 'BLOOD_PRESSURE':
      return 'mmHg';
    case 'BLOOD_GLUCOSE':
      return 'mg/dL';
    case 'STEPS':
      return 'steps';
    case 'WEIGHT':
      return 'kg';
    case 'SLEEP':
      return 'hours';
    case 'TEMPERATURE':
      return '°C';
    case 'OXYGEN_SATURATION':
      return '%';
    default:
      return 'units';
  }
}

/**
 * Creates a random event based on journey type
 * 
 * @param journey - The journey to create an event for
 * @param options - Optional configuration for the event
 * @returns A random event for the specified journey
 */
export function createRandomJourneyEvent(
  journey: JourneyType,
  options: EventFactoryOptions = {}
): BaseEventDto {
  switch (journey) {
    case 'health':
      return faker.helpers.arrayElement([
        createHealthMetricEvent(undefined, undefined, options),
        createHealthGoalEvent(undefined, undefined, undefined, undefined, options),
        createDeviceSyncEvent(undefined, undefined, options)
      ]);
    case 'care':
      return faker.helpers.arrayElement([
        createAppointmentEvent(undefined, undefined, options),
        createMedicationEvent(undefined, undefined, options),
        createTelemedicineEvent(undefined, undefined, options)
      ]);
    case 'plan':
      return faker.helpers.arrayElement([
        createClaimEvent(undefined, undefined, undefined, options),
        createBenefitEvent(undefined, undefined, options),
        createPlanSelectionEvent(undefined, options)
      ]);
    default:
      throw new Error(`Unsupported journey type: ${journey}`);
  }
}

/**
 * Creates a batch of random events for testing
 * 
 * @param count - Number of events to create
 * @param journeyFilter - Optional filter to limit events to specific journeys
 * @param options - Optional configuration for the events
 * @returns An array of random events
 */
export function createRandomEventBatch(
  count: number = 10,
  journeyFilter?: JourneyType | JourneyType[],
  options: EventFactoryOptions = {}
): BaseEventDto[] {
  const journeys: JourneyType[] = journeyFilter 
    ? (Array.isArray(journeyFilter) ? journeyFilter : [journeyFilter])
    : ['health', 'care', 'plan'];

  return Array.from({ length: count }, () => {
    const journey = faker.helpers.arrayElement(journeys);
    return createRandomJourneyEvent(journey, options);
  });
}