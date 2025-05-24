/**
 * Test fixtures for array sorting operations.
 * 
 * This file provides specialized test fixtures for testing array sorting operations,
 * including pre-sorted arrays, reverse-sorted arrays, arrays with duplicates, and
 * arrays with custom sort orders. These fixtures enable comprehensive testing of
 * custom sorting utilities with different data types and conditions.
 */

// ===== Numeric Arrays =====

/**
 * Array of numbers already sorted in ascending order
 */
export const ascendingNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/**
 * Array of numbers already sorted in descending order
 */
export const descendingNumbers = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

/**
 * Array of numbers in random order for sorting tests
 */
export const unsortedNumbers = [5, 3, 8, 1, 9, 4, 7, 2, 10, 6];

/**
 * Array of numbers with duplicates for testing stable sort behavior
 */
export const numbersWithDuplicates = [5, 2, 8, 2, 1, 5, 3, 8, 1, 4];

/**
 * Array of numbers with negative values for comprehensive sorting tests
 */
export const mixedSignNumbers = [5, -3, 8, -1, 0, 4, -7, 2, -10, 6];

/**
 * Array of floating point numbers for precision sorting tests
 */
export const floatingPointNumbers = [5.2, 3.1, 8.7, 1.0, 9.9, 4.5, 7.3, 2.8, 10.0, 6.6];

/**
 * Array of very large numbers for testing sort performance and precision
 */
export const largeNumbers = [5000000, 3000000, 8000000, 1000000, 9000000, 4000000, 7000000, 2000000, 10000000, 6000000];

/**
 * Array of very small decimal numbers for testing sort precision
 */
export const smallDecimals = [0.0052, 0.0031, 0.0087, 0.0010, 0.0099, 0.0045, 0.0073, 0.0028, 0.0100, 0.0066];

// ===== String Arrays =====

/**
 * Array of strings already sorted alphabetically
 */
export const alphabeticalStrings = ['apple', 'banana', 'cherry', 'date', 'elderberry', 'fig', 'grape', 'honeydew', 'kiwi', 'lemon'];

/**
 * Array of strings in reverse alphabetical order
 */
export const reverseAlphabeticalStrings = ['lemon', 'kiwi', 'honeydew', 'grape', 'fig', 'elderberry', 'date', 'cherry', 'banana', 'apple'];

/**
 * Array of strings in random order for sorting tests
 */
export const unsortedStrings = ['grape', 'apple', 'kiwi', 'banana', 'lemon', 'cherry', 'honeydew', 'fig', 'date', 'elderberry'];

/**
 * Array of strings with mixed case for case-insensitive sorting tests
 */
export const mixedCaseStrings = ['Apple', 'banana', 'Cherry', 'date', 'Elderberry', 'fig', 'Grape', 'honeydew', 'Kiwi', 'lemon'];

/**
 * Array of strings with duplicates for testing stable sort behavior
 */
export const stringsWithDuplicates = ['apple', 'banana', 'apple', 'cherry', 'banana', 'date', 'cherry', 'fig', 'apple', 'date'];

/**
 * Array of strings with special characters for testing locale-aware sorting
 */
export const specialCharStrings = ['café', 'apple', 'résumé', 'banana', 'naïve', 'cherry', 'über', 'date', 'piñata', 'fig'];

/**
 * Array of strings with varying lengths for testing length-based sorting
 */
export const varyingLengthStrings = ['a', 'bb', 'ccc', 'dddd', 'eeeee', 'ffffff', 'ggggggg', 'hhhhhhhh', 'iiiiiiiii', 'jjjjjjjjjj'];

// ===== Object Arrays =====

/**
 * Interface for person objects used in sorting tests
 */
export interface Person {
  id: number;
  name: string;
  age: number;
  active: boolean;
  joinDate: Date;
  score?: number;
}

/**
 * Array of person objects for testing object sorting by various properties
 */
export const people: Person[] = [
  { id: 1, name: 'Alice', age: 28, active: true, joinDate: new Date('2020-01-15'), score: 85 },
  { id: 2, name: 'Bob', age: 35, active: false, joinDate: new Date('2019-03-21'), score: 92 },
  { id: 3, name: 'Charlie', age: 42, active: true, joinDate: new Date('2021-05-07'), score: 78 },
  { id: 4, name: 'Diana', age: 31, active: true, joinDate: new Date('2018-11-30'), score: 88 },
  { id: 5, name: 'Evan', age: 24, active: false, joinDate: new Date('2022-02-14'), score: 95 },
  { id: 6, name: 'Fiona', age: 39, active: true, joinDate: new Date('2017-08-22'), score: 91 },
  { id: 7, name: 'George', age: 45, active: false, joinDate: new Date('2020-07-19'), score: 76 },
  { id: 8, name: 'Hannah', age: 29, active: true, joinDate: new Date('2021-12-03'), score: 89 },
  { id: 9, name: 'Ian', age: 33, active: true, joinDate: new Date('2019-09-11'), score: 84 },
  { id: 10, name: 'Julia', age: 27, active: false, joinDate: new Date('2022-04-25'), score: 93 }
];

/**
 * Array of people sorted by age (ascending)
 */
export const peopleSortedByAge: Person[] = [...people].sort((a, b) => a.age - b.age);

/**
 * Array of people sorted by name (alphabetically)
 */
export const peopleSortedByName: Person[] = [...people].sort((a, b) => a.name.localeCompare(b.name));

/**
 * Array of people sorted by join date (oldest first)
 */
export const peopleSortedByJoinDate: Person[] = [...people].sort((a, b) => a.joinDate.getTime() - b.joinDate.getTime());

/**
 * Array of people sorted by active status (active first) then by name
 */
export const peopleSortedByActiveAndName: Person[] = [...people].sort((a, b) => {
  if (a.active === b.active) {
    return a.name.localeCompare(b.name);
  }
  return a.active ? -1 : 1;
});

/**
 * Array of people sorted by score (descending) with null handling
 */
export const peopleSortedByScore: Person[] = [...people].sort((a, b) => {
  if (a.score === undefined && b.score === undefined) return 0;
  if (a.score === undefined) return 1;
  if (b.score === undefined) return -1;
  return b.score - a.score;
});

/**
 * Interface for product objects used in sorting tests
 */
export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  inStock: boolean;
  rating: number;
  createdAt: Date;
}

/**
 * Array of product objects for testing object sorting by various properties
 */
export const products: Product[] = [
  { id: 'p001', name: 'Laptop', price: 1200, category: 'Electronics', inStock: true, rating: 4.5, createdAt: new Date('2021-03-15') },
  { id: 'p002', name: 'Smartphone', price: 800, category: 'Electronics', inStock: true, rating: 4.2, createdAt: new Date('2021-05-22') },
  { id: 'p003', name: 'Headphones', price: 150, category: 'Electronics', inStock: false, rating: 4.8, createdAt: new Date('2020-11-30') },
  { id: 'p004', name: 'T-shirt', price: 25, category: 'Clothing', inStock: true, rating: 3.9, createdAt: new Date('2022-01-10') },
  { id: 'p005', name: 'Jeans', price: 60, category: 'Clothing', inStock: true, rating: 4.1, createdAt: new Date('2021-09-05') },
  { id: 'p006', name: 'Sneakers', price: 90, category: 'Footwear', inStock: false, rating: 4.7, createdAt: new Date('2020-07-18') },
  { id: 'p007', name: 'Watch', price: 250, category: 'Accessories', inStock: true, rating: 4.4, createdAt: new Date('2022-02-28') },
  { id: 'p008', name: 'Backpack', price: 45, category: 'Accessories', inStock: true, rating: 4.0, createdAt: new Date('2021-11-15') },
  { id: 'p009', name: 'Water Bottle', price: 15, category: 'Accessories', inStock: false, rating: 3.8, createdAt: new Date('2022-04-03') },
  { id: 'p010', name: 'Desk Chair', price: 180, category: 'Furniture', inStock: true, rating: 4.6, createdAt: new Date('2020-10-12') }
];

/**
 * Array of products sorted by price (ascending)
 */
export const productsSortedByPrice: Product[] = [...products].sort((a, b) => a.price - b.price);

/**
 * Array of products sorted by rating (descending)
 */
export const productsSortedByRating: Product[] = [...products].sort((a, b) => b.rating - a.rating);

/**
 * Array of products sorted by category then by name
 */
export const productsSortedByCategoryAndName: Product[] = [...products].sort((a, b) => {
  if (a.category === b.category) {
    return a.name.localeCompare(b.name);
  }
  return a.category.localeCompare(b.category);
});

/**
 * Array of products sorted by availability (in stock first) then by price
 */
export const productsSortedByAvailabilityAndPrice: Product[] = [...products].sort((a, b) => {
  if (a.inStock === b.inStock) {
    return a.price - b.price;
  }
  return a.inStock ? -1 : 1;
});

// ===== Mixed Type Arrays =====

/**
 * Array with mixed types for testing type-aware sorting
 */
export const mixedTypeArray = [5, 'apple', true, null, 10, 'banana', false, undefined, 3, 'cherry'];

/**
 * Expected result of sorting mixed type array with a specific type-aware comparator
 * (null/undefined, then booleans, then numbers, then strings)
 */
export const sortedMixedTypeArray = [null, undefined, false, true, 3, 5, 10, 'apple', 'banana', 'cherry'];

// ===== Special Case Arrays =====

/**
 * Empty array for edge case testing
 */
export const emptyArray: any[] = [];

/**
 * Single element array for edge case testing
 */
export const singleElementArray = [42];

/**
 * Array with all identical elements for testing stable sort behavior
 */
export const identicalElementsArray = [5, 5, 5, 5, 5, 5, 5, 5, 5, 5];

/**
 * Array with elements that would sort differently with numerical vs lexicographical comparison
 */
export const numericVsLexicographicalArray = ['1', '2', '10', '20', '3', '30', '4', '40', '5', '50'];

/**
 * Expected result of sorting numericVsLexicographicalArray lexicographically
 */
export const lexicographicallySortedArray = ['1', '10', '2', '20', '3', '30', '4', '40', '5', '50'];

/**
 * Expected result of sorting numericVsLexicographicalArray numerically
 */
export const numericallySortedArray = ['1', '2', '3', '4', '5', '10', '20', '30', '40', '50'];

// ===== Journey-Specific Test Arrays =====

/**
 * Interface for health metrics used in sorting tests
 */
export interface HealthMetric {
  userId: string;
  metricType: string;
  value: number;
  unit: string;
  timestamp: Date;
  source: string;
}

/**
 * Array of health metrics for testing health journey-specific sorting
 */
export const healthMetrics: HealthMetric[] = [
  { userId: 'user1', metricType: 'heartRate', value: 72, unit: 'bpm', timestamp: new Date('2023-05-15T08:30:00Z'), source: 'smartwatch' },
  { userId: 'user1', metricType: 'bloodPressure', value: 120, unit: 'mmHg', timestamp: new Date('2023-05-15T08:35:00Z'), source: 'manual' },
  { userId: 'user2', metricType: 'heartRate', value: 68, unit: 'bpm', timestamp: new Date('2023-05-15T09:15:00Z'), source: 'smartwatch' },
  { userId: 'user1', metricType: 'steps', value: 8500, unit: 'steps', timestamp: new Date('2023-05-15T18:00:00Z'), source: 'smartphone' },
  { userId: 'user2', metricType: 'bloodPressure', value: 118, unit: 'mmHg', timestamp: new Date('2023-05-15T09:20:00Z'), source: 'manual' },
  { userId: 'user3', metricType: 'heartRate', value: 75, unit: 'bpm', timestamp: new Date('2023-05-15T10:45:00Z'), source: 'smartwatch' },
  { userId: 'user1', metricType: 'weight', value: 70.5, unit: 'kg', timestamp: new Date('2023-05-15T07:00:00Z'), source: 'smartscale' },
  { userId: 'user3', metricType: 'steps', value: 12000, unit: 'steps', timestamp: new Date('2023-05-15T19:30:00Z'), source: 'smartphone' },
  { userId: 'user2', metricType: 'weight', value: 82.3, unit: 'kg', timestamp: new Date('2023-05-15T07:30:00Z'), source: 'smartscale' },
  { userId: 'user3', metricType: 'bloodPressure', value: 125, unit: 'mmHg', timestamp: new Date('2023-05-15T10:50:00Z'), source: 'manual' }
];

/**
 * Health metrics sorted by timestamp (newest first)
 */
export const healthMetricsSortedByTimestampDesc: HealthMetric[] = [...healthMetrics].sort((a, b) => 
  b.timestamp.getTime() - a.timestamp.getTime()
);

/**
 * Health metrics sorted by user then by metric type
 */
export const healthMetricsSortedByUserAndType: HealthMetric[] = [...healthMetrics].sort((a, b) => {
  if (a.userId === b.userId) {
    return a.metricType.localeCompare(b.metricType);
  }
  return a.userId.localeCompare(b.userId);
});

/**
 * Interface for care appointments used in sorting tests
 */
export interface CareAppointment {
  id: string;
  patientId: string;
  providerId: string;
  specialtyType: string;
  appointmentDate: Date;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  priority: number;
}

/**
 * Array of care appointments for testing care journey-specific sorting
 */
export const careAppointments: CareAppointment[] = [
  { id: 'apt001', patientId: 'pat1', providerId: 'prov3', specialtyType: 'cardiology', appointmentDate: new Date('2023-06-15T10:00:00Z'), status: 'scheduled', priority: 2 },
  { id: 'apt002', patientId: 'pat2', providerId: 'prov1', specialtyType: 'dermatology', appointmentDate: new Date('2023-06-10T14:30:00Z'), status: 'completed', priority: 3 },
  { id: 'apt003', patientId: 'pat1', providerId: 'prov2', specialtyType: 'neurology', appointmentDate: new Date('2023-06-20T09:15:00Z'), status: 'scheduled', priority: 1 },
  { id: 'apt004', patientId: 'pat3', providerId: 'prov1', specialtyType: 'cardiology', appointmentDate: new Date('2023-06-12T11:45:00Z'), status: 'cancelled', priority: 2 },
  { id: 'apt005', patientId: 'pat2', providerId: 'prov3', specialtyType: 'orthopedics', appointmentDate: new Date('2023-06-18T16:00:00Z'), status: 'scheduled', priority: 2 },
  { id: 'apt006', patientId: 'pat3', providerId: 'prov2', specialtyType: 'dermatology', appointmentDate: new Date('2023-06-08T13:30:00Z'), status: 'no-show', priority: 3 },
  { id: 'apt007', patientId: 'pat1', providerId: 'prov1', specialtyType: 'orthopedics', appointmentDate: new Date('2023-06-25T15:45:00Z'), status: 'scheduled', priority: 2 },
  { id: 'apt008', patientId: 'pat2', providerId: 'prov2', specialtyType: 'cardiology', appointmentDate: new Date('2023-06-05T10:30:00Z'), status: 'completed', priority: 1 },
  { id: 'apt009', patientId: 'pat3', providerId: 'prov3', specialtyType: 'neurology', appointmentDate: new Date('2023-06-22T09:00:00Z'), status: 'scheduled', priority: 1 },
  { id: 'apt010', patientId: 'pat1', providerId: 'prov2', specialtyType: 'dermatology', appointmentDate: new Date('2023-06-14T14:15:00Z'), status: 'completed', priority: 3 }
];

/**
 * Care appointments sorted by date (ascending)
 */
export const careAppointmentsSortedByDate: CareAppointment[] = [...careAppointments].sort((a, b) => 
  a.appointmentDate.getTime() - b.appointmentDate.getTime()
);

/**
 * Care appointments sorted by priority (highest first) then by date
 */
export const careAppointmentsSortedByPriorityAndDate: CareAppointment[] = [...careAppointments].sort((a, b) => {
  if (a.priority === b.priority) {
    return a.appointmentDate.getTime() - b.appointmentDate.getTime();
  }
  return a.priority - b.priority;
});

/**
 * Care appointments sorted by status in specific order: scheduled, completed, cancelled, no-show
 */
export const careAppointmentsSortedByStatus: CareAppointment[] = [...careAppointments].sort((a, b) => {
  const statusOrder: Record<string, number> = {
    'scheduled': 1,
    'completed': 2,
    'cancelled': 3,
    'no-show': 4
  };
  return statusOrder[a.status] - statusOrder[b.status];
});

/**
 * Interface for insurance plans used in sorting tests
 */
export interface InsurancePlan {
  id: string;
  name: string;
  type: 'basic' | 'standard' | 'premium';
  monthlyCost: number;
  coveragePercentage: number;
  networkSize: number;
  startDate: Date;
  popularityRank: number;
}

/**
 * Array of insurance plans for testing plan journey-specific sorting
 */
export const insurancePlans: InsurancePlan[] = [
  { id: 'plan001', name: 'Basic Health', type: 'basic', monthlyCost: 150, coveragePercentage: 60, networkSize: 500, startDate: new Date('2023-01-01'), popularityRank: 5 },
  { id: 'plan002', name: 'Standard Care', type: 'standard', monthlyCost: 250, coveragePercentage: 75, networkSize: 1200, startDate: new Date('2023-02-15'), popularityRank: 2 },
  { id: 'plan003', name: 'Premium Health Plus', type: 'premium', monthlyCost: 400, coveragePercentage: 90, networkSize: 2500, startDate: new Date('2023-03-10'), popularityRank: 3 },
  { id: 'plan004', name: 'Basic Family', type: 'basic', monthlyCost: 200, coveragePercentage: 65, networkSize: 600, startDate: new Date('2023-01-15'), popularityRank: 6 },
  { id: 'plan005', name: 'Standard Family', type: 'standard', monthlyCost: 320, coveragePercentage: 80, networkSize: 1500, startDate: new Date('2023-02-20'), popularityRank: 1 },
  { id: 'plan006', name: 'Premium Total', type: 'premium', monthlyCost: 500, coveragePercentage: 95, networkSize: 3000, startDate: new Date('2023-03-25'), popularityRank: 4 },
  { id: 'plan007', name: 'Basic Senior', type: 'basic', monthlyCost: 180, coveragePercentage: 70, networkSize: 550, startDate: new Date('2023-01-05'), popularityRank: 9 },
  { id: 'plan008', name: 'Standard Senior', type: 'standard', monthlyCost: 280, coveragePercentage: 85, networkSize: 1300, startDate: new Date('2023-02-10'), popularityRank: 7 },
  { id: 'plan009', name: 'Premium Senior Plus', type: 'premium', monthlyCost: 450, coveragePercentage: 98, networkSize: 2800, startDate: new Date('2023-03-15'), popularityRank: 8 },
  { id: 'plan010', name: 'Basic Individual', type: 'basic', monthlyCost: 120, coveragePercentage: 55, networkSize: 450, startDate: new Date('2023-01-20'), popularityRank: 10 }
];

/**
 * Insurance plans sorted by monthly cost (lowest first)
 */
export const insurancePlansSortedByCost: InsurancePlan[] = [...insurancePlans].sort((a, b) => 
  a.monthlyCost - b.monthlyCost
);

/**
 * Insurance plans sorted by coverage percentage (highest first)
 */
export const insurancePlansSortedByCoverage: InsurancePlan[] = [...insurancePlans].sort((a, b) => 
  b.coveragePercentage - a.coveragePercentage
);

/**
 * Insurance plans sorted by type in specific order: premium, standard, basic
 */
export const insurancePlansSortedByType: InsurancePlan[] = [...insurancePlans].sort((a, b) => {
  const typeOrder: Record<string, number> = {
    'premium': 1,
    'standard': 2,
    'basic': 3
  };
  return typeOrder[a.type] - typeOrder[b.type];
});

/**
 * Insurance plans sorted by popularity rank (lowest number = most popular)
 */
export const insurancePlansSortedByPopularity: InsurancePlan[] = [...insurancePlans].sort((a, b) => 
  a.popularityRank - b.popularityRank
);