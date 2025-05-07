/**
 * Journey Mock Data Factory
 * 
 * This utility provides factories for creating mock journey-specific data used in API Gateway tests.
 * It includes data generators for Health, Care, and Plan journeys, with appropriate relationships
 * between entities to enable comprehensive testing of cross-journey functionality.
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  IHealthMetric, 
  IHealthGoal, 
  IMedicalEvent, 
  IDeviceConnection,
  MetricType,
  MetricSource,
  GoalType,
  GoalStatus,
  GoalPeriod,
  ConnectionStatus,
  DeviceType
} from '@austa/interfaces/journey/health';

import {
  IAppointment,
  IProvider,
  IMedication,
  ITelemedicineSession,
  ITreatmentPlan,
  AppointmentStatus,
  AppointmentType
} from '@austa/interfaces/journey/care';

import {
  IPlan,
  IClaim,
  ICoverage,
  IBenefit,
  IDocument,
  ClaimStatus
} from '@austa/interfaces/journey/plan';

import { IUser } from '@austa/interfaces/auth';

/**
 * User mock factory
 */
export const createMockUser = (overrides: Partial<IUser> = {}): IUser => ({
  id: uuidv4(),
  email: `user-${Math.floor(Math.random() * 10000)}@example.com`,
  firstName: 'Test',
  lastName: 'User',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

/**
 * Health Journey Mock Factories
 */

/**
 * Creates a mock health metric with default values that can be overridden
 */
export const createMockHealthMetric = (overrides: Partial<IHealthMetric> = {}): IHealthMetric => ({
  id: uuidv4(),
  userId: overrides.userId || uuidv4(),
  type: overrides.type || MetricType.HEART_RATE,
  value: overrides.value || 75,
  unit: overrides.unit || 'bpm',
  source: overrides.source || MetricSource.MANUAL,
  timestamp: overrides.timestamp || new Date(),
  notes: overrides.notes,
  deviceId: overrides.deviceId,
  createdAt: overrides.createdAt || new Date(),
  updatedAt: overrides.updatedAt || new Date(),
});

/**
 * Creates a mock health goal with default values that can be overridden
 */
export const createMockHealthGoal = (overrides: Partial<IHealthGoal> = {}): IHealthGoal => ({
  id: uuidv4(),
  userId: overrides.userId || uuidv4(),
  type: overrides.type || GoalType.STEPS,
  target: overrides.target || 10000,
  unit: overrides.unit || 'steps',
  period: overrides.period || GoalPeriod.DAILY,
  status: overrides.status || GoalStatus.ACTIVE,
  startDate: overrides.startDate || new Date(),
  endDate: overrides.endDate,
  progress: overrides.progress || 0,
  lastUpdated: overrides.lastUpdated || new Date(),
  createdAt: overrides.createdAt || new Date(),
  updatedAt: overrides.updatedAt || new Date(),
});

/**
 * Creates a mock medical event with default values that can be overridden
 */
export const createMockMedicalEvent = (overrides: Partial<IMedicalEvent> = {}): IMedicalEvent => ({
  id: uuidv4(),
  userId: overrides.userId || uuidv4(),
  type: overrides.type || 'Consultation',
  description: overrides.description || 'Routine check-up',
  date: overrides.date || new Date(),
  providerName: overrides.providerName || 'Dr. Smith',
  providerSpecialty: overrides.providerSpecialty || 'General Practitioner',
  location: overrides.location || 'Main Clinic',
  notes: overrides.notes || 'No significant findings',
  documentIds: overrides.documentIds || [],
  createdAt: overrides.createdAt || new Date(),
  updatedAt: overrides.updatedAt || new Date(),
});

/**
 * Creates a mock device connection with default values that can be overridden
 */
export const createMockDeviceConnection = (overrides: Partial<IDeviceConnection> = {}): IDeviceConnection => ({
  id: uuidv4(),
  userId: overrides.userId || uuidv4(),
  deviceType: overrides.deviceType || DeviceType.SMARTWATCH,
  deviceModel: overrides.deviceModel || 'Health Watch Pro',
  deviceIdentifier: overrides.deviceIdentifier || `device-${Math.floor(Math.random() * 10000)}`,
  status: overrides.status || ConnectionStatus.CONNECTED,
  lastSyncDate: overrides.lastSyncDate || new Date(),
  connectionDate: overrides.connectionDate || new Date(),
  settings: overrides.settings || { syncFrequency: 'hourly', metrics: ['heart_rate', 'steps'] },
  createdAt: overrides.createdAt || new Date(),
  updatedAt: overrides.updatedAt || new Date(),
});

/**
 * Care Journey Mock Factories
 */

/**
 * Creates a mock provider with default values that can be overridden
 */
export const createMockProvider = (overrides: Partial<IProvider> = {}): IProvider => ({
  id: uuidv4(),
  name: overrides.name || 'Dr. Jane Smith',
  specialty: overrides.specialty || 'Cardiology',
  address: overrides.address || '123 Medical Center Blvd',
  city: overrides.city || 'Healthcare City',
  state: overrides.state || 'HC',
  zipCode: overrides.zipCode || '12345',
  phone: overrides.phone || '555-123-4567',
  email: overrides.email || 'dr.smith@healthcare.example',
  npi: overrides.npi || '1234567890',
  acceptingNewPatients: overrides.acceptingNewPatients !== undefined ? overrides.acceptingNewPatients : true,
  offersTelemedicine: overrides.offersTelemedicine !== undefined ? overrides.offersTelemedicine : true,
  languages: overrides.languages || ['English', 'Spanish'],
  education: overrides.education || 'University Medical School',
  affiliations: overrides.affiliations || ['Central Hospital'],
  rating: overrides.rating || 4.8,
  reviewCount: overrides.reviewCount || 120,
  availableDates: overrides.availableDates || [
    new Date(Date.now() + 86400000), // tomorrow
    new Date(Date.now() + 86400000 * 2), // day after tomorrow
    new Date(Date.now() + 86400000 * 3), // three days from now
  ],
  createdAt: overrides.createdAt || new Date(),
  updatedAt: overrides.updatedAt || new Date(),
});

/**
 * Creates a mock appointment with default values that can be overridden
 */
export const createMockAppointment = (overrides: Partial<IAppointment> = {}): IAppointment => {
  const provider = overrides.provider || createMockProvider();
  
  return {
    id: uuidv4(),
    userId: overrides.userId || uuidv4(),
    providerId: overrides.providerId || provider.id,
    provider: overrides.provider || provider,
    type: overrides.type || AppointmentType.IN_PERSON,
    status: overrides.status || AppointmentStatus.SCHEDULED,
    date: overrides.date || new Date(Date.now() + 86400000), // tomorrow
    time: overrides.time || '10:00 AM',
    duration: overrides.duration || 30, // minutes
    reason: overrides.reason || 'Annual check-up',
    notes: overrides.notes || 'Please bring your insurance card',
    location: overrides.location || provider.address,
    reminders: overrides.reminders || [{ type: 'SMS', time: 60 }], // 60 minutes before
    telemedicineSessionId: overrides.telemedicineSessionId,
    createdAt: overrides.createdAt || new Date(),
    updatedAt: overrides.updatedAt || new Date(),
  };
};

/**
 * Creates a mock medication with default values that can be overridden
 */
export const createMockMedication = (overrides: Partial<IMedication> = {}): IMedication => ({
  id: uuidv4(),
  userId: overrides.userId || uuidv4(),
  name: overrides.name || 'Lisinopril',
  dosage: overrides.dosage || '10mg',
  frequency: overrides.frequency || 'Once daily',
  startDate: overrides.startDate || new Date(),
  endDate: overrides.endDate,
  instructions: overrides.instructions || 'Take with food in the morning',
  prescribedBy: overrides.prescribedBy || 'Dr. Smith',
  pharmacy: overrides.pharmacy || 'Central Pharmacy',
  refillDate: overrides.refillDate,
  refillReminder: overrides.refillReminder !== undefined ? overrides.refillReminder : true,
  sideEffects: overrides.sideEffects || 'Dizziness, cough',
  active: overrides.active !== undefined ? overrides.active : true,
  createdAt: overrides.createdAt || new Date(),
  updatedAt: overrides.updatedAt || new Date(),
});

/**
 * Creates a mock telemedicine session with default values that can be overridden
 */
export const createMockTelemedicineSession = (overrides: Partial<ITelemedicineSession> = {}): ITelemedicineSession => {
  const appointment = overrides.appointment || createMockAppointment({
    type: AppointmentType.TELEMEDICINE,
    telemedicineSessionId: uuidv4()
  });
  
  return {
    id: appointment.telemedicineSessionId || uuidv4(),
    appointmentId: overrides.appointmentId || appointment.id,
    appointment: overrides.appointment || appointment,
    userId: overrides.userId || appointment.userId,
    providerId: overrides.providerId || appointment.providerId,
    sessionUrl: overrides.sessionUrl || `https://telemedicine.example.com/session/${uuidv4()}`,
    startTime: overrides.startTime || appointment.date,
    endTime: overrides.endTime,
    status: overrides.status || 'scheduled',
    notes: overrides.notes,
    recordingUrl: overrides.recordingUrl,
    createdAt: overrides.createdAt || new Date(),
    updatedAt: overrides.updatedAt || new Date(),
  };
};

/**
 * Creates a mock treatment plan with default values that can be overridden
 */
export const createMockTreatmentPlan = (overrides: Partial<ITreatmentPlan> = {}): ITreatmentPlan => ({
  id: uuidv4(),
  userId: overrides.userId || uuidv4(),
  title: overrides.title || 'Hypertension Management Plan',
  description: overrides.description || 'Comprehensive plan to manage high blood pressure',
  startDate: overrides.startDate || new Date(),
  endDate: overrides.endDate || new Date(Date.now() + 86400000 * 90), // 90 days from now
  providerId: overrides.providerId || uuidv4(),
  providerName: overrides.providerName || 'Dr. Smith',
  status: overrides.status || 'active',
  progress: overrides.progress || 0,
  activities: overrides.activities || [
    { type: 'medication', description: 'Take Lisinopril daily', frequency: 'daily', completed: false },
    { type: 'exercise', description: '30 minutes of walking', frequency: 'daily', completed: false },
    { type: 'diet', description: 'Reduce sodium intake', frequency: 'ongoing', completed: false },
  ],
  notes: overrides.notes || 'Patient showing good adherence to medication schedule',
  createdAt: overrides.createdAt || new Date(),
  updatedAt: overrides.updatedAt || new Date(),
});

/**
 * Plan Journey Mock Factories
 */

/**
 * Creates a mock insurance plan with default values that can be overridden
 */
export const createMockPlan = (overrides: Partial<IPlan> = {}): IPlan => ({
  id: uuidv4(),
  userId: overrides.userId || uuidv4(),
  name: overrides.name || 'Premium Health Plan',
  provider: overrides.provider || 'AUSTA Insurance',
  type: overrides.type || 'PPO',
  memberNumber: overrides.memberNumber || `MEM${Math.floor(Math.random() * 1000000)}`,
  groupNumber: overrides.groupNumber || `GRP${Math.floor(Math.random() * 10000)}`,
  effectiveDate: overrides.effectiveDate || new Date(),
  expirationDate: overrides.expirationDate || new Date(Date.now() + 31536000000), // 1 year from now
  status: overrides.status || 'active',
  premium: overrides.premium || 450.00,
  deductible: overrides.deductible || 1500.00,
  outOfPocketMax: overrides.outOfPocketMax || 5000.00,
  coverages: overrides.coverages || [],
  benefits: overrides.benefits || [],
  createdAt: overrides.createdAt || new Date(),
  updatedAt: overrides.updatedAt || new Date(),
});

/**
 * Creates a mock coverage with default values that can be overridden
 */
export const createMockCoverage = (overrides: Partial<ICoverage> = {}): ICoverage => {
  const plan = overrides.plan || createMockPlan();
  
  return {
    id: uuidv4(),
    planId: overrides.planId || plan.id,
    plan: overrides.plan || plan,
    type: overrides.type || 'Medical',
    description: overrides.description || 'Comprehensive medical coverage',
    coinsurance: overrides.coinsurance || 20, // percentage
    copay: overrides.copay || 25.00,
    limitations: overrides.limitations || 'Some exclusions may apply',
    networkRestrictions: overrides.networkRestrictions || 'In-network providers only',
    priorAuthorizationRequired: overrides.priorAuthorizationRequired !== undefined ? 
      overrides.priorAuthorizationRequired : true,
    createdAt: overrides.createdAt || new Date(),
    updatedAt: overrides.updatedAt || new Date(),
  };
};

/**
 * Creates a mock benefit with default values that can be overridden
 */
export const createMockBenefit = (overrides: Partial<IBenefit> = {}): IBenefit => {
  const plan = overrides.plan || createMockPlan();
  
  return {
    id: uuidv4(),
    planId: overrides.planId || plan.id,
    plan: overrides.plan || plan,
    name: overrides.name || 'Annual Wellness Visit',
    description: overrides.description || 'Yearly preventive care checkup',
    category: overrides.category || 'Preventive Care',
    coverage: overrides.coverage || '100%',
    limitations: overrides.limitations || 'One per year',
    requirements: overrides.requirements || 'Must use in-network provider',
    active: overrides.active !== undefined ? overrides.active : true,
    createdAt: overrides.createdAt || new Date(),
    updatedAt: overrides.updatedAt || new Date(),
  };
};

/**
 * Creates a mock claim with default values that can be overridden
 */
export const createMockClaim = (overrides: Partial<IClaim> = {}): IClaim => {
  const plan = overrides.plan || createMockPlan();
  
  return {
    id: uuidv4(),
    userId: overrides.userId || plan.userId,
    planId: overrides.planId || plan.id,
    plan: overrides.plan || plan,
    providerName: overrides.providerName || 'Dr. Smith Medical Group',
    serviceDate: overrides.serviceDate || new Date(Date.now() - 604800000), // 1 week ago
    submissionDate: overrides.submissionDate || new Date(),
    status: overrides.status || ClaimStatus.PENDING,
    type: overrides.type || 'Medical',
    description: overrides.description || 'Office visit for annual checkup',
    amount: overrides.amount || 150.00,
    approvedAmount: overrides.approvedAmount,
    paidAmount: overrides.paidAmount,
    denialReason: overrides.denialReason,
    documents: overrides.documents || [],
    claimNumber: overrides.claimNumber || `CLM${Math.floor(Math.random() * 1000000)}`,
    createdAt: overrides.createdAt || new Date(),
    updatedAt: overrides.updatedAt || new Date(),
  };
};

/**
 * Creates a mock document with default values that can be overridden
 */
export const createMockDocument = (overrides: Partial<IDocument> = {}): IDocument => {
  const claim = overrides.claim || createMockClaim();
  
  return {
    id: uuidv4(),
    claimId: overrides.claimId || claim.id,
    claim: overrides.claim || claim,
    userId: overrides.userId || claim.userId,
    name: overrides.name || 'Medical_Receipt.pdf',
    type: overrides.type || 'application/pdf',
    size: overrides.size || 1024 * 1024, // 1MB
    url: overrides.url || `https://storage.example.com/documents/${uuidv4()}`,
    uploadDate: overrides.uploadDate || new Date(),
    status: overrides.status || 'processed',
    metadata: overrides.metadata || { pages: 2, source: 'user_upload' },
    createdAt: overrides.createdAt || new Date(),
    updatedAt: overrides.updatedAt || new Date(),
  };
};

/**
 * Cross-Journey Mock Factories
 */

/**
 * Creates a complete user profile with data from all three journeys
 * This is useful for testing cross-journey functionality in the API Gateway
 */
export const createMockUserProfile = (userId?: string): {
  user: IUser;
  health: {
    metrics: IHealthMetric[];
    goals: IHealthGoal[];
    medicalEvents: IMedicalEvent[];
    deviceConnections: IDeviceConnection[];
  };
  care: {
    appointments: IAppointment[];
    medications: IMedication[];
    telemedicineSessions: ITelemedicineSession[];
    treatmentPlans: ITreatmentPlan[];
  };
  plan: {
    plans: IPlan[];
    coverages: ICoverage[];
    benefits: IBenefit[];
    claims: IClaim[];
    documents: IDocument[];
  };
} => {
  const user = createMockUser({ id: userId || uuidv4() });
  
  // Health Journey Data
  const deviceConnection = createMockDeviceConnection({ userId: user.id });
  const healthMetrics = [
    createMockHealthMetric({ 
      userId: user.id, 
      type: MetricType.HEART_RATE, 
      deviceId: deviceConnection.id 
    }),
    createMockHealthMetric({ 
      userId: user.id, 
      type: MetricType.BLOOD_PRESSURE, 
      value: 120, 
      unit: 'mmHg', 
      deviceId: deviceConnection.id 
    }),
    createMockHealthMetric({ 
      userId: user.id, 
      type: MetricType.STEPS, 
      value: 8500, 
      unit: 'steps' 
    }),
  ];
  
  const healthGoals = [
    createMockHealthGoal({ 
      userId: user.id, 
      type: GoalType.STEPS, 
      target: 10000, 
      progress: 8500 / 10000 * 100 
    }),
    createMockHealthGoal({ 
      userId: user.id, 
      type: GoalType.WEIGHT, 
      target: 70, 
      unit: 'kg', 
      progress: 90 
    }),
  ];
  
  const medicalEvents = [
    createMockMedicalEvent({ 
      userId: user.id, 
      type: 'Consultation', 
      date: new Date(Date.now() - 2592000000) // 30 days ago
    }),
    createMockMedicalEvent({ 
      userId: user.id, 
      type: 'Lab Test', 
      date: new Date(Date.now() - 1209600000) // 14 days ago
    }),
  ];
  
  // Care Journey Data
  const provider = createMockProvider();
  const appointment = createMockAppointment({ 
    userId: user.id, 
    providerId: provider.id, 
    provider: provider 
  });
  
  const telemedicineAppointment = createMockAppointment({
    userId: user.id,
    providerId: provider.id,
    provider: provider,
    type: AppointmentType.TELEMEDICINE,
    date: new Date(Date.now() + 172800000) // 2 days from now
  });
  
  const telemedicineSession = createMockTelemedicineSession({
    userId: user.id,
    providerId: provider.id,
    appointmentId: telemedicineAppointment.id,
    appointment: telemedicineAppointment
  });
  
  // Update the appointment with the session ID
  telemedicineAppointment.telemedicineSessionId = telemedicineSession.id;
  
  const medications = [
    createMockMedication({ userId: user.id }),
    createMockMedication({ 
      userId: user.id, 
      name: 'Metformin', 
      dosage: '500mg', 
      frequency: 'Twice daily' 
    }),
  ];
  
  const treatmentPlan = createMockTreatmentPlan({ 
    userId: user.id, 
    providerId: provider.id, 
    providerName: provider.name 
  });
  
  // Plan Journey Data
  const plan = createMockPlan({ userId: user.id });
  
  const coverages = [
    createMockCoverage({ planId: plan.id, plan: plan }),
    createMockCoverage({ 
      planId: plan.id, 
      plan: plan, 
      type: 'Pharmacy', 
      description: 'Prescription drug coverage' 
    }),
  ];
  
  const benefits = [
    createMockBenefit({ planId: plan.id, plan: plan }),
    createMockBenefit({ 
      planId: plan.id, 
      plan: plan, 
      name: 'Specialist Visit', 
      description: 'Visits to specialists', 
      coverage: '80% after deductible' 
    }),
  ];
  
  // Add coverages and benefits to the plan
  plan.coverages = coverages;
  plan.benefits = benefits;
  
  const claim = createMockClaim({ 
    userId: user.id, 
    planId: plan.id, 
    plan: plan 
  });
  
  const documents = [
    createMockDocument({ 
      userId: user.id, 
      claimId: claim.id, 
      claim: claim 
    }),
  ];
  
  // Add documents to the claim
  claim.documents = documents;
  
  return {
    user,
    health: {
      metrics: healthMetrics,
      goals: healthGoals,
      medicalEvents: medicalEvents,
      deviceConnections: [deviceConnection],
    },
    care: {
      appointments: [appointment, telemedicineAppointment],
      medications: medications,
      telemedicineSessions: [telemedicineSession],
      treatmentPlans: [treatmentPlan],
    },
    plan: {
      plans: [plan],
      coverages: coverages,
      benefits: benefits,
      claims: [claim],
      documents: documents,
    },
  };
};

/**
 * Creates a realistic test scenario with multiple users and cross-journey data
 * This is useful for testing complex API Gateway functionality
 */
export const createMockTestScenario = (userCount: number = 3): {
  users: IUser[];
  profiles: ReturnType<typeof createMockUserProfile>[];
} => {
  const users: IUser[] = [];
  const profiles: ReturnType<typeof createMockUserProfile>[] = [];
  
  for (let i = 0; i < userCount; i++) {
    const user = createMockUser();
    users.push(user);
    
    const profile = createMockUserProfile(user.id);
    profiles.push(profile);
  }
  
  return {
    users,
    profiles,
  };
};