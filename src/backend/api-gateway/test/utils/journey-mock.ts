/**
 * Mock data factories for journey-specific data used in API Gateway tests.
 * These factories create consistent test data for Health, Care, and Plan journeys.
 */

/**
 * Creates mock data for the Health journey.
 * 
 * @param userId Optional user ID to associate with the data
 * @returns Mock Health journey data
 */
export function mockHealthJourneyData(userId: string = '123e4567-e89b-12d3-a456-426614174000') {
  return {
    metrics: [
      {
        id: '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p',
        userId,
        type: 'BLOOD_PRESSURE',
        value: '120/80',
        unit: 'mmHg',
        recordedAt: new Date().toISOString(),
      },
      {
        id: '2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q',
        userId,
        type: 'WEIGHT',
        value: '70',
        unit: 'kg',
        recordedAt: new Date().toISOString(),
      },
      {
        id: '3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r',
        userId,
        type: 'HEART_RATE',
        value: '72',
        unit: 'bpm',
        recordedAt: new Date().toISOString(),
      },
    ],
    goals: [
      {
        id: '4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s',
        userId,
        type: 'STEPS',
        target: '10000',
        unit: 'steps',
        progress: '7500',
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      },
      {
        id: '5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t',
        userId,
        type: 'WEIGHT',
        target: '65',
        unit: 'kg',
        progress: '70',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days from now
      },
    ],
    devices: [
      {
        id: '6f7g8h9i-0j1k-2l3m-4n5o-6p7q8r9s0t1u',
        userId,
        type: 'SMARTWATCH',
        brand: 'FitBit',
        model: 'Versa 3',
        connectedAt: new Date().toISOString(),
        lastSyncAt: new Date().toISOString(),
      },
      {
        id: '7g8h9i0j-1k2l-3m4n-5o6p-7q8r9s0t1u2v',
        userId,
        type: 'SCALE',
        brand: 'Withings',
        model: 'Body+',
        connectedAt: new Date().toISOString(),
        lastSyncAt: new Date().toISOString(),
      },
    ],
  };
}

/**
 * Creates mock data for the Care journey.
 * 
 * @param userId Optional user ID to associate with the data
 * @returns Mock Care journey data
 */
export function mockCareJourneyData(userId: string = '123e4567-e89b-12d3-a456-426614174000') {
  return {
    appointments: [
      {
        id: '8h9i0j1k-2l3m-4n5o-6p7q-8r9s0t1u2v3w',
        userId,
        providerId: '123e4567-e89b-12d3-a456-426614174000',
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
        status: 'SCHEDULED',
        notes: 'Regular checkup',
        createdAt: new Date().toISOString(),
      },
      {
        id: '9i0j1k2l-3m4n-5o6p-7q8r-9s0t1u2v3w4x',
        userId,
        providerId: '234f5678-f90a-23e4-b567-527715285001',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        status: 'COMPLETED',
        notes: 'Dental cleaning',
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
      },
    ],
    medications: [
      {
        id: '0j1k2l3m-4n5o-6p7q-8r9s-0t1u2v3w4x5y',
        userId,
        name: 'Lisinopril',
        dosage: '10mg',
        frequency: 'DAILY',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        endDate: null, // Ongoing
        instructions: 'Take with food',
      },
      {
        id: '1k2l3m4n-5o6p-7q8r-9s0t-1u2v3w4x5y6z',
        userId,
        name: 'Amoxicillin',
        dosage: '500mg',
        frequency: 'TWICE_DAILY',
        startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
        instructions: 'Take with water',
      },
    ],
    providers: [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Dr. Jane Smith',
        specialty: 'General Practitioner',
        address: '123 Medical Center Dr, Healthville, CA 90210',
        phone: '+1-555-123-4567',
        email: 'dr.smith@example.com',
      },
      {
        id: '234f5678-f90a-23e4-b567-527715285001',
        name: 'Dr. John Doe',
        specialty: 'Dentist',
        address: '456 Dental Plaza, Healthville, CA 90210',
        phone: '+1-555-987-6543',
        email: 'dr.doe@example.com',
      },
    ],
  };
}

/**
 * Creates mock data for the Plan journey.
 * 
 * @param userId Optional user ID to associate with the data
 * @returns Mock Plan journey data
 */
export function mockPlanJourneyData(userId: string = '123e4567-e89b-12d3-a456-426614174000') {
  return {
    plans: [
      {
        id: '2l3m4n5o-6p7q-8r9s-0t1u-2v3w4x5y6z7a',
        userId,
        name: 'Premium Health Plan',
        type: 'HEALTH',
        provider: 'AUSTA Insurance',
        policyNumber: 'HL-12345678',
        startDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(), // 180 days ago
        endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(), // 180 days from now
        status: 'ACTIVE',
      },
      {
        id: '3m4n5o6p-7q8r-9s0t-1u2v-3w4x5y6z7a8b',
        userId,
        name: 'Dental Coverage',
        type: 'DENTAL',
        provider: 'AUSTA Insurance',
        policyNumber: 'DL-87654321',
        startDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(), // 180 days ago
        endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(), // 180 days from now
        status: 'ACTIVE',
      },
    ],
    claims: [
      {
        id: '4n5o6p7q-8r9s-0t1u-2v3w-4x5y6z7a8b9c',
        userId,
        planId: '2l3m4n5o-6p7q-8r9s-0t1u-2v3w4x5y6z7a',
        type: 'MEDICAL',
        amount: 150.00,
        status: 'APPROVED',
        submittedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
        processedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
        description: 'Doctor visit',
      },
      {
        id: '5o6p7q8r-9s0t-1u2v-3w4x-5y6z7a8b9c0d',
        userId,
        planId: '3m4n5o6p-7q8r-9s0t-1u2v-3w4x5y6z7a8b',
        type: 'DENTAL',
        amount: 200.00,
        status: 'PENDING',
        submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        processedAt: null,
        description: 'Dental cleaning',
      },
    ],
    benefits: [
      {
        id: '6p7q8r9s-0t1u-2v3w-4x5y-6z7a8b9c0d1e',
        planId: '2l3m4n5o-6p7q-8r9s-0t1u-2v3w4x5y6z7a',
        name: 'Primary Care Visits',
        description: 'Coverage for primary care physician visits',
        coverage: 90,
        limit: 'Unlimited',
        copay: 20.00,
      },
      {
        id: '7q8r9s0t-1u2v-3w4x-5y6z-7a8b9c0d1e2f',
        planId: '2l3m4n5o-6p7q-8r9s-0t1u-2v3w4x5y6z7a',
        name: 'Specialist Visits',
        description: 'Coverage for specialist physician visits',
        coverage: 80,
        limit: '10 visits per year',
        copay: 40.00,
      },
      {
        id: '8r9s0t1u-2v3w-4x5y-6z7a-8b9c0d1e2f3g',
        planId: '3m4n5o6p-7q8r-9s0t-1u2v-3w4x5y6z7a8b',
        name: 'Dental Cleanings',
        description: 'Coverage for routine dental cleanings',
        coverage: 100,
        limit: '2 per year',
        copay: 0.00,
      },
    ],
  };
}

/**
 * Creates a mock gamification profile for a user.
 * 
 * @param userId Optional user ID to associate with the profile
 * @returns Mock gamification profile
 */
export function mockGamificationProfile(userId: string = '123e4567-e89b-12d3-a456-426614174000') {
  return {
    id: '9s0t1u2v-3w4x-5y6z-7a8b-9c0d1e2f3g4h',
    userId,
    level: 5,
    xp: 2500,
    xpToNextLevel: 500,
    achievements: [
      {
        id: '0t1u2v3w-4x5y-6z7a-8b9c-0d1e2f3g4h5i',
        name: 'Health Enthusiast',
        description: 'Record 10 health metrics',
        journey: 'health',
        xpAwarded: 100,
        unlockedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      },
      {
        id: '1u2v3w4x-5y6z-7a8b-9c0d-1e2f3g4h5i6j',
        name: 'Care Planner',
        description: 'Book 3 appointments',
        journey: 'care',
        xpAwarded: 150,
        unlockedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
      },
      {
        id: '2v3w4x5y-6z7a-8b9c-0d1e-2f3g4h5i6j7k',
        name: 'Claim Master',
        description: 'Submit 5 claims',
        journey: 'plan',
        xpAwarded: 200,
        unlockedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      },
      {
        id: '3w4x5y6z-7a8b-9c0d-1e2f-3g4h5i6j7k8l',
        name: 'Journey Explorer',
        description: 'Use all three journeys in a single day',
        journey: 'cross-journey',
        xpAwarded: 300,
        unlockedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      },
    ],
    quests: [
      {
        id: '4x5y6z7a-8b9c-0d1e-2f3g-4h5i6j7k8l9m',
        name: 'Wellness Week',
        description: 'Complete health-related activities for 7 days',
        progress: 5,
        total: 7,
        xpReward: 500,
        startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      },
    ],
    rewards: [
      {
        id: '5y6z7a8b-9c0d-1e2f-3g4h-5i6j7k8l9m0n',
        name: 'Premium Subscription Discount',
        description: '20% off premium subscription',
        cost: 1000, // XP cost
        claimed: false,
        availableUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      },
    ],
  };
}