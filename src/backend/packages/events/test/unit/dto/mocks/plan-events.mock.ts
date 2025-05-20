import { EventType } from '../../../../src/dto/event-types.enum';

/**
 * Mock data for Plan journey events.
 * 
 * These mocks represent structured event data for various plan-related user actions
 * that trigger gamification processes. They are used for testing the gamification
 * engine's handling of insurance and benefits-related events.
 */

/**
 * Mock claim submission events with different claim types and amounts.
 */
export const CLAIM_SUBMITTED_EVENTS = [
  {
    type: EventType.PLAN_CLAIM_SUBMITTED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    journey: 'plan',
    data: {
      claimId: 'c1a1m001-0000-4000-a000-000000000001',
      claimType: 'Consulta Médica',
      providerId: 'pr0v1d3r-0000-4000-a000-000000000001',
      serviceDate: '2023-05-15T14:30:00Z',
      amount: 250.00,
      submittedAt: '2023-05-16T10:15:30Z'
    },
    metadata: {
      correlationId: 'c0rr3l4t-0000-4000-a000-000000000001',
      timestamp: '2023-05-16T10:15:30Z',
      source: 'plan-service',
      version: '1.0.0'
    }
  },
  {
    type: EventType.PLAN_CLAIM_SUBMITTED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    journey: 'plan',
    data: {
      claimId: 'c1a1m002-0000-4000-a000-000000000002',
      claimType: 'Exame',
      providerId: 'pr0v1d3r-0000-4000-a000-000000000002',
      serviceDate: '2023-05-20T09:45:00Z',
      amount: 450.75,
      submittedAt: '2023-05-21T16:20:45Z'
    },
    metadata: {
      correlationId: 'c0rr3l4t-0000-4000-a000-000000000002',
      timestamp: '2023-05-21T16:20:45Z',
      source: 'plan-service',
      version: '1.0.0'
    }
  },
  {
    type: EventType.PLAN_CLAIM_SUBMITTED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    journey: 'plan',
    data: {
      claimId: 'c1a1m003-0000-4000-a000-000000000003',
      claimType: 'Terapia',
      providerId: 'pr0v1d3r-0000-4000-a000-000000000003',
      serviceDate: '2023-05-25T13:00:00Z',
      amount: 180.00,
      submittedAt: '2023-05-25T18:10:15Z'
    },
    metadata: {
      correlationId: 'c0rr3l4t-0000-4000-a000-000000000003',
      timestamp: '2023-05-25T18:10:15Z',
      source: 'plan-service',
      version: '1.0.0'
    }
  },
  {
    type: EventType.PLAN_CLAIM_SUBMITTED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    journey: 'plan',
    data: {
      claimId: 'c1a1m004-0000-4000-a000-000000000004',
      claimType: 'Internação',
      providerId: 'pr0v1d3r-0000-4000-a000-000000000004',
      serviceDate: '2023-06-01T08:00:00Z',
      amount: 5250.00,
      submittedAt: '2023-06-05T14:30:00Z'
    },
    metadata: {
      correlationId: 'c0rr3l4t-0000-4000-a000-000000000004',
      timestamp: '2023-06-05T14:30:00Z',
      source: 'plan-service',
      version: '1.0.0'
    }
  },
  {
    type: EventType.PLAN_CLAIM_SUBMITTED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    journey: 'plan',
    data: {
      claimId: 'c1a1m005-0000-4000-a000-000000000005',
      claimType: 'Medicamento',
      providerId: 'pr0v1d3r-0000-4000-a000-000000000005',
      serviceDate: '2023-06-10T10:30:00Z',
      amount: 125.50,
      submittedAt: '2023-06-10T11:45:20Z'
    },
    metadata: {
      correlationId: 'c0rr3l4t-0000-4000-a000-000000000005',
      timestamp: '2023-06-10T11:45:20Z',
      source: 'plan-service',
      version: '1.0.0'
    }
  }
];

/**
 * Mock claim processed events with different statuses and covered amounts.
 */
export const CLAIM_PROCESSED_EVENTS = [
  {
    type: EventType.PLAN_CLAIM_PROCESSED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    journey: 'plan',
    data: {
      claimId: 'c1a1m001-0000-4000-a000-000000000001',
      status: 'approved',
      amount: 250.00,
      coveredAmount: 200.00,
      processedAt: '2023-05-18T09:30:15Z'
    },
    metadata: {
      correlationId: 'c0rr3l4t-0000-4000-a000-000000000001',
      timestamp: '2023-05-18T09:30:15Z',
      source: 'plan-service',
      version: '1.0.0'
    }
  },
  {
    type: EventType.PLAN_CLAIM_PROCESSED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    journey: 'plan',
    data: {
      claimId: 'c1a1m002-0000-4000-a000-000000000002',
      status: 'partial',
      amount: 450.75,
      coveredAmount: 350.00,
      processedAt: '2023-05-23T14:20:10Z'
    },
    metadata: {
      correlationId: 'c0rr3l4t-0000-4000-a000-000000000002',
      timestamp: '2023-05-23T14:20:10Z',
      source: 'plan-service',
      version: '1.0.0'
    }
  },
  {
    type: EventType.PLAN_CLAIM_PROCESSED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    journey: 'plan',
    data: {
      claimId: 'c1a1m003-0000-4000-a000-000000000003',
      status: 'approved',
      amount: 180.00,
      coveredAmount: 180.00,
      processedAt: '2023-05-27T11:45:30Z'
    },
    metadata: {
      correlationId: 'c0rr3l4t-0000-4000-a000-000000000003',
      timestamp: '2023-05-27T11:45:30Z',
      source: 'plan-service',
      version: '1.0.0'
    }
  },
  {
    type: EventType.PLAN_CLAIM_PROCESSED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    journey: 'plan',
    data: {
      claimId: 'c1a1m004-0000-4000-a000-000000000004',
      status: 'denied',
      amount: 5250.00,
      coveredAmount: 0.00,
      processedAt: '2023-06-08T16:15:45Z'
    },
    metadata: {
      correlationId: 'c0rr3l4t-0000-4000-a000-000000000004',
      timestamp: '2023-06-08T16:15:45Z',
      source: 'plan-service',
      version: '1.0.0'
    }
  },
  {
    type: EventType.PLAN_CLAIM_PROCESSED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    journey: 'plan',
    data: {
      claimId: 'c1a1m005-0000-4000-a000-000000000005',
      status: 'approved',
      amount: 125.50,
      coveredAmount: 100.40,
      processedAt: '2023-06-12T10:20:15Z'
    },
    metadata: {
      correlationId: 'c0rr3l4t-0000-4000-a000-000000000005',
      timestamp: '2023-06-12T10:20:15Z',
      source: 'plan-service',
      version: '1.0.0'
    }
  }
];

/**
 * Mock plan selection events with different plan types and coverage levels.
 */
export const PLAN_SELECTED_EVENTS = [
  {
    type: EventType.PLAN_SELECTED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    journey: 'plan',
    data: {
      planId: 'p1an0001-0000-4000-a000-000000000001',
      planType: 'Básico',
      coverageLevel: 'individual',
      premium: 350.00,
      startDate: '2023-07-01T00:00:00Z',
      selectedAt: '2023-06-15T14:30:00Z'
    },
    metadata: {
      correlationId: 'c0rr3l4t-0000-4000-a000-000000000010',
      timestamp: '2023-06-15T14:30:00Z',
      source: 'plan-service',
      version: '1.0.0'
    }
  },
  {
    type: EventType.PLAN_SELECTED,
    userId: '660f9500-f30c-42e5-b827-557766550111',
    journey: 'plan',
    data: {
      planId: 'p1an0002-0000-4000-a000-000000000002',
      planType: 'Standard',
      coverageLevel: 'family',
      premium: 850.00,
      startDate: '2023-08-01T00:00:00Z',
      selectedAt: '2023-07-10T11:20:45Z'
    },
    metadata: {
      correlationId: 'c0rr3l4t-0000-4000-a000-000000000011',
      timestamp: '2023-07-10T11:20:45Z',
      source: 'plan-service',
      version: '1.0.0'
    }
  },
  {
    type: EventType.PLAN_SELECTED,
    userId: '770a0600-a40d-43f6-c938-668877660222',
    journey: 'plan',
    data: {
      planId: 'p1an0003-0000-4000-a000-000000000003',
      planType: 'Premium',
      coverageLevel: 'individual',
      premium: 650.00,
      startDate: '2023-09-01T00:00:00Z',
      selectedAt: '2023-08-15T16:45:30Z'
    },
    metadata: {
      correlationId: 'c0rr3l4t-0000-4000-a000-000000000012',
      timestamp: '2023-08-15T16:45:30Z',
      source: 'plan-service',
      version: '1.0.0'
    }
  }
];

/**
 * Mock benefit utilization events with different benefit types.
 */
export const BENEFIT_UTILIZED_EVENTS = [
  {
    type: EventType.PLAN_BENEFIT_UTILIZED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    journey: 'plan',
    data: {
      benefitId: 'b3n3f1t1-0000-4000-a000-000000000001',
      benefitType: 'wellness',
      providerId: 'pr0v1d3r-0000-4000-a000-000000000010',
      utilizationDate: '2023-06-20T10:30:00Z',
      savingsAmount: 120.00
    },
    metadata: {
      correlationId: 'c0rr3l4t-0000-4000-a000-000000000020',
      timestamp: '2023-06-20T10:30:00Z',
      source: 'plan-service',
      version: '1.0.0'
    }
  },
  {
    type: EventType.PLAN_BENEFIT_UTILIZED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    journey: 'plan',
    data: {
      benefitId: 'b3n3f1t2-0000-4000-a000-000000000002',
      benefitType: 'preventive',
      providerId: 'pr0v1d3r-0000-4000-a000-000000000011',
      utilizationDate: '2023-07-05T14:15:00Z',
      savingsAmount: 200.00
    },
    metadata: {
      correlationId: 'c0rr3l4t-0000-4000-a000-000000000021',
      timestamp: '2023-07-05T14:15:00Z',
      source: 'plan-service',
      version: '1.0.0'
    }
  },
  {
    type: EventType.PLAN_BENEFIT_UTILIZED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    journey: 'plan',
    data: {
      benefitId: 'b3n3f1t3-0000-4000-a000-000000000003',
      benefitType: 'specialist',
      providerId: 'pr0v1d3r-0000-4000-a000-000000000012',
      utilizationDate: '2023-07-15T09:45:00Z',
      savingsAmount: 350.00
    },
    metadata: {
      correlationId: 'c0rr3l4t-0000-4000-a000-000000000022',
      timestamp: '2023-07-15T09:45:00Z',
      source: 'plan-service',
      version: '1.0.0'
    }
  },
  {
    type: EventType.PLAN_BENEFIT_UTILIZED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    journey: 'plan',
    data: {
      benefitId: 'b3n3f1t4-0000-4000-a000-000000000004',
      benefitType: 'pharmacy',
      providerId: 'pr0v1d3r-0000-4000-a000-000000000013',
      utilizationDate: '2023-07-25T16:30:00Z',
      savingsAmount: 75.50
    },
    metadata: {
      correlationId: 'c0rr3l4t-0000-4000-a000-000000000023',
      timestamp: '2023-07-25T16:30:00Z',
      source: 'plan-service',
      version: '1.0.0'
    }
  }
];

/**
 * Mock reward redemption events with different reward types.
 */
export const REWARD_REDEEMED_EVENTS = [
  {
    type: EventType.PLAN_REWARD_REDEEMED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    journey: 'plan',
    data: {
      rewardId: 'r3w4rd01-0000-4000-a000-000000000001',
      rewardType: 'gift_card',
      pointsRedeemed: 5000,
      value: 50.00,
      redeemedAt: '2023-06-25T11:30:00Z'
    },
    metadata: {
      correlationId: 'c0rr3l4t-0000-4000-a000-000000000030',
      timestamp: '2023-06-25T11:30:00Z',
      source: 'plan-service',
      version: '1.0.0'
    }
  },
  {
    type: EventType.PLAN_REWARD_REDEEMED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    journey: 'plan',
    data: {
      rewardId: 'r3w4rd02-0000-4000-a000-000000000002',
      rewardType: 'premium_discount',
      pointsRedeemed: 10000,
      value: 100.00,
      redeemedAt: '2023-07-10T15:45:00Z'
    },
    metadata: {
      correlationId: 'c0rr3l4t-0000-4000-a000-000000000031',
      timestamp: '2023-07-10T15:45:00Z',
      source: 'plan-service',
      version: '1.0.0'
    }
  },
  {
    type: EventType.PLAN_REWARD_REDEEMED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    journey: 'plan',
    data: {
      rewardId: 'r3w4rd03-0000-4000-a000-000000000003',
      rewardType: 'merchandise',
      pointsRedeemed: 7500,
      value: 75.00,
      redeemedAt: '2023-07-20T09:15:00Z'
    },
    metadata: {
      correlationId: 'c0rr3l4t-0000-4000-a000-000000000032',
      timestamp: '2023-07-20T09:15:00Z',
      source: 'plan-service',
      version: '1.0.0'
    }
  },
  {
    type: EventType.PLAN_REWARD_REDEEMED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    journey: 'plan',
    data: {
      rewardId: 'r3w4rd04-0000-4000-a000-000000000004',
      rewardType: 'wellness_service',
      pointsRedeemed: 15000,
      value: 150.00,
      redeemedAt: '2023-08-05T14:30:00Z'
    },
    metadata: {
      correlationId: 'c0rr3l4t-0000-4000-a000-000000000033',
      timestamp: '2023-08-05T14:30:00Z',
      source: 'plan-service',
      version: '1.0.0'
    }
  }
];

/**
 * Mock document completion events with different document types.
 */
export const DOCUMENT_COMPLETED_EVENTS = [
  {
    type: EventType.PLAN_DOCUMENT_COMPLETED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    journey: 'plan',
    data: {
      documentId: 'd0cum3nt-0000-4000-a000-000000000001',
      documentType: 'enrollment',
      completedAt: '2023-06-10T10:15:00Z'
    },
    metadata: {
      correlationId: 'c0rr3l4t-0000-4000-a000-000000000040',
      timestamp: '2023-06-10T10:15:00Z',
      source: 'plan-service',
      version: '1.0.0'
    }
  },
  {
    type: EventType.PLAN_DOCUMENT_COMPLETED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    journey: 'plan',
    data: {
      documentId: 'd0cum3nt-0000-4000-a000-000000000002',
      documentType: 'consent',
      completedAt: '2023-06-15T14:30:00Z'
    },
    metadata: {
      correlationId: 'c0rr3l4t-0000-4000-a000-000000000041',
      timestamp: '2023-06-15T14:30:00Z',
      source: 'plan-service',
      version: '1.0.0'
    }
  },
  {
    type: EventType.PLAN_DOCUMENT_COMPLETED,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    journey: 'plan',
    data: {
      documentId: 'd0cum3nt-0000-4000-a000-000000000003',
      documentType: 'authorization',
      completedAt: '2023-06-20T09:45:00Z'
    },
    metadata: {
      correlationId: 'c0rr3l4t-0000-4000-a000-000000000042',
      timestamp: '2023-06-20T09:45:00Z',
      source: 'plan-service',
      version: '1.0.0'
    }
  }
];

/**
 * All plan journey events combined for easy access.
 */
export const ALL_PLAN_EVENTS = [
  ...CLAIM_SUBMITTED_EVENTS,
  ...CLAIM_PROCESSED_EVENTS,
  ...PLAN_SELECTED_EVENTS,
  ...BENEFIT_UTILIZED_EVENTS,
  ...REWARD_REDEEMED_EVENTS,
  ...DOCUMENT_COMPLETED_EVENTS
];

/**
 * Categorized plan events by type for easier testing.
 */
export const PLAN_EVENTS_BY_TYPE = {
  CLAIM_SUBMITTED: CLAIM_SUBMITTED_EVENTS,
  CLAIM_PROCESSED: CLAIM_PROCESSED_EVENTS,
  PLAN_SELECTED: PLAN_SELECTED_EVENTS,
  BENEFIT_UTILIZED: BENEFIT_UTILIZED_EVENTS,
  REWARD_REDEEMED: REWARD_REDEEMED_EVENTS,
  DOCUMENT_COMPLETED: DOCUMENT_COMPLETED_EVENTS
};