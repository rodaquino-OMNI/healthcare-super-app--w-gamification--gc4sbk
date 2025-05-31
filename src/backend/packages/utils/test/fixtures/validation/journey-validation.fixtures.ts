/**
 * Journey Validation Test Fixtures
 * 
 * This file provides test fixtures for journey-specific validation scenarios
 * organized by health, care, and plan journeys. These fixtures ensure each journey
 * can properly validate its specific data requirements while maintaining consistent
 * validation patterns across the SuperApp.
 */

import { z } from 'zod';

// Common types used across journeys
export enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan'
}

export enum ClaimType {
  CONSULTATION = 'consultation',
  EXAMINATION = 'examination',
  PROCEDURE = 'procedure',
  EMERGENCY = 'emergency',
  MEDICATION = 'medication'
}

export enum MetricType {
  STEPS = 'steps',
  HEART_RATE = 'heart_rate',
  BLOOD_PRESSURE = 'blood_pressure',
  BLOOD_GLUCOSE = 'blood_glucose',
  WEIGHT = 'weight',
  SLEEP = 'sleep',
  OXYGEN_SATURATION = 'oxygen_saturation'
}

export enum AppointmentType {
  IN_PERSON = 'in_person',
  TELEMEDICINE = 'telemedicine',
  HOME_VISIT = 'home_visit'
}

/**
 * Health Journey Validation Fixtures
 */
export const healthJourneyFixtures = {
  // Health metrics validation fixtures
  metrics: {
    valid: {
      steps: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: MetricType.STEPS,
        value: 10000,
        unit: 'steps',
        timestamp: new Date('2023-04-15T14:30:00Z'),
        source: 'googlefit'
      },
      heartRate: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: MetricType.HEART_RATE,
        value: 72,
        unit: 'bpm',
        timestamp: new Date('2023-04-15T14:30:00Z'),
        source: 'fitbit'
      },
      bloodPressure: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: MetricType.BLOOD_PRESSURE,
        value: { systolic: 120, diastolic: 80 },
        unit: 'mmHg',
        timestamp: new Date('2023-04-15T14:30:00Z'),
        source: 'manual'
      },
      weight: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: MetricType.WEIGHT,
        value: 70.5,
        unit: 'kg',
        timestamp: new Date('2023-04-15T14:30:00Z'),
        source: 'withings'
      }
    },
    invalid: {
      missingUserId: {
        // userId is missing
        type: MetricType.STEPS,
        value: 10000,
        unit: 'steps',
        timestamp: new Date('2023-04-15T14:30:00Z'),
        source: 'googlefit'
      },
      invalidMetricType: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'invalid_type', // Invalid metric type
        value: 10000,
        unit: 'steps',
        timestamp: new Date('2023-04-15T14:30:00Z'),
        source: 'googlefit'
      },
      negativeValue: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: MetricType.STEPS,
        value: -100, // Negative value not allowed for steps
        unit: 'steps',
        timestamp: new Date('2023-04-15T14:30:00Z'),
        source: 'googlefit'
      },
      futureTimestamp: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: MetricType.HEART_RATE,
        value: 72,
        unit: 'bpm',
        timestamp: new Date(Date.now() + 86400000), // Future timestamp (tomorrow)
        source: 'fitbit'
      },
      invalidBloodPressureFormat: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: MetricType.BLOOD_PRESSURE,
        value: 120, // Should be an object with systolic and diastolic
        unit: 'mmHg',
        timestamp: new Date('2023-04-15T14:30:00Z'),
        source: 'manual'
      }
    }
  },
  
  // Health goals validation fixtures
  goals: {
    valid: {
      stepsGoal: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        metricType: MetricType.STEPS,
        target: 10000,
        unit: 'steps',
        frequency: 'daily',
        startDate: new Date('2023-04-01'),
        endDate: new Date('2023-04-30'),
        reminderEnabled: true,
        reminderTime: '08:00'
      },
      weightGoal: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        metricType: MetricType.WEIGHT,
        target: 65,
        unit: 'kg',
        frequency: 'weekly',
        startDate: new Date('2023-04-01'),
        endDate: new Date('2023-06-30'),
        reminderEnabled: false
      }
    },
    invalid: {
      endDateBeforeStartDate: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        metricType: MetricType.STEPS,
        target: 10000,
        unit: 'steps',
        frequency: 'daily',
        startDate: new Date('2023-04-30'), // Start date after end date
        endDate: new Date('2023-04-01'),
        reminderEnabled: true,
        reminderTime: '08:00'
      },
      invalidFrequency: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        metricType: MetricType.WEIGHT,
        target: 65,
        unit: 'kg',
        frequency: 'bi-monthly', // Invalid frequency
        startDate: new Date('2023-04-01'),
        endDate: new Date('2023-06-30'),
        reminderEnabled: false
      },
      missingReminderTime: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        metricType: MetricType.STEPS,
        target: 10000,
        unit: 'steps',
        frequency: 'daily',
        startDate: new Date('2023-04-01'),
        endDate: new Date('2023-04-30'),
        reminderEnabled: true
        // reminderTime is missing but required when reminderEnabled is true
      }
    }
  },
  
  // Device connection validation fixtures
  deviceConnections: {
    valid: {
      fitbit: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        provider: 'fitbit',
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'rt_abc123def456',
        expiresAt: new Date(Date.now() + 86400000),
        scopes: ['activity', 'heartrate', 'sleep'],
        lastSyncedAt: new Date('2023-04-15T10:30:00Z')
      },
      googleFit: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        provider: 'googlefit',
        accessToken: 'ya29.a0AfB_byC-...',
        refreshToken: '1//xEoDL4iW3cxlI...',
        expiresAt: new Date(Date.now() + 3600000),
        scopes: ['activity', 'body', 'location'],
        lastSyncedAt: new Date('2023-04-15T11:45:00Z')
      }
    },
    invalid: {
      expiredToken: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        provider: 'fitbit',
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'rt_abc123def456',
        expiresAt: new Date(Date.now() - 86400000), // Expired token
        scopes: ['activity', 'heartrate', 'sleep'],
        lastSyncedAt: new Date('2023-04-15T10:30:00Z')
      },
      unsupportedProvider: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        provider: 'garmin', // Unsupported provider
        accessToken: 'abc123def456',
        refreshToken: 'rt_abc123def456',
        expiresAt: new Date(Date.now() + 86400000),
        scopes: ['activity', 'heartrate'],
        lastSyncedAt: new Date('2023-04-15T10:30:00Z')
      },
      emptyScopes: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        provider: 'fitbit',
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'rt_abc123def456',
        expiresAt: new Date(Date.now() + 86400000),
        scopes: [], // Empty scopes array
        lastSyncedAt: new Date('2023-04-15T10:30:00Z')
      }
    }
  }
};

/**
 * Care Journey Validation Fixtures
 */
export const careJourneyFixtures = {
  // Appointment validation fixtures
  appointments: {
    valid: {
      inPerson: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        providerId: '987e6543-e21b-12d3-a456-426614174000',
        type: AppointmentType.IN_PERSON,
        specialtyId: '456e7890-e21b-12d3-a456-426614174000',
        date: new Date('2023-05-10T14:30:00Z'),
        duration: 30, // minutes
        reason: 'Annual check-up',
        notes: 'First visit with this provider',
        status: 'scheduled',
        locationId: '789e1234-e21b-12d3-a456-426614174000'
      },
      telemedicine: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        providerId: '987e6543-e21b-12d3-a456-426614174000',
        type: AppointmentType.TELEMEDICINE,
        specialtyId: '456e7890-e21b-12d3-a456-426614174000',
        date: new Date('2023-05-12T10:00:00Z'),
        duration: 15, // minutes
        reason: 'Follow-up consultation',
        notes: '',
        status: 'scheduled',
        meetingUrl: 'https://telemedicine.austa.com.br/room/abc123'
      }
    },
    invalid: {
      pastDate: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        providerId: '987e6543-e21b-12d3-a456-426614174000',
        type: AppointmentType.IN_PERSON,
        specialtyId: '456e7890-e21b-12d3-a456-426614174000',
        date: new Date('2022-05-10T14:30:00Z'), // Past date
        duration: 30,
        reason: 'Annual check-up',
        notes: '',
        status: 'scheduled',
        locationId: '789e1234-e21b-12d3-a456-426614174000'
      },
      missingLocationForInPerson: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        providerId: '987e6543-e21b-12d3-a456-426614174000',
        type: AppointmentType.IN_PERSON,
        specialtyId: '456e7890-e21b-12d3-a456-426614174000',
        date: new Date('2023-05-10T14:30:00Z'),
        duration: 30,
        reason: 'Annual check-up',
        notes: '',
        status: 'scheduled'
        // locationId is missing but required for in-person appointments
      },
      missingMeetingUrlForTelemedicine: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        providerId: '987e6543-e21b-12d3-a456-426614174000',
        type: AppointmentType.TELEMEDICINE,
        specialtyId: '456e7890-e21b-12d3-a456-426614174000',
        date: new Date('2023-05-12T10:00:00Z'),
        duration: 15,
        reason: 'Follow-up consultation',
        notes: '',
        status: 'scheduled'
        // meetingUrl is missing but required for telemedicine appointments
      },
      invalidDuration: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        providerId: '987e6543-e21b-12d3-a456-426614174000',
        type: AppointmentType.IN_PERSON,
        specialtyId: '456e7890-e21b-12d3-a456-426614174000',
        date: new Date('2023-05-10T14:30:00Z'),
        duration: 5, // Duration too short (minimum 15 minutes)
        reason: 'Annual check-up',
        notes: '',
        status: 'scheduled',
        locationId: '789e1234-e21b-12d3-a456-426614174000'
      }
    }
  },
  
  // Medication validation fixtures
  medications: {
    valid: {
      dailyMedication: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Lisinopril',
        dosage: '10mg',
        frequency: 'daily',
        startDate: new Date('2023-04-01'),
        endDate: new Date('2023-07-01'),
        instructions: 'Take with food in the morning',
        reminderEnabled: true,
        reminderTimes: ['08:00'],
        prescribedBy: '987e6543-e21b-12d3-a456-426614174000',
        active: true
      },
      multipleTimesPerDay: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Metformin',
        dosage: '500mg',
        frequency: 'twice_daily',
        startDate: new Date('2023-04-01'),
        endDate: null, // Ongoing medication
        instructions: 'Take with meals',
        reminderEnabled: true,
        reminderTimes: ['08:00', '20:00'],
        prescribedBy: '987e6543-e21b-12d3-a456-426614174000',
        active: true
      },
      asNeededMedication: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Ibuprofen',
        dosage: '400mg',
        frequency: 'as_needed',
        startDate: new Date('2023-04-01'),
        endDate: new Date('2023-04-15'),
        instructions: 'Take for pain as needed, not more than 3 times per day',
        reminderEnabled: false,
        prescribedBy: '987e6543-e21b-12d3-a456-426614174000',
        active: true
      }
    },
    invalid: {
      missingReminderTimes: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Lisinopril',
        dosage: '10mg',
        frequency: 'daily',
        startDate: new Date('2023-04-01'),
        endDate: new Date('2023-07-01'),
        instructions: 'Take with food in the morning',
        reminderEnabled: true,
        // reminderTimes is missing but required when reminderEnabled is true
        prescribedBy: '987e6543-e21b-12d3-a456-426614174000',
        active: true
      },
      invalidFrequencyReminderTimes: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Metformin',
        dosage: '500mg',
        frequency: 'twice_daily',
        startDate: new Date('2023-04-01'),
        endDate: null,
        instructions: 'Take with meals',
        reminderEnabled: true,
        reminderTimes: ['08:00'], // Only one reminder time for twice_daily frequency
        prescribedBy: '987e6543-e21b-12d3-a456-426614174000',
        active: true
      },
      endDateBeforeStartDate: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Ibuprofen',
        dosage: '400mg',
        frequency: 'as_needed',
        startDate: new Date('2023-04-15'),
        endDate: new Date('2023-04-01'), // End date before start date
        instructions: 'Take for pain as needed, not more than 3 times per day',
        reminderEnabled: false,
        prescribedBy: '987e6543-e21b-12d3-a456-426614174000',
        active: true
      }
    }
  },
  
  // Provider validation fixtures
  providers: {
    valid: {
      doctor: {
        id: '987e6543-e21b-12d3-a456-426614174000',
        name: 'Dr. Ana Silva',
        specialtyId: '456e7890-e21b-12d3-a456-426614174000',
        specialtyName: 'Cardiologist',
        licenseNumber: 'CRM-SP 123456',
        bio: 'Experienced cardiologist with 15 years of practice',
        education: [
          { institution: 'Universidade de São Paulo', degree: 'MD', year: 2005 },
          { institution: 'Hospital das Clínicas', degree: 'Residency', year: 2008 }
        ],
        languages: ['Portuguese', 'English'],
        acceptingNewPatients: true,
        telemedicineAvailable: true,
        locations: [
          { id: '789e1234-e21b-12d3-a456-426614174000', name: 'Clínica São Paulo', address: 'Av. Paulista, 1000' }
        ],
        availableHours: {
          monday: ['09:00-12:00', '14:00-17:00'],
          tuesday: ['09:00-12:00', '14:00-17:00'],
          wednesday: ['09:00-12:00'],
          thursday: ['09:00-12:00', '14:00-17:00'],
          friday: ['09:00-12:00', '14:00-17:00']
        }
      }
    },
    invalid: {
      invalidLicenseFormat: {
        id: '987e6543-e21b-12d3-a456-426614174000',
        name: 'Dr. Ana Silva',
        specialtyId: '456e7890-e21b-12d3-a456-426614174000',
        specialtyName: 'Cardiologist',
        licenseNumber: '123456', // Invalid license format (should be CRM-XX NNNNNN)
        bio: 'Experienced cardiologist with 15 years of practice',
        education: [
          { institution: 'Universidade de São Paulo', degree: 'MD', year: 2005 },
          { institution: 'Hospital das Clínicas', degree: 'Residency', year: 2008 }
        ],
        languages: ['Portuguese', 'English'],
        acceptingNewPatients: true,
        telemedicineAvailable: true,
        locations: [
          { id: '789e1234-e21b-12d3-a456-426614174000', name: 'Clínica São Paulo', address: 'Av. Paulista, 1000' }
        ],
        availableHours: {
          monday: ['09:00-12:00', '14:00-17:00'],
          tuesday: ['09:00-12:00', '14:00-17:00'],
          wednesday: ['09:00-12:00'],
          thursday: ['09:00-12:00', '14:00-17:00'],
          friday: ['09:00-12:00', '14:00-17:00']
        }
      },
      invalidTimeFormat: {
        id: '987e6543-e21b-12d3-a456-426614174000',
        name: 'Dr. Ana Silva',
        specialtyId: '456e7890-e21b-12d3-a456-426614174000',
        specialtyName: 'Cardiologist',
        licenseNumber: 'CRM-SP 123456',
        bio: 'Experienced cardiologist with 15 years of practice',
        education: [
          { institution: 'Universidade de São Paulo', degree: 'MD', year: 2005 },
          { institution: 'Hospital das Clínicas', degree: 'Residency', year: 2008 }
        ],
        languages: ['Portuguese', 'English'],
        acceptingNewPatients: true,
        telemedicineAvailable: true,
        locations: [
          { id: '789e1234-e21b-12d3-a456-426614174000', name: 'Clínica São Paulo', address: 'Av. Paulista, 1000' }
        ],
        availableHours: {
          monday: ['9:00-12:00'], // Invalid time format (should be HH:MM)
          tuesday: ['09:00-12:00', '14:00-17:00'],
          wednesday: ['09:00-12:00'],
          thursday: ['09:00-12:00', '14:00-17:00'],
          friday: ['09:00-12:00', '14:00-17:00']
        }
      },
      noLocationsWithTelemedicine: {
        id: '987e6543-e21b-12d3-a456-426614174000',
        name: 'Dr. Ana Silva',
        specialtyId: '456e7890-e21b-12d3-a456-426614174000',
        specialtyName: 'Cardiologist',
        licenseNumber: 'CRM-SP 123456',
        bio: 'Experienced cardiologist with 15 years of practice',
        education: [
          { institution: 'Universidade de São Paulo', degree: 'MD', year: 2005 },
          { institution: 'Hospital das Clínicas', degree: 'Residency', year: 2008 }
        ],
        languages: ['Portuguese', 'English'],
        acceptingNewPatients: true,
        telemedicineAvailable: true,
        locations: [], // No locations but telemedicineAvailable is true
        availableHours: {
          monday: ['09:00-12:00', '14:00-17:00'],
          tuesday: ['09:00-12:00', '14:00-17:00'],
          wednesday: ['09:00-12:00'],
          thursday: ['09:00-12:00', '14:00-17:00'],
          friday: ['09:00-12:00', '14:00-17:00']
        }
      }
    }
  }
};

/**
 * Plan Journey Validation Fixtures
 */
export const planJourneyFixtures = {
  // Claims validation fixtures
  claims: {
    valid: {
      consultation: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        procedureType: ClaimType.CONSULTATION,
        date: new Date('2023-03-15'),
        provider: 'Dr. Ana Silva',
        amount: 250.00,
        receiptUrl: 'https://storage.austa.com.br/receipts/abc123.pdf',
        status: 'submitted',
        notes: 'Regular check-up'
      },
      examination: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        procedureType: ClaimType.EXAMINATION,
        date: new Date('2023-03-20'),
        provider: 'Laboratório Diagnósticos',
        amount: 350.75,
        receiptUrl: 'https://storage.austa.com.br/receipts/def456.pdf',
        status: 'submitted',
        notes: 'Annual blood work'
      },
      emergency: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        procedureType: ClaimType.EMERGENCY,
        date: new Date('2023-03-10'),
        provider: 'Hospital São Luiz',
        amount: 1200.50,
        receiptUrl: 'https://storage.austa.com.br/receipts/ghi789.pdf',
        status: 'submitted',
        notes: 'Emergency room visit due to high fever',
        emergencyDetails: {
          admissionTime: '22:30',
          dischargeTime: '02:15',
          symptoms: ['fever', 'headache', 'nausea']
        }
      }
    },
    invalid: {
      futureDate: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        procedureType: ClaimType.CONSULTATION,
        date: new Date(Date.now() + 86400000), // Future date (tomorrow)
        provider: 'Dr. Ana Silva',
        amount: 250.00,
        receiptUrl: 'https://storage.austa.com.br/receipts/abc123.pdf',
        status: 'submitted',
        notes: 'Regular check-up'
      },
      negativeAmount: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        procedureType: ClaimType.EXAMINATION,
        date: new Date('2023-03-20'),
        provider: 'Laboratório Diagnósticos',
        amount: -350.75, // Negative amount
        receiptUrl: 'https://storage.austa.com.br/receipts/def456.pdf',
        status: 'submitted',
        notes: 'Annual blood work'
      },
      missingProvider: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        procedureType: ClaimType.CONSULTATION,
        date: new Date('2023-03-15'),
        // provider is missing
        amount: 250.00,
        receiptUrl: 'https://storage.austa.com.br/receipts/abc123.pdf',
        status: 'submitted',
        notes: 'Regular check-up'
      },
      missingEmergencyDetails: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        procedureType: ClaimType.EMERGENCY,
        date: new Date('2023-03-10'),
        provider: 'Hospital São Luiz',
        amount: 1200.50,
        receiptUrl: 'https://storage.austa.com.br/receipts/ghi789.pdf',
        status: 'submitted',
        notes: 'Emergency room visit due to high fever'
        // emergencyDetails is missing but required for emergency claims
      },
      invalidReceiptFormat: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        procedureType: ClaimType.CONSULTATION,
        date: new Date('2023-03-15'),
        provider: 'Dr. Ana Silva',
        amount: 250.00,
        receiptUrl: 'invalid-url', // Invalid URL format
        status: 'submitted',
        notes: 'Regular check-up'
      }
    }
  },
  
  // Benefits validation fixtures
  benefits: {
    valid: {
      annualCheckup: {
        id: '234e5678-e89b-12d3-a456-426614174000',
        name: 'Annual Check-up',
        description: 'Comprehensive annual health examination',
        coveragePercentage: 100,
        annualLimit: 1,
        requiresPreApproval: false,
        waitingPeriod: 30, // days
        eligibleProviders: ['in-network'],
        exclusions: ['specialty consultations'],
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31')
      },
      dentalCoverage: {
        id: '345e6789-e89b-12d3-a456-426614174000',
        name: 'Dental Coverage',
        description: 'Basic dental procedures and check-ups',
        coveragePercentage: 80,
        annualLimit: 4,
        requiresPreApproval: false,
        waitingPeriod: 60, // days
        eligibleProviders: ['in-network', 'out-network'],
        exclusions: ['cosmetic procedures', 'orthodontics'],
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31')
      },
      majorSurgery: {
        id: '456e7890-e89b-12d3-a456-426614174000',
        name: 'Major Surgery',
        description: 'Coverage for major surgical procedures',
        coveragePercentage: 90,
        annualLimit: null, // No annual limit
        requiresPreApproval: true,
        waitingPeriod: 180, // days
        eligibleProviders: ['in-network'],
        exclusions: ['elective cosmetic surgery'],
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31')
      }
    },
    invalid: {
      invalidCoveragePercentage: {
        id: '234e5678-e89b-12d3-a456-426614174000',
        name: 'Annual Check-up',
        description: 'Comprehensive annual health examination',
        coveragePercentage: 110, // Invalid percentage (> 100)
        annualLimit: 1,
        requiresPreApproval: false,
        waitingPeriod: 30,
        eligibleProviders: ['in-network'],
        exclusions: ['specialty consultations'],
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31')
      },
      negativeLimitValue: {
        id: '345e6789-e89b-12d3-a456-426614174000',
        name: 'Dental Coverage',
        description: 'Basic dental procedures and check-ups',
        coveragePercentage: 80,
        annualLimit: -4, // Negative limit
        requiresPreApproval: false,
        waitingPeriod: 60,
        eligibleProviders: ['in-network', 'out-network'],
        exclusions: ['cosmetic procedures', 'orthodontics'],
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31')
      },
      endDateBeforeStartDate: {
        id: '456e7890-e89b-12d3-a456-426614174000',
        name: 'Major Surgery',
        description: 'Coverage for major surgical procedures',
        coveragePercentage: 90,
        annualLimit: null,
        requiresPreApproval: true,
        waitingPeriod: 180,
        eligibleProviders: ['in-network'],
        exclusions: ['elective cosmetic surgery'],
        startDate: new Date('2023-12-31'), // Start date after end date
        endDate: new Date('2023-01-01')
      },
      emptyEligibleProviders: {
        id: '234e5678-e89b-12d3-a456-426614174000',
        name: 'Annual Check-up',
        description: 'Comprehensive annual health examination',
        coveragePercentage: 100,
        annualLimit: 1,
        requiresPreApproval: false,
        waitingPeriod: 30,
        eligibleProviders: [], // Empty array
        exclusions: ['specialty consultations'],
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31')
      }
    }
  },
  
  // Coverage validation fixtures
  coverage: {
    valid: {
      basicPlan: {
        id: '567e8901-e89b-12d3-a456-426614174000',
        name: 'Basic Health Plan',
        type: 'individual',
        memberId: 'BHP12345678',
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31'),
        status: 'active',
        network: 'standard',
        monthlyPremium: 350.00,
        annualDeductible: 1000.00,
        maxOutOfPocket: 5000.00,
        benefitIds: [
          '234e5678-e89b-12d3-a456-426614174000',
          '345e6789-e89b-12d3-a456-426614174000'
        ],
        dependents: [],
        documents: [
          {
            type: 'insurance_card',
            url: 'https://storage.austa.com.br/insurance/card123.pdf',
            issuedAt: new Date('2023-01-01')
          },
          {
            type: 'terms_and_conditions',
            url: 'https://storage.austa.com.br/insurance/terms123.pdf',
            issuedAt: new Date('2023-01-01')
          }
        ]
      },
      familyPlan: {
        id: '678e9012-e89b-12d3-a456-426614174000',
        name: 'Family Health Plan',
        type: 'family',
        memberId: 'FHP98765432',
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31'),
        status: 'active',
        network: 'premium',
        monthlyPremium: 850.00,
        annualDeductible: 2000.00,
        maxOutOfPocket: 10000.00,
        benefitIds: [
          '234e5678-e89b-12d3-a456-426614174000',
          '345e6789-e89b-12d3-a456-426614174000',
          '456e7890-e89b-12d3-a456-426614174000'
        ],
        dependents: [
          {
            name: 'Maria Silva',
            relationship: 'spouse',
            birthDate: new Date('1985-06-15')
          },
          {
            name: 'João Silva',
            relationship: 'child',
            birthDate: new Date('2010-03-22')
          }
        ],
        documents: [
          {
            type: 'insurance_card',
            url: 'https://storage.austa.com.br/insurance/card456.pdf',
            issuedAt: new Date('2023-01-01')
          },
          {
            type: 'terms_and_conditions',
            url: 'https://storage.austa.com.br/insurance/terms456.pdf',
            issuedAt: new Date('2023-01-01')
          }
        ]
      }
    },
    invalid: {
      invalidPlanType: {
        id: '567e8901-e89b-12d3-a456-426614174000',
        name: 'Basic Health Plan',
        type: 'group', // Invalid plan type (should be individual or family)
        memberId: 'BHP12345678',
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31'),
        status: 'active',
        network: 'standard',
        monthlyPremium: 350.00,
        annualDeductible: 1000.00,
        maxOutOfPocket: 5000.00,
        benefitIds: [
          '234e5678-e89b-12d3-a456-426614174000',
          '345e6789-e89b-12d3-a456-426614174000'
        ],
        dependents: [],
        documents: [
          {
            type: 'insurance_card',
            url: 'https://storage.austa.com.br/insurance/card123.pdf',
            issuedAt: new Date('2023-01-01')
          }
        ]
      },
      dependentsInIndividualPlan: {
        id: '567e8901-e89b-12d3-a456-426614174000',
        name: 'Basic Health Plan',
        type: 'individual',
        memberId: 'BHP12345678',
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31'),
        status: 'active',
        network: 'standard',
        monthlyPremium: 350.00,
        annualDeductible: 1000.00,
        maxOutOfPocket: 5000.00,
        benefitIds: [
          '234e5678-e89b-12d3-a456-426614174000',
          '345e6789-e89b-12d3-a456-426614174000'
        ],
        dependents: [ // Dependents in individual plan
          {
            name: 'Maria Silva',
            relationship: 'spouse',
            birthDate: new Date('1985-06-15')
          }
        ],
        documents: [
          {
            type: 'insurance_card',
            url: 'https://storage.austa.com.br/insurance/card123.pdf',
            issuedAt: new Date('2023-01-01')
          }
        ]
      },
      missingInsuranceCard: {
        id: '567e8901-e89b-12d3-a456-426614174000',
        name: 'Basic Health Plan',
        type: 'individual',
        memberId: 'BHP12345678',
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31'),
        status: 'active',
        network: 'standard',
        monthlyPremium: 350.00,
        annualDeductible: 1000.00,
        maxOutOfPocket: 5000.00,
        benefitIds: [
          '234e5678-e89b-12d3-a456-426614174000',
          '345e6789-e89b-12d3-a456-426614174000'
        ],
        dependents: [],
        documents: [ // Missing insurance_card document
          {
            type: 'terms_and_conditions',
            url: 'https://storage.austa.com.br/insurance/terms123.pdf',
            issuedAt: new Date('2023-01-01')
          }
        ]
      },
      invalidDependentRelationship: {
        id: '678e9012-e89b-12d3-a456-426614174000',
        name: 'Family Health Plan',
        type: 'family',
        memberId: 'FHP98765432',
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31'),
        status: 'active',
        network: 'premium',
        monthlyPremium: 850.00,
        annualDeductible: 2000.00,
        maxOutOfPocket: 10000.00,
        benefitIds: [
          '234e5678-e89b-12d3-a456-426614174000',
          '345e6789-e89b-12d3-a456-426614174000',
          '456e7890-e89b-12d3-a456-426614174000'
        ],
        dependents: [
          {
            name: 'Maria Silva',
            relationship: 'friend', // Invalid relationship
            birthDate: new Date('1985-06-15')
          }
        ],
        documents: [
          {
            type: 'insurance_card',
            url: 'https://storage.austa.com.br/insurance/card456.pdf',
            issuedAt: new Date('2023-01-01')
          }
        ]
      }
    }
  }
};

/**
 * Cross-Journey Validation Fixtures
 * 
 * These fixtures represent scenarios that span multiple journeys
 * and require validation across journey boundaries.
 */
export const crossJourneyFixtures = {
  // Health + Care journey integration
  healthCareIntegration: {
    valid: {
      appointmentWithHealthMetrics: {
        appointment: {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          providerId: '987e6543-e21b-12d3-a456-426614174000',
          type: AppointmentType.IN_PERSON,
          specialtyId: '456e7890-e21b-12d3-a456-426614174000',
          date: new Date('2023-05-10T14:30:00Z'),
          duration: 30,
          reason: 'Blood pressure check',
          notes: '',
          status: 'scheduled',
          locationId: '789e1234-e21b-12d3-a456-426614174000'
        },
        healthMetrics: [
          {
            userId: '123e4567-e89b-12d3-a456-426614174000',
            type: MetricType.BLOOD_PRESSURE,
            value: { systolic: 120, diastolic: 80 },
            unit: 'mmHg',
            timestamp: new Date('2023-05-01T10:30:00Z'),
            source: 'manual'
          },
          {
            userId: '123e4567-e89b-12d3-a456-426614174000',
            type: MetricType.BLOOD_PRESSURE,
            value: { systolic: 125, diastolic: 82 },
            unit: 'mmHg',
            timestamp: new Date('2023-05-05T10:30:00Z'),
            source: 'manual'
          }
        ]
      }
    },
    invalid: {
      appointmentWithoutRelevantMetrics: {
        appointment: {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          providerId: '987e6543-e21b-12d3-a456-426614174000',
          type: AppointmentType.IN_PERSON,
          specialtyId: '456e7890-e21b-12d3-a456-426614174000',
          date: new Date('2023-05-10T14:30:00Z'),
          duration: 30,
          reason: 'Blood pressure check',
          notes: '',
          status: 'scheduled',
          locationId: '789e1234-e21b-12d3-a456-426614174000'
        },
        healthMetrics: [ // No blood pressure metrics for a blood pressure check appointment
          {
            userId: '123e4567-e89b-12d3-a456-426614174000',
            type: MetricType.STEPS,
            value: 10000,
            unit: 'steps',
            timestamp: new Date('2023-05-01T10:30:00Z'),
            source: 'googlefit'
          }
        ]
      }
    }
  },
  
  // Health + Plan journey integration
  healthPlanIntegration: {
    valid: {
      claimWithHealthMetrics: {
        claim: {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          procedureType: ClaimType.EXAMINATION,
          date: new Date('2023-03-20'),
          provider: 'Laboratório Diagnósticos',
          amount: 350.75,
          receiptUrl: 'https://storage.austa.com.br/receipts/def456.pdf',
          status: 'submitted',
          notes: 'Blood glucose test'
        },
        healthMetrics: [
          {
            userId: '123e4567-e89b-12d3-a456-426614174000',
            type: MetricType.BLOOD_GLUCOSE,
            value: 110,
            unit: 'mg/dL',
            timestamp: new Date('2023-03-20T11:30:00Z'),
            source: 'manual'
          }
        ]
      }
    },
    invalid: {
      claimWithoutMatchingMetrics: {
        claim: {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          procedureType: ClaimType.EXAMINATION,
          date: new Date('2023-03-20'),
          provider: 'Laboratório Diagnósticos',
          amount: 350.75,
          receiptUrl: 'https://storage.austa.com.br/receipts/def456.pdf',
          status: 'submitted',
          notes: 'Blood glucose test'
        },
        healthMetrics: [] // Missing health metrics for the examination
      }
    }
  },
  
  // Care + Plan journey integration
  carePlanIntegration: {
    valid: {
      appointmentWithCoverage: {
        appointment: {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          providerId: '987e6543-e21b-12d3-a456-426614174000',
          type: AppointmentType.IN_PERSON,
          specialtyId: '456e7890-e21b-12d3-a456-426614174000',
          date: new Date('2023-05-10T14:30:00Z'),
          duration: 30,
          reason: 'Annual check-up',
          notes: '',
          status: 'scheduled',
          locationId: '789e1234-e21b-12d3-a456-426614174000'
        },
        coverage: {
          id: '567e8901-e89b-12d3-a456-426614174000',
          name: 'Basic Health Plan',
          type: 'individual',
          memberId: 'BHP12345678',
          startDate: new Date('2023-01-01'),
          endDate: new Date('2023-12-31'),
          status: 'active',
          network: 'standard',
          monthlyPremium: 350.00,
          annualDeductible: 1000.00,
          maxOutOfPocket: 5000.00,
          benefitIds: [
            '234e5678-e89b-12d3-a456-426614174000' // Annual check-up benefit
          ],
          dependents: [],
          documents: [
            {
              type: 'insurance_card',
              url: 'https://storage.austa.com.br/insurance/card123.pdf',
              issuedAt: new Date('2023-01-01')
            }
          ]
        },
        benefit: {
          id: '234e5678-e89b-12d3-a456-426614174000',
          name: 'Annual Check-up',
          description: 'Comprehensive annual health examination',
          coveragePercentage: 100,
          annualLimit: 1,
          requiresPreApproval: false,
          waitingPeriod: 30, // days
          eligibleProviders: ['in-network'],
          exclusions: ['specialty consultations'],
          startDate: new Date('2023-01-01'),
          endDate: new Date('2023-12-31')
        }
      }
    },
    invalid: {
      appointmentWithoutCoverage: {
        appointment: {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          providerId: '987e6543-e21b-12d3-a456-426614174000',
          type: AppointmentType.IN_PERSON,
          specialtyId: '456e7890-e21b-12d3-a456-426614174000',
          date: new Date('2023-05-10T14:30:00Z'),
          duration: 30,
          reason: 'Annual check-up',
          notes: '',
          status: 'scheduled',
          locationId: '789e1234-e21b-12d3-a456-426614174000'
        },
        coverage: {
          id: '567e8901-e89b-12d3-a456-426614174000',
          name: 'Basic Health Plan',
          type: 'individual',
          memberId: 'BHP12345678',
          startDate: new Date('2023-01-01'),
          endDate: new Date('2023-12-31'),
          status: 'active',
          network: 'standard',
          monthlyPremium: 350.00,
          annualDeductible: 1000.00,
          maxOutOfPocket: 5000.00,
          benefitIds: [
            '345e6789-e89b-12d3-a456-426614174000' // Dental coverage benefit (not annual check-up)
          ],
          dependents: [],
          documents: [
            {
              type: 'insurance_card',
              url: 'https://storage.austa.com.br/insurance/card123.pdf',
              issuedAt: new Date('2023-01-01')
            }
          ]
        },
        benefit: {
          id: '345e6789-e89b-12d3-a456-426614174000',
          name: 'Dental Coverage',
          description: 'Basic dental procedures and check-ups',
          coveragePercentage: 80,
          annualLimit: 4,
          requiresPreApproval: false,
          waitingPeriod: 60,
          eligibleProviders: ['in-network', 'out-network'],
          exclusions: ['cosmetic procedures', 'orthodontics'],
          startDate: new Date('2023-01-01'),
          endDate: new Date('2023-12-31')
        }
      },
      appointmentWithInactiveProvider: {
        appointment: {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          providerId: '987e6543-e21b-12d3-a456-426614174000',
          type: AppointmentType.IN_PERSON,
          specialtyId: '456e7890-e21b-12d3-a456-426614174000',
          date: new Date('2023-05-10T14:30:00Z'),
          duration: 30,
          reason: 'Annual check-up',
          notes: '',
          status: 'scheduled',
          locationId: '789e1234-e21b-12d3-a456-426614174000'
        },
        coverage: {
          id: '567e8901-e89b-12d3-a456-426614174000',
          name: 'Basic Health Plan',
          type: 'individual',
          memberId: 'BHP12345678',
          startDate: new Date('2023-01-01'),
          endDate: new Date('2023-12-31'),
          status: 'active',
          network: 'standard',
          monthlyPremium: 350.00,
          annualDeductible: 1000.00,
          maxOutOfPocket: 5000.00,
          benefitIds: [
            '234e5678-e89b-12d3-a456-426614174000' // Annual check-up benefit
          ],
          dependents: [],
          documents: [
            {
              type: 'insurance_card',
              url: 'https://storage.austa.com.br/insurance/card123.pdf',
              issuedAt: new Date('2023-01-01')
            }
          ]
        },
        benefit: {
          id: '234e5678-e89b-12d3-a456-426614174000',
          name: 'Annual Check-up',
          description: 'Comprehensive annual health examination',
          coveragePercentage: 100,
          annualLimit: 1,
          requiresPreApproval: false,
          waitingPeriod: 30,
          eligibleProviders: ['in-network'],
          exclusions: ['specialty consultations'],
          startDate: new Date('2023-01-01'),
          endDate: new Date('2023-12-31')
        },
        provider: {
          id: '987e6543-e21b-12d3-a456-426614174000',
          name: 'Dr. Ana Silva',
          specialtyId: '456e7890-e21b-12d3-a456-426614174000',
          specialtyName: 'Cardiologist',
          licenseNumber: 'CRM-SP 123456',
          bio: 'Experienced cardiologist with 15 years of practice',
          education: [
            { institution: 'Universidade de São Paulo', degree: 'MD', year: 2005 },
            { institution: 'Hospital das Clínicas', degree: 'Residency', year: 2008 }
          ],
          languages: ['Portuguese', 'English'],
          acceptingNewPatients: false, // Not accepting new patients
          telemedicineAvailable: true,
          locations: [
            { id: '789e1234-e21b-12d3-a456-426614174000', name: 'Clínica São Paulo', address: 'Av. Paulista, 1000' }
          ],
          availableHours: {}
        }
      }
    }
  }
};

/**
 * Validation Schema Examples
 * 
 * These are examples of Zod validation schemas that can be used with the fixtures.
 * They demonstrate how to implement journey-specific validation rules.
 */
export const validationSchemaExamples = {
  // Health journey validation schemas
  health: {
    metricSchema: z.object({
      userId: z.string().uuid(),
      type: z.nativeEnum(MetricType),
      value: z.union([
        z.number(),
        z.object({
          systolic: z.number().int().positive(),
          diastolic: z.number().int().positive()
        })
      ]),
      unit: z.string(),
      timestamp: z.date().refine(date => date <= new Date(), {
        message: 'Timestamp cannot be in the future'
      }),
      source: z.string()
    }).refine(data => {
      // Custom refinement for blood pressure format
      if (data.type === MetricType.BLOOD_PRESSURE) {
        return typeof data.value === 'object' && 'systolic' in data.value && 'diastolic' in data.value;
      }
      return true;
    }, {
      message: 'Blood pressure metrics must include systolic and diastolic values',
      path: ['value']
    })
  },
  
  // Care journey validation schemas
  care: {
    appointmentSchema: z.object({
      userId: z.string().uuid(),
      providerId: z.string().uuid(),
      type: z.nativeEnum(AppointmentType),
      specialtyId: z.string().uuid(),
      date: z.date().refine(date => date > new Date(), {
        message: 'Appointment date must be in the future'
      }),
      duration: z.number().int().min(15).max(120),
      reason: z.string().min(1),
      notes: z.string().optional(),
      status: z.string(),
      locationId: z.string().uuid().optional(),
      meetingUrl: z.string().url().optional()
    }).refine(data => {
      // Custom refinement for appointment type requirements
      if (data.type === AppointmentType.IN_PERSON && !data.locationId) {
        return false;
      }
      if (data.type === AppointmentType.TELEMEDICINE && !data.meetingUrl) {
        return false;
      }
      return true;
    }, {
      message: 'In-person appointments require a location ID and telemedicine appointments require a meeting URL',
      path: ['type']
    })
  },
  
  // Plan journey validation schemas
  plan: {
    claimSchema: z.object({
      userId: z.string().uuid(),
      procedureType: z.nativeEnum(ClaimType),
      date: z.date().refine(date => date <= new Date(), {
        message: 'Claim date cannot be in the future'
      }),
      provider: z.string().min(1),
      amount: z.number().positive(),
      receiptUrl: z.string().url(),
      status: z.string(),
      notes: z.string().optional(),
      emergencyDetails: z.object({
        admissionTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
        dischargeTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
        symptoms: z.array(z.string()).min(1)
      }).optional()
    }).refine(data => {
      // Custom refinement for emergency claims
      if (data.procedureType === ClaimType.EMERGENCY && !data.emergencyDetails) {
        return false;
      }
      return true;
    }, {
      message: 'Emergency claims require emergency details',
      path: ['emergencyDetails']
    })
  }
};