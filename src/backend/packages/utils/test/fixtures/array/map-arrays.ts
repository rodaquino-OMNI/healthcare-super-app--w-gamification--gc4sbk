/**
 * Test fixtures for array mapping operations.
 * 
 * These fixtures provide arrays with elements that can be transformed in predictable ways,
 * along with expected transformation results. They support testing of mapping functions
 * that transform array elements from one form to another.
 */

// Basic primitive arrays with mapping results
export const numberArray = [1, 2, 3, 4, 5];
export const numberArrayDoubled = [2, 4, 6, 8, 10];
export const numberArraySquared = [1, 4, 9, 16, 25];
export const numberArrayToString = ['1', '2', '3', '4', '5'];

export const stringArray = ['a', 'b', 'c', 'd', 'e'];
export const stringArrayUppercase = ['A', 'B', 'C', 'D', 'E'];
export const stringArrayWithPrefix = ['prefix_a', 'prefix_b', 'prefix_c', 'prefix_d', 'prefix_e'];
export const stringArrayLengths = [1, 1, 1, 1, 1];

export const booleanArray = [true, false, true, false, true];
export const booleanArrayNegated = [false, true, false, true, false];
export const booleanArrayToString = ['true', 'false', 'true', 'false', 'true'];
export const booleanArrayToNumber = [1, 0, 1, 0, 1];

// Object arrays with property transformations
export interface Person {
  id: number;
  name: string;
  age: number;
  active: boolean;
}

export const personArray: Person[] = [
  { id: 1, name: 'Alice', age: 25, active: true },
  { id: 2, name: 'Bob', age: 30, active: false },
  { id: 3, name: 'Charlie', age: 35, active: true },
  { id: 4, name: 'David', age: 40, active: false },
  { id: 5, name: 'Eve', age: 45, active: true },
];

export const personArrayNames = ['Alice', 'Bob', 'Charlie', 'David', 'Eve'];
export const personArrayAges = [25, 30, 35, 40, 45];
export const personArrayActive = [true, false, true, false, true];

export const personArrayNameWithAge = [
  'Alice (25)',
  'Bob (30)',
  'Charlie (35)',
  'David (40)',
  'Eve (45)',
];

export const personArrayToSimpleObjects = [
  { name: 'Alice', isActive: true },
  { name: 'Bob', isActive: false },
  { name: 'Charlie', isActive: true },
  { name: 'David', isActive: false },
  { name: 'Eve', isActive: true },
];

// Nested arrays for flattening and deep mapping
export const nestedArray = [[1, 2], [3, 4], [5, 6]];
export const nestedArrayFlattened = [1, 2, 3, 4, 5, 6];
export const nestedArraySums = [3, 7, 11];
export const nestedArrayDoubled = [[2, 4], [6, 8], [10, 12]];

export const deeplyNestedArray = [[[1, 2], [3, 4]], [[5, 6], [7, 8]]];
export const deeplyNestedArrayFlattened = [1, 2, 3, 4, 5, 6, 7, 8];

// Arrays with nested objects
export interface Department {
  id: number;
  name: string;
  employees: Person[];
}

export const departmentArray: Department[] = [
  {
    id: 1,
    name: 'Engineering',
    employees: [
      { id: 1, name: 'Alice', age: 25, active: true },
      { id: 2, name: 'Bob', age: 30, active: false },
    ],
  },
  {
    id: 2,
    name: 'Marketing',
    employees: [
      { id: 3, name: 'Charlie', age: 35, active: true },
      { id: 4, name: 'David', age: 40, active: false },
    ],
  },
  {
    id: 3,
    name: 'HR',
    employees: [
      { id: 5, name: 'Eve', age: 45, active: true },
    ],
  },
];

export const departmentArrayNames = ['Engineering', 'Marketing', 'HR'];
export const departmentArrayEmployeeCounts = [2, 2, 1];
export const departmentArrayAllEmployees = [
  { id: 1, name: 'Alice', age: 25, active: true },
  { id: 2, name: 'Bob', age: 30, active: false },
  { id: 3, name: 'Charlie', age: 35, active: true },
  { id: 4, name: 'David', age: 40, active: false },
  { id: 5, name: 'Eve', age: 45, active: true },
];

export const departmentArraySummaries = [
  { name: 'Engineering', employeeCount: 2, averageAge: 27.5 },
  { name: 'Marketing', employeeCount: 2, averageAge: 37.5 },
  { name: 'HR', employeeCount: 1, averageAge: 45 },
];

// Edge cases
export const emptyArray: any[] = [];
export const emptyArrayMapped = [];

export const arrayWithNulls = [1, null, 3, null, 5];
export const arrayWithNullsFiltered = [1, 3, 5];
export const arrayWithNullsReplaced = [1, 0, 3, 0, 5];

export const arrayWithUndefined = [1, undefined, 3, undefined, 5];
export const arrayWithUndefinedFiltered = [1, 3, 5];
export const arrayWithUndefinedReplaced = [1, 0, 3, 0, 5];

export const mixedTypeArray = [1, 'two', true, { id: 4 }, null, undefined];
export const mixedTypeArrayToString = ['1', 'two', 'true', '[object Object]', 'null', 'undefined'];
export const mixedTypeArrayTypes = ['number', 'string', 'boolean', 'object', 'object', 'undefined'];

// Arrays for testing specific mapping scenarios
export interface ApiResponse {
  id: string;
  data: {
    attributes: {
      name: string;
      value: number;
    };
    relationships: {
      category: {
        id: string;
        type: string;
      };
    };
  };
}

export const apiResponseArray: ApiResponse[] = [
  {
    id: '1',
    data: {
      attributes: {
        name: 'Item 1',
        value: 100,
      },
      relationships: {
        category: {
          id: 'cat1',
          type: 'category',
        },
      },
    },
  },
  {
    id: '2',
    data: {
      attributes: {
        name: 'Item 2',
        value: 200,
      },
      relationships: {
        category: {
          id: 'cat2',
          type: 'category',
        },
      },
    },
  },
  {
    id: '3',
    data: {
      attributes: {
        name: 'Item 3',
        value: 300,
      },
      relationships: {
        category: {
          id: 'cat1',
          type: 'category',
        },
      },
    },
  },
];

export const apiResponseNormalized = [
  { id: '1', name: 'Item 1', value: 100, categoryId: 'cat1' },
  { id: '2', name: 'Item 2', value: 200, categoryId: 'cat2' },
  { id: '3', name: 'Item 3', value: 300, categoryId: 'cat1' },
];

// Journey-specific test fixtures

// Health journey metrics
export interface HealthMetric {
  id: string;
  userId: string;
  type: string;
  value: number;
  unit: string;
  timestamp: string;
  source: string;
}

export const healthMetricsArray: HealthMetric[] = [
  {
    id: 'hm1',
    userId: 'user1',
    type: 'steps',
    value: 8000,
    unit: 'count',
    timestamp: '2023-05-01T10:00:00Z',
    source: 'fitbit',
  },
  {
    id: 'hm2',
    userId: 'user1',
    type: 'heart_rate',
    value: 72,
    unit: 'bpm',
    timestamp: '2023-05-01T10:05:00Z',
    source: 'apple_health',
  },
  {
    id: 'hm3',
    userId: 'user1',
    type: 'weight',
    value: 70.5,
    unit: 'kg',
    timestamp: '2023-05-01T08:00:00Z',
    source: 'manual',
  },
];

export const healthMetricsMapped = [
  { type: 'steps', value: 8000, unit: 'count', formattedValue: '8,000 steps' },
  { type: 'heart_rate', value: 72, unit: 'bpm', formattedValue: '72 bpm' },
  { type: 'weight', value: 70.5, unit: 'kg', formattedValue: '70.5 kg' },
];

// Care journey appointments
export interface Appointment {
  id: string;
  patientId: string;
  providerId: string;
  specialtyId: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
}

export const appointmentsArray: Appointment[] = [
  {
    id: 'apt1',
    patientId: 'patient1',
    providerId: 'provider1',
    specialtyId: 'cardiology',
    startTime: '2023-05-15T09:00:00Z',
    endTime: '2023-05-15T09:30:00Z',
    status: 'scheduled',
  },
  {
    id: 'apt2',
    patientId: 'patient1',
    providerId: 'provider2',
    specialtyId: 'dermatology',
    startTime: '2023-05-20T14:00:00Z',
    endTime: '2023-05-20T14:45:00Z',
    status: 'scheduled',
    notes: 'Follow-up appointment',
  },
  {
    id: 'apt3',
    patientId: 'patient1',
    providerId: 'provider3',
    specialtyId: 'general',
    startTime: '2023-05-10T11:00:00Z',
    endTime: '2023-05-10T11:30:00Z',
    status: 'completed',
  },
];

export const appointmentsMapped = [
  {
    id: 'apt1',
    date: '2023-05-15',
    time: '09:00 - 09:30',
    status: 'scheduled',
    specialty: 'cardiology',
  },
  {
    id: 'apt2',
    date: '2023-05-20',
    time: '14:00 - 14:45',
    status: 'scheduled',
    specialty: 'dermatology',
    notes: 'Follow-up appointment',
  },
  {
    id: 'apt3',
    date: '2023-05-10',
    time: '11:00 - 11:30',
    status: 'completed',
    specialty: 'general',
  },
];

// Plan journey benefits
export interface Benefit {
  id: string;
  planId: string;
  name: string;
  description: string;
  coveragePercentage: number;
  annualLimit?: number;
  requiresPreApproval: boolean;
  category: string;
}

export const benefitsArray: Benefit[] = [
  {
    id: 'ben1',
    planId: 'plan1',
    name: 'Primary Care Visits',
    description: 'Visits to your primary care physician',
    coveragePercentage: 100,
    requiresPreApproval: false,
    category: 'medical',
  },
  {
    id: 'ben2',
    planId: 'plan1',
    name: 'Specialist Visits',
    description: 'Visits to specialists',
    coveragePercentage: 80,
    requiresPreApproval: true,
    category: 'medical',
  },
  {
    id: 'ben3',
    planId: 'plan1',
    name: 'Dental Cleaning',
    description: 'Routine dental cleaning',
    coveragePercentage: 90,
    annualLimit: 2,
    requiresPreApproval: false,
    category: 'dental',
  },
];

export const benefitsMapped = [
  {
    name: 'Primary Care Visits',
    coverage: '100%',
    preApproval: 'Not Required',
    category: 'medical',
    limit: 'No Limit',
  },
  {
    name: 'Specialist Visits',
    coverage: '80%',
    preApproval: 'Required',
    category: 'medical',
    limit: 'No Limit',
  },
  {
    name: 'Dental Cleaning',
    coverage: '90%',
    preApproval: 'Not Required',
    category: 'dental',
    limit: '2 per year',
  },
];

// Gamification achievements
export interface Achievement {
  id: string;
  userId: string;
  name: string;
  description: string;
  points: number;
  earnedAt: string;
  category: string;
  journeyType: 'health' | 'care' | 'plan';
  iconUrl: string;
}

export const achievementsArray: Achievement[] = [
  {
    id: 'ach1',
    userId: 'user1',
    name: 'Step Master',
    description: 'Walk 10,000 steps in a day',
    points: 50,
    earnedAt: '2023-05-02T18:30:00Z',
    category: 'fitness',
    journeyType: 'health',
    iconUrl: '/icons/step-master.png',
  },
  {
    id: 'ach2',
    userId: 'user1',
    name: 'Appointment Keeper',
    description: 'Attend 5 appointments without cancellation',
    points: 30,
    earnedAt: '2023-05-10T12:00:00Z',
    category: 'reliability',
    journeyType: 'care',
    iconUrl: '/icons/appointment-keeper.png',
  },
  {
    id: 'ach3',
    userId: 'user1',
    name: 'Plan Explorer',
    description: 'Review all benefits in your plan',
    points: 20,
    earnedAt: '2023-05-15T09:45:00Z',
    category: 'engagement',
    journeyType: 'plan',
    iconUrl: '/icons/plan-explorer.png',
  },
];

export const achievementsMapped = [
  {
    name: 'Step Master',
    points: 50,
    journey: 'health',
    earnedOn: '2023-05-02',
    icon: '/icons/step-master.png',
  },
  {
    name: 'Appointment Keeper',
    points: 30,
    journey: 'care',
    earnedOn: '2023-05-10',
    icon: '/icons/appointment-keeper.png',
  },
  {
    name: 'Plan Explorer',
    points: 20,
    journey: 'plan',
    earnedOn: '2023-05-15',
    icon: '/icons/plan-explorer.png',
  },
];