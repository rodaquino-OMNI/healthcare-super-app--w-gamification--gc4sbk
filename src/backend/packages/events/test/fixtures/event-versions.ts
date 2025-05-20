/**
 * @file event-versions.ts
 * @description Contains test fixtures for verifying event versioning capabilities and schema evolution.
 * This file provides event samples of the same type but with different versions, allowing tests to
 * verify backward compatibility, upgrade paths, and version handling strategies.
 *
 * These fixtures are crucial for ensuring the system can handle both old and new event formats
 * during transitional periods.
 *
 * @module events/test/fixtures
 */

import { EventType, JourneyEvents } from '../../src/dto/event-types.enum';
import { EventMetadataDto, EventOriginDto, EventVersionDto } from '../../src/dto/event-metadata.dto';
import { VersionedEventDto, registerVersionMigration, createVersionedEvent, createVersionFromString } from '../../src/dto/version.dto';
import { HealthMetricType } from '../../src/dto/health-event.dto';

// ===== HEALTH METRIC RECORDED EVENT VERSIONS =====

/**
 * Health metric recorded event v1.0.0 (initial version)
 * 
 * This is the original schema for health metric events with basic fields.
 */
export const healthMetricRecordedV1_0_0 = createVersionedEvent(
  EventType.HEALTH_METRIC_RECORDED,
  {
    metricType: HealthMetricType.HEART_RATE,
    value: 72,
    unit: 'bpm',
    timestamp: '2023-04-15T10:30:00Z',
    source: 'manual',
    userId: 'user-123',
  },
  createVersionFromString('1.0.0')
);

/**
 * Health metric recorded event v1.1.0 (non-breaking change)
 * 
 * Added optional fields:
 * - deviceId: Optional ID of the device that recorded the metric
 * - notes: Optional user notes about the measurement
 */
export const healthMetricRecordedV1_1_0 = createVersionedEvent(
  EventType.HEALTH_METRIC_RECORDED,
  {
    metricType: HealthMetricType.HEART_RATE,
    value: 72,
    unit: 'bpm',
    timestamp: '2023-04-15T10:30:00Z',
    source: 'device',
    userId: 'user-123',
    deviceId: 'device-456', // New optional field
    notes: 'Measured after exercise', // New optional field
  },
  createVersionFromString('1.1.0')
);

/**
 * Health metric recorded event v2.0.0 (breaking change)
 * 
 * Breaking changes:
 * - Renamed 'timestamp' to 'recordedAt' for consistency
 * - Changed 'source' to an enum with specific values
 * 
 * Added required fields:
 * - locationContext: Where the measurement was taken
 */
export const healthMetricRecordedV2_0_0 = createVersionedEvent(
  EventType.HEALTH_METRIC_RECORDED,
  {
    metricType: HealthMetricType.HEART_RATE,
    value: 72,
    unit: 'bpm',
    recordedAt: '2023-04-15T10:30:00Z', // Renamed from 'timestamp'
    source: 'DEVICE', // Now uppercase enum value
    userId: 'user-123',
    deviceId: 'device-456',
    notes: 'Measured after exercise',
    locationContext: 'HOME', // New required field
  },
  createVersionFromString('2.0.0')
);

// Register migration from v1.0.0 to v1.1.0 (non-breaking)
export const healthMetricV1_0_0_to_V1_1_0 = (oldData: any) => ({
  ...oldData,
  deviceId: oldData.deviceId || null,
  notes: oldData.notes || '',
});

// Register migration from v1.1.0 to v2.0.0 (breaking)
export const healthMetricV1_1_0_to_V2_0_0 = (oldData: any) => {
  const sourceMap: Record<string, string> = {
    'manual': 'MANUAL',
    'device': 'DEVICE',
    'integration': 'INTEGRATION',
    'imported': 'IMPORTED',
  };

  return {
    ...oldData,
    recordedAt: oldData.timestamp, // Rename field
    source: sourceMap[oldData.source] || 'UNKNOWN', // Transform to enum
    locationContext: 'UNKNOWN', // Add required field with default
  };
};

// ===== CARE APPOINTMENT EVENTS =====

/**
 * Care appointment booked event v1.0.0 (initial version)
 */
export const careAppointmentBookedV1_0_0 = createVersionedEvent(
  EventType.CARE_APPOINTMENT_BOOKED,
  {
    appointmentId: 'appt-789',
    providerId: 'provider-123',
    specialtyType: 'Cardiologia',
    appointmentType: 'in_person',
    scheduledAt: '2023-05-20T14:00:00Z',
    bookedAt: '2023-04-15T11:45:00Z',
    patientNotes: 'First cardiology appointment',
    duration: 30, // Duration in minutes
    locationId: 'location-456',
    status: 'scheduled',
  },
  createVersionFromString('1.0.0')
);

/**
 * Care appointment booked event v1.1.0 (non-breaking change)
 * 
 * Added optional fields:
 * - videoCallUrl: URL for telemedicine appointments
 * - reminderSent: Whether a reminder was sent
 */
export const careAppointmentBookedV1_1_0 = createVersionedEvent(
  EventType.CARE_APPOINTMENT_BOOKED,
  {
    appointmentId: 'appt-789',
    providerId: 'provider-123',
    specialtyType: 'Cardiologia',
    appointmentType: 'in_person',
    scheduledAt: '2023-05-20T14:00:00Z',
    bookedAt: '2023-04-15T11:45:00Z',
    patientNotes: 'First cardiology appointment',
    duration: 30,
    locationId: 'location-456',
    status: 'scheduled',
    videoCallUrl: null, // New optional field
    reminderSent: false, // New optional field
  },
  createVersionFromString('1.1.0')
);

/**
 * Care appointment booked event v2.0.0 (breaking change)
 * 
 * Breaking changes:
 * - Removed 'patientNotes' field (moved to separate entity)
 * - Changed 'status' to an enum with specific values
 * - Restructured location information into a nested object
 */
export const careAppointmentBookedV2_0_0 = createVersionedEvent(
  EventType.CARE_APPOINTMENT_BOOKED,
  {
    appointmentId: 'appt-789',
    providerId: 'provider-123',
    specialtyType: 'Cardiologia',
    appointmentType: 'IN_PERSON', // Now an enum
    scheduledAt: '2023-05-20T14:00:00Z',
    bookedAt: '2023-04-15T11:45:00Z',
    duration: 30,
    status: 'SCHEDULED', // Now an enum
    videoCallUrl: null,
    reminderSent: false,
    location: { // Restructured into an object
      id: 'location-456',
      name: 'Clínica Central',
      address: 'Av. Paulista, 1000',
    },
  },
  createVersionFromString('2.0.0')
);

// Register migration from v1.0.0 to v1.1.0 (non-breaking)
export const careAppointmentV1_0_0_to_V1_1_0 = (oldData: any) => ({
  ...oldData,
  videoCallUrl: null,
  reminderSent: false,
});

// Register migration from v1.1.0 to v2.0.0 (breaking)
export const careAppointmentV1_1_0_to_V2_0_0 = (oldData: any) => {
  const { patientNotes, locationId, ...rest } = oldData;
  
  const appointmentTypeMap: Record<string, string> = {
    'in_person': 'IN_PERSON',
    'telemedicine': 'TELEMEDICINE',
    'home_visit': 'HOME_VISIT',
  };
  
  const statusMap: Record<string, string> = {
    'scheduled': 'SCHEDULED',
    'confirmed': 'CONFIRMED',
    'cancelled': 'CANCELLED',
    'completed': 'COMPLETED',
    'no_show': 'NO_SHOW',
  };
  
  return {
    ...rest,
    appointmentType: appointmentTypeMap[oldData.appointmentType] || 'UNKNOWN',
    status: statusMap[oldData.status] || 'UNKNOWN',
    location: {
      id: locationId,
      name: 'Unknown Location', // Default value
      address: '', // Default value
    },
  };
};

// ===== PLAN CLAIM EVENTS =====

/**
 * Plan claim submitted event v1.0.0 (initial version)
 */
export const planClaimSubmittedV1_0_0 = createVersionedEvent(
  EventType.PLAN_CLAIM_SUBMITTED,
  {
    claimId: 'claim-456',
    claimType: 'medical',
    providerId: 'provider-789',
    serviceDate: '2023-04-10T09:30:00Z',
    amount: '150.75', // Amount as string
    submittedAt: '2023-04-15T13:20:00Z',
    receiptUrls: ['https://storage.example.com/receipts/r123.jpg'],
    status: 'submitted',
  },
  createVersionFromString('1.0.0')
);

/**
 * Plan claim submitted event v1.1.0 (non-breaking change)
 * 
 * Changed field types:
 * - amount: Changed from string to number
 * 
 * Added optional fields:
 * - description: Description of the claim
 * - category: Category of the claim
 */
export const planClaimSubmittedV1_1_0 = createVersionedEvent(
  EventType.PLAN_CLAIM_SUBMITTED,
  {
    claimId: 'claim-456',
    claimType: 'medical',
    providerId: 'provider-789',
    serviceDate: '2023-04-10T09:30:00Z',
    amount: 150.75, // Now a number
    submittedAt: '2023-04-15T13:20:00Z',
    receiptUrls: ['https://storage.example.com/receipts/r123.jpg'],
    status: 'submitted',
    description: 'Annual checkup', // New optional field
    category: 'preventive', // New optional field
  },
  createVersionFromString('1.1.0')
);

/**
 * Plan claim submitted event v2.0.0 (breaking change)
 * 
 * Breaking changes:
 * - Restructured receipt URLs into a documents array with type information
 * - Changed status to an enum
 * - Made description and category required
 */
export const planClaimSubmittedV2_0_0 = createVersionedEvent(
  EventType.PLAN_CLAIM_SUBMITTED,
  {
    claimId: 'claim-456',
    claimType: 'MEDICAL', // Now an enum
    providerId: 'provider-789',
    serviceDate: '2023-04-10T09:30:00Z',
    amount: 150.75,
    submittedAt: '2023-04-15T13:20:00Z',
    documents: [ // Restructured from receiptUrls
      {
        type: 'RECEIPT',
        url: 'https://storage.example.com/receipts/r123.jpg',
        uploadedAt: '2023-04-15T13:15:00Z',
      },
    ],
    status: 'SUBMITTED', // Now an enum
    description: 'Annual checkup', // Now required
    category: 'PREVENTIVE', // Now required and an enum
  },
  createVersionFromString('2.0.0')
);

// Register migration from v1.0.0 to v1.1.0 (non-breaking but with type conversion)
export const planClaimV1_0_0_to_V1_1_0 = (oldData: any) => ({
  ...oldData,
  amount: parseFloat(oldData.amount), // Convert string to number
  description: '', // Default value for new field
  category: '', // Default value for new field
});

// Register migration from v1.1.0 to v2.0.0 (breaking)
export const planClaimV1_1_0_to_V2_0_0 = (oldData: any) => {
  const { receiptUrls, ...rest } = oldData;
  
  const claimTypeMap: Record<string, string> = {
    'medical': 'MEDICAL',
    'dental': 'DENTAL',
    'vision': 'VISION',
    'pharmacy': 'PHARMACY',
  };
  
  const statusMap: Record<string, string> = {
    'submitted': 'SUBMITTED',
    'in_review': 'IN_REVIEW',
    'approved': 'APPROVED',
    'rejected': 'REJECTED',
    'paid': 'PAID',
  };
  
  const categoryMap: Record<string, string> = {
    'preventive': 'PREVENTIVE',
    'diagnostic': 'DIAGNOSTIC',
    'treatment': 'TREATMENT',
    'emergency': 'EMERGENCY',
    'routine': 'ROUTINE',
    '': 'OTHER',
  };
  
  // Convert receipt URLs to document objects
  const documents = (receiptUrls || []).map((url: string) => ({
    type: 'RECEIPT',
    url,
    uploadedAt: oldData.submittedAt, // Use submission time as default
  }));
  
  return {
    ...rest,
    claimType: claimTypeMap[oldData.claimType] || 'OTHER',
    status: statusMap[oldData.status] || 'UNKNOWN',
    description: oldData.description || 'No description provided',
    category: categoryMap[oldData.category] || 'OTHER',
    documents,
  };
};

// ===== GAMIFICATION ACHIEVEMENT EVENTS =====

/**
 * Gamification achievement unlocked event v1.0.0 (initial version)
 */
export const gamificationAchievementUnlockedV1_0_0 = createVersionedEvent(
  EventType.GAMIFICATION_ACHIEVEMENT_UNLOCKED,
  {
    achievementId: 'achievement-123',
    achievementType: 'health-check-streak',
    tier: 'silver',
    points: 50,
    unlockedAt: '2023-04-15T14:30:00Z',
    userId: 'user-123',
  },
  createVersionFromString('1.0.0')
);

/**
 * Gamification achievement unlocked event v1.1.0 (non-breaking change)
 * 
 * Added optional fields:
 * - progress: Achievement progress information
 * - displayName: Localized display name
 * - iconUrl: URL to the achievement icon
 */
export const gamificationAchievementUnlockedV1_1_0 = createVersionedEvent(
  EventType.GAMIFICATION_ACHIEVEMENT_UNLOCKED,
  {
    achievementId: 'achievement-123',
    achievementType: 'health-check-streak',
    tier: 'silver',
    points: 50,
    unlockedAt: '2023-04-15T14:30:00Z',
    userId: 'user-123',
    progress: { // New optional field
      current: 7,
      target: 7,
      unit: 'days',
    },
    displayName: 'Monitor de Saúde - Prata', // New optional field
    iconUrl: 'https://assets.example.com/achievements/health-streak-silver.png', // New optional field
  },
  createVersionFromString('1.1.0')
);

/**
 * Gamification achievement unlocked event v2.0.0 (breaking change)
 * 
 * Breaking changes:
 * - Restructured achievement information into a nested object
 * - Changed tier to an enum
 * - Added required journey field
 */
export const gamificationAchievementUnlockedV2_0_0 = createVersionedEvent(
  EventType.GAMIFICATION_ACHIEVEMENT_UNLOCKED,
  {
    userId: 'user-123',
    unlockedAt: '2023-04-15T14:30:00Z',
    journey: 'health', // New required field
    achievement: { // Restructured into an object
      id: 'achievement-123',
      type: 'health-check-streak',
      tier: 'SILVER', // Now an enum
      points: 50,
      displayName: 'Monitor de Saúde - Prata',
      iconUrl: 'https://assets.example.com/achievements/health-streak-silver.png',
      progress: {
        current: 7,
        target: 7,
        unit: 'days',
        isComplete: true, // New field
      },
    },
    notification: { // New nested object
      shouldNotify: true,
      message: 'Você completou 7 dias consecutivos de monitoramento de saúde!',
    },
  },
  createVersionFromString('2.0.0')
);

// Register migration from v1.0.0 to v1.1.0 (non-breaking)
export const gamificationAchievementV1_0_0_to_V1_1_0 = (oldData: any) => ({
  ...oldData,
  progress: null,
  displayName: null,
  iconUrl: null,
});

// Register migration from v1.1.0 to v2.0.0 (breaking)
export const gamificationAchievementV1_1_0_to_V2_0_0 = (oldData: any) => {
  const { achievementId, achievementType, tier, points, progress, displayName, iconUrl, ...rest } = oldData;
  
  const tierMap: Record<string, string> = {
    'bronze': 'BRONZE',
    'silver': 'SILVER',
    'gold': 'GOLD',
    'platinum': 'PLATINUM',
  };
  
  // Determine journey from achievement type
  let journey = 'unknown';
  if (achievementType.startsWith('health-')) {
    journey = 'health';
  } else if (achievementType.startsWith('care-')) {
    journey = 'care';
  } else if (achievementType.startsWith('plan-')) {
    journey = 'plan';
  }
  
  return {
    ...rest,
    journey,
    achievement: {
      id: achievementId,
      type: achievementType,
      tier: tierMap[tier] || 'UNKNOWN',
      points,
      displayName: displayName || `Achievement ${achievementId}`,
      iconUrl: iconUrl || null,
      progress: progress ? {
        ...progress,
        isComplete: progress.current >= progress.target,
      } : {
        current: 1,
        target: 1,
        unit: 'completion',
        isComplete: true,
      },
    },
    notification: {
      shouldNotify: true,
      message: `You've unlocked the ${displayName || achievementType} achievement!`,
    },
  };
};

// ===== VERSION COMPATIBILITY TEST CASES =====

/**
 * Test cases for version compatibility checks.
 * Each case includes source and target versions and expected compatibility result.
 */
export const versionCompatibilityTestCases = [
  // Same version is always compatible
  { source: '1.0.0', target: '1.0.0', compatible: true },
  
  // Minor version upgrades are backward compatible
  { source: '1.1.0', target: '1.0.0', compatible: true },
  { source: '1.2.0', target: '1.0.0', compatible: true },
  { source: '1.2.0', target: '1.1.0', compatible: true },
  
  // Patch version upgrades are backward compatible
  { source: '1.0.1', target: '1.0.0', compatible: true },
  { source: '1.1.2', target: '1.1.0', compatible: true },
  
  // Major version changes are not backward compatible
  { source: '2.0.0', target: '1.0.0', compatible: false },
  { source: '2.0.0', target: '1.1.0', compatible: false },
  
  // Older versions are not forward compatible
  { source: '1.0.0', target: '1.1.0', compatible: false },
  { source: '1.0.0', target: '2.0.0', compatible: false },
  { source: '1.1.0', target: '1.2.0', compatible: false },
];

// ===== MIGRATION PATH TEST CASES =====

/**
 * Test cases for finding migration paths between versions.
 * Each case includes source and target versions and expected migration steps.
 */
export const migrationPathTestCases = [
  // Direct migrations
  {
    eventType: EventType.HEALTH_METRIC_RECORDED,
    source: '1.0.0',
    target: '1.1.0',
    expectedPath: ['1.0.0->1.1.0'],
  },
  {
    eventType: EventType.HEALTH_METRIC_RECORDED,
    source: '1.1.0',
    target: '2.0.0',
    expectedPath: ['1.1.0->2.0.0'],
  },
  
  // Multi-step migrations
  {
    eventType: EventType.HEALTH_METRIC_RECORDED,
    source: '1.0.0',
    target: '2.0.0',
    expectedPath: ['1.0.0->1.1.0', '1.1.0->2.0.0'],
  },
  
  // No migration path
  {
    eventType: 'UNKNOWN_EVENT_TYPE',
    source: '1.0.0',
    target: '2.0.0',
    expectedPath: null,
  },
];

// ===== REGISTER MIGRATIONS =====

// Register all migrations for testing
export function registerTestMigrations() {
  // Health metric recorded event migrations
  registerVersionMigration(
    EventType.HEALTH_METRIC_RECORDED,
    '1.0.0',
    '1.1.0',
    healthMetricV1_0_0_to_V1_1_0
  );
  
  registerVersionMigration(
    EventType.HEALTH_METRIC_RECORDED,
    '1.1.0',
    '2.0.0',
    healthMetricV1_1_0_to_V2_0_0
  );
  
  // Care appointment booked event migrations
  registerVersionMigration(
    EventType.CARE_APPOINTMENT_BOOKED,
    '1.0.0',
    '1.1.0',
    careAppointmentV1_0_0_to_V1_1_0
  );
  
  registerVersionMigration(
    EventType.CARE_APPOINTMENT_BOOKED,
    '1.1.0',
    '2.0.0',
    careAppointmentV1_1_0_to_V2_0_0
  );
  
  // Plan claim submitted event migrations
  registerVersionMigration(
    EventType.PLAN_CLAIM_SUBMITTED,
    '1.0.0',
    '1.1.0',
    planClaimV1_0_0_to_V1_1_0
  );
  
  registerVersionMigration(
    EventType.PLAN_CLAIM_SUBMITTED,
    '1.1.0',
    '2.0.0',
    planClaimV1_1_0_to_V2_0_0
  );
  
  // Gamification achievement unlocked event migrations
  registerVersionMigration(
    EventType.GAMIFICATION_ACHIEVEMENT_UNLOCKED,
    '1.0.0',
    '1.1.0',
    gamificationAchievementV1_0_0_to_V1_1_0
  );
  
  registerVersionMigration(
    EventType.GAMIFICATION_ACHIEVEMENT_UNLOCKED,
    '1.1.0',
    '2.0.0',
    gamificationAchievementV1_1_0_to_V2_0_0
  );
}

// ===== EXPORT ALL FIXTURES =====

export default {
  // Health metric recorded event versions
  healthMetricRecordedV1_0_0,
  healthMetricRecordedV1_1_0,
  healthMetricRecordedV2_0_0,
  healthMetricV1_0_0_to_V1_1_0,
  healthMetricV1_1_0_to_V2_0_0,
  
  // Care appointment booked event versions
  careAppointmentBookedV1_0_0,
  careAppointmentBookedV1_1_0,
  careAppointmentBookedV2_0_0,
  careAppointmentV1_0_0_to_V1_1_0,
  careAppointmentV1_1_0_to_V2_0_0,
  
  // Plan claim submitted event versions
  planClaimSubmittedV1_0_0,
  planClaimSubmittedV1_1_0,
  planClaimSubmittedV2_0_0,
  planClaimV1_0_0_to_V1_1_0,
  planClaimV1_1_0_to_V2_0_0,
  
  // Gamification achievement unlocked event versions
  gamificationAchievementUnlockedV1_0_0,
  gamificationAchievementUnlockedV1_1_0,
  gamificationAchievementUnlockedV2_0_0,
  gamificationAchievementV1_0_0_to_V1_1_0,
  gamificationAchievementV1_1_0_to_V2_0_0,
  
  // Test cases
  versionCompatibilityTestCases,
  migrationPathTestCases,
  
  // Helper functions
  registerTestMigrations,
};