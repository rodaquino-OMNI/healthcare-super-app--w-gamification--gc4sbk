import { groupBy, partitionBy, keyBy, indexBy, countBy } from '../../../src/array/group.util';

describe('Array Grouping Utilities', () => {
  // Test data
  const users = [
    { id: 1, name: 'Alice', role: 'admin', active: true },
    { id: 2, name: 'Bob', role: 'user', active: true },
    { id: 3, name: 'Charlie', role: 'user', active: false },
    { id: 4, name: 'Diana', role: 'admin', active: true },
    { id: 5, name: 'Eve', role: 'manager', active: true },
  ];

  const healthMetrics = [
    { id: 1, type: 'bloodPressure', value: 120, date: '2023-01-01', journeyId: 'health' },
    { id: 2, type: 'bloodPressure', value: 118, date: '2023-01-02', journeyId: 'health' },
    { id: 3, type: 'heartRate', value: 72, date: '2023-01-01', journeyId: 'health' },
    { id: 4, type: 'heartRate', value: 75, date: '2023-01-02', journeyId: 'health' },
    { id: 5, type: 'weight', value: 70, date: '2023-01-01', journeyId: 'health' },
  ];

  const appointments = [
    { id: 1, provider: 'Dr. Smith', status: 'completed', date: '2023-01-01', journeyId: 'care' },
    { id: 2, provider: 'Dr. Jones', status: 'scheduled', date: '2023-02-15', journeyId: 'care' },
    { id: 3, provider: 'Dr. Smith', status: 'scheduled', date: '2023-02-20', journeyId: 'care' },
    { id: 4, provider: 'Dr. Brown', status: 'cancelled', date: '2023-01-10', journeyId: 'care' },
  ];

  describe('groupBy', () => {
    it('should group array elements by a string key', () => {
      // Group users by role
      const result = groupBy(users, 'role');

      // Verify the structure of the result
      expect(Object.keys(result)).toHaveLength(3); // admin, user, manager
      expect(result.admin).toHaveLength(2);
      expect(result.user).toHaveLength(2);
      expect(result.manager).toHaveLength(1);

      // Verify the content of each group
      expect(result.admin).toEqual([
        { id: 1, name: 'Alice', role: 'admin', active: true },
        { id: 4, name: 'Diana', role: 'admin', active: true },
      ]);
      expect(result.user).toEqual([
        { id: 2, name: 'Bob', role: 'user', active: true },
        { id: 3, name: 'Charlie', role: 'user', active: false },
      ]);
      expect(result.manager).toEqual([
        { id: 5, name: 'Eve', role: 'manager', active: true },
      ]);
    });

    it('should group array elements using a selector function', () => {
      // Group health metrics by date
      const result = groupBy(healthMetrics, (metric) => metric.date);

      // Verify the structure of the result
      expect(Object.keys(result)).toHaveLength(2); // 2023-01-01, 2023-01-02
      expect(result['2023-01-01']).toHaveLength(3);
      expect(result['2023-01-02']).toHaveLength(2);

      // Verify the content of each group
      expect(result['2023-01-01']).toEqual([
        { id: 1, type: 'bloodPressure', value: 120, date: '2023-01-01', journeyId: 'health' },
        { id: 3, type: 'heartRate', value: 72, date: '2023-01-01', journeyId: 'health' },
        { id: 5, type: 'weight', value: 70, date: '2023-01-01', journeyId: 'health' },
      ]);
      expect(result['2023-01-02']).toEqual([
        { id: 2, type: 'bloodPressure', value: 118, date: '2023-01-02', journeyId: 'health' },
        { id: 4, type: 'heartRate', value: 75, date: '2023-01-02', journeyId: 'health' },
      ]);
    });

    it('should handle complex selector functions that combine multiple properties', () => {
      // Group health metrics by type and date
      const result = groupBy(healthMetrics, (metric) => `${metric.type}_${metric.date}`);

      // Verify the structure of the result
      expect(Object.keys(result)).toHaveLength(5); // Each metric has a unique type+date combination
      
      // Verify specific groups
      expect(result['bloodPressure_2023-01-01']).toHaveLength(1);
      expect(result['bloodPressure_2023-01-01'][0].id).toBe(1);
      
      expect(result['heartRate_2023-01-02']).toHaveLength(1);
      expect(result['heartRate_2023-01-02'][0].id).toBe(4);
    });

    it('should handle numeric keys by converting them to strings', () => {
      // Group users by ID
      const result = groupBy(users, 'id');

      // Verify the structure of the result
      expect(Object.keys(result)).toHaveLength(5); // 5 unique IDs
      
      // Verify that numeric keys are converted to strings
      expect(result['1']).toBeDefined();
      expect(result['1']).toHaveLength(1);
      expect(result['1'][0].name).toBe('Alice');
    });

    it('should handle boolean keys by converting them to strings', () => {
      // Group users by active status
      const result = groupBy(users, 'active');

      // Verify the structure of the result
      expect(Object.keys(result)).toHaveLength(2); // true, false
      
      // Verify that boolean keys are converted to strings
      expect(result['true']).toBeDefined();
      expect(result['true']).toHaveLength(4);
      expect(result['false']).toHaveLength(1);
      expect(result['false'][0].name).toBe('Charlie');
    });

    it('should return an empty object for an empty array', () => {
      const result = groupBy([], 'id');
      expect(result).toEqual({});
    });

    it('should throw an error for undefined or null arrays', () => {
      expect(() => groupBy(undefined as any, 'id')).toThrow('Cannot group undefined or null array');
      expect(() => groupBy(null as any, 'id')).toThrow('Cannot group undefined or null array');
    });

    it('should handle arrays with undefined or null values for the grouping key', () => {
      const dataWithNulls = [
        { id: 1, category: 'A' },
        { id: 2, category: null },
        { id: 3, category: undefined },
        { id: 4, category: 'B' },
      ];

      const result = groupBy(dataWithNulls, 'category');

      // Verify the structure of the result
      expect(Object.keys(result)).toHaveLength(3); // 'A', 'B', 'null' (undefined is converted to 'undefined')
      expect(result['A']).toHaveLength(1);
      expect(result['B']).toHaveLength(1);
      expect(result['null']).toHaveLength(1);
      expect(result['undefined']).toHaveLength(1);
    });
  });

  describe('partitionBy', () => {
    it('should partition array elements based on a predicate', () => {
      // Partition users by active status
      const [activeUsers, inactiveUsers] = partitionBy(users, (user) => user.active);

      // Verify the structure of the result
      expect(activeUsers).toHaveLength(4);
      expect(inactiveUsers).toHaveLength(1);

      // Verify the content of each partition
      expect(activeUsers).toEqual([
        { id: 1, name: 'Alice', role: 'admin', active: true },
        { id: 2, name: 'Bob', role: 'user', active: true },
        { id: 4, name: 'Diana', role: 'admin', active: true },
        { id: 5, name: 'Eve', role: 'manager', active: true },
      ]);
      expect(inactiveUsers).toEqual([
        { id: 3, name: 'Charlie', role: 'user', active: false },
      ]);
    });

    it('should partition array elements based on a complex predicate', () => {
      // Partition appointments by date (past vs. future)
      const currentDate = new Date('2023-02-01');
      const [pastAppointments, futureAppointments] = partitionBy(
        appointments,
        (appointment) => new Date(appointment.date) < currentDate
      );

      // Verify the structure of the result
      expect(pastAppointments).toHaveLength(2); // 2023-01-01, 2023-01-10
      expect(futureAppointments).toHaveLength(2); // 2023-02-15, 2023-02-20

      // Verify the content of each partition
      expect(pastAppointments.map(a => a.id)).toEqual([1, 4]);
      expect(futureAppointments.map(a => a.id)).toEqual([2, 3]);
    });

    it('should handle predicates that check multiple conditions', () => {
      // Partition users by role and active status
      const [adminAndActive, others] = partitionBy(
        users,
        (user) => user.role === 'admin' && user.active
      );

      // Verify the structure of the result
      expect(adminAndActive).toHaveLength(2);
      expect(others).toHaveLength(3);

      // Verify the content of each partition
      expect(adminAndActive.map(u => u.id)).toEqual([1, 4]);
      expect(others.map(u => u.id)).toEqual([2, 3, 5]);
    });

    it('should return empty arrays for both partitions when given an empty array', () => {
      const [passing, failing] = partitionBy([], () => true);
      expect(passing).toEqual([]);
      expect(failing).toEqual([]);
    });

    it('should throw an error for undefined or null arrays', () => {
      expect(() => partitionBy(undefined as any, () => true)).toThrow('Cannot partition undefined or null array');
      expect(() => partitionBy(null as any, () => true)).toThrow('Cannot partition undefined or null array');
    });

    it('should handle predicates that return undefined or null', () => {
      // A predicate that sometimes returns undefined (which is coerced to false)
      const predicate = (user: any) => {
        if (user.id === 3) return undefined;
        if (user.id === 4) return null;
        return user.active;
      };

      const [passing, failing] = partitionBy(users, predicate);

      // Verify the structure of the result
      expect(passing).toHaveLength(3); // Users 1, 2, 5 (active=true)
      expect(failing).toHaveLength(2); // Users 3, 4 (undefined/null coerced to false)

      // Verify the content of each partition
      expect(passing.map(u => u.id)).toEqual([1, 2, 5]);
      expect(failing.map(u => u.id)).toEqual([3, 4]);
    });
  });

  describe('keyBy', () => {
    it('should create a lookup object using a string key', () => {
      // Create a lookup object for users by ID
      const result = keyBy(users, 'id');

      // Verify the structure of the result
      expect(Object.keys(result)).toHaveLength(5); // 5 unique IDs

      // Verify the content of the lookup object
      expect(result['1']).toEqual({ id: 1, name: 'Alice', role: 'admin', active: true });
      expect(result['2']).toEqual({ id: 2, name: 'Bob', role: 'user', active: true });
      expect(result['3']).toEqual({ id: 3, name: 'Charlie', role: 'user', active: false });
      expect(result['4']).toEqual({ id: 4, name: 'Diana', role: 'admin', active: true });
      expect(result['5']).toEqual({ id: 5, name: 'Eve', role: 'manager', active: true });
    });

    it('should create a lookup object using a selector function', () => {
      // Create a lookup object for users by name
      const result = keyBy(users, (user) => user.name);

      // Verify the structure of the result
      expect(Object.keys(result)).toHaveLength(5); // 5 unique names

      // Verify the content of the lookup object
      expect(result['Alice']).toEqual({ id: 1, name: 'Alice', role: 'admin', active: true });
      expect(result['Bob']).toEqual({ id: 2, name: 'Bob', role: 'user', active: true });
      expect(result['Charlie']).toEqual({ id: 3, name: 'Charlie', role: 'user', active: false });
      expect(result['Diana']).toEqual({ id: 4, name: 'Diana', role: 'admin', active: true });
      expect(result['Eve']).toEqual({ id: 5, name: 'Eve', role: 'manager', active: true });
    });

    it('should create a lookup object using a complex selector function', () => {
      // Create a lookup object for health metrics by type and date
      const result = keyBy(healthMetrics, (metric) => `${metric.type}_${metric.date}`);

      // Verify the structure of the result
      expect(Object.keys(result)).toHaveLength(5); // 5 unique type+date combinations

      // Verify specific entries
      expect(result['bloodPressure_2023-01-01']).toBeDefined();
      expect(result['bloodPressure_2023-01-01'].id).toBe(1);
      
      expect(result['heartRate_2023-01-02']).toBeDefined();
      expect(result['heartRate_2023-01-02'].id).toBe(4);
    });

    it('should throw an error when duplicate keys are found', () => {
      // Create data with duplicate roles
      const dataWithDuplicates = [
        { id: 1, role: 'admin' },
        { id: 2, role: 'user' },
        { id: 3, role: 'admin' }, // Duplicate role
      ];

      // Attempt to create a lookup object by role
      expect(() => keyBy(dataWithDuplicates, 'role')).toThrow('Duplicate key "admin" found');
    });

    it('should return an empty object for an empty array', () => {
      const result = keyBy([], 'id');
      expect(result).toEqual({});
    });

    it('should throw an error for undefined or null arrays', () => {
      expect(() => keyBy(undefined as any, 'id')).toThrow('Cannot index undefined or null array');
      expect(() => keyBy(null as any, 'id')).toThrow('Cannot index undefined or null array');
    });

    it('should handle numeric and boolean keys by converting them to strings', () => {
      // Create a lookup object for appointments by ID (numeric)
      const resultNumeric = keyBy(appointments, 'id');
      expect(resultNumeric['1']).toBeDefined();
      expect(resultNumeric['1'].provider).toBe('Dr. Smith');

      // Create a lookup object for users by active status (boolean)
      // Note: This would throw an error due to duplicate keys, so we need to filter first
      const activeUsers = users.filter(user => user.active);
      const inactiveUsers = users.filter(user => !user.active);
      
      const resultActive = keyBy(activeUsers, 'active');
      expect(resultActive['true']).toBeDefined();
      expect(resultActive['true'].id).toBe(1); // First active user

      const resultInactive = keyBy(inactiveUsers, 'active');
      expect(resultInactive['false']).toBeDefined();
      expect(resultInactive['false'].id).toBe(3); // First inactive user
    });
  });

  describe('indexBy', () => {
    it('should create a lookup object with custom key and value selectors', () => {
      // Create a lookup of user names by ID
      const result = indexBy(
        users,
        (user) => user.id,
        (user) => user.name
      );

      // Verify the structure of the result
      expect(Object.keys(result)).toHaveLength(5); // 5 unique IDs

      // Verify the content of the lookup object
      expect(result['1']).toBe('Alice');
      expect(result['2']).toBe('Bob');
      expect(result['3']).toBe('Charlie');
      expect(result['4']).toBe('Diana');
      expect(result['5']).toBe('Eve');
    });

    it('should create a lookup object with complex key and value selectors', () => {
      // Create a lookup of appointment dates by provider and status
      const result = indexBy(
        appointments,
        (appointment) => `${appointment.provider}_${appointment.status}`,
        (appointment) => appointment.date
      );

      // Verify the structure of the result
      expect(Object.keys(result)).toHaveLength(4); // 4 unique provider+status combinations

      // Verify specific entries
      expect(result['Dr. Smith_completed']).toBe('2023-01-01');
      expect(result['Dr. Jones_scheduled']).toBe('2023-02-15');
      expect(result['Dr. Smith_scheduled']).toBe('2023-02-20');
      expect(result['Dr. Brown_cancelled']).toBe('2023-01-10');
    });

    it('should throw an error when duplicate keys are found', () => {
      // Create data with duplicate roles
      const dataWithDuplicates = [
        { id: 1, role: 'admin', name: 'Alice' },
        { id: 2, role: 'user', name: 'Bob' },
        { id: 3, role: 'admin', name: 'Charlie' }, // Duplicate role
      ];

      // Attempt to create a lookup object by role
      expect(() => indexBy(
        dataWithDuplicates,
        (user) => user.role,
        (user) => user.name
      )).toThrow('Duplicate key "admin" found');
    });

    it('should return an empty object for an empty array', () => {
      const result = indexBy([], (item) => item, (item) => item);
      expect(result).toEqual({});
    });

    it('should throw an error for undefined or null arrays', () => {
      expect(() => indexBy(undefined as any, (item) => item, (item) => item))
        .toThrow('Cannot index undefined or null array');
      expect(() => indexBy(null as any, (item) => item, (item) => item))
        .toThrow('Cannot index undefined or null array');
    });

    it('should handle numeric and boolean keys by converting them to strings', () => {
      // Create a lookup of user names by ID (numeric)
      const resultNumeric = indexBy(
        users,
        (user) => user.id,
        (user) => user.name
      );
      expect(resultNumeric['1']).toBe('Alice');

      // Create a lookup of role counts by active status (boolean)
      // We need to ensure unique keys, so we'll use a different approach
      const resultBoolean = indexBy(
        [
          { key: true, value: 'Active Users' },
          { key: false, value: 'Inactive Users' }
        ],
        (item) => item.key,
        (item) => item.value
      );
      expect(resultBoolean['true']).toBe('Active Users');
      expect(resultBoolean['false']).toBe('Inactive Users');
    });
  });

  describe('countBy', () => {
    it('should count occurrences by a string key', () => {
      // Count users by role
      const result = countBy(users, 'role');

      // Verify the structure of the result
      expect(Object.keys(result)).toHaveLength(3); // admin, user, manager

      // Verify the counts
      expect(result.admin).toBe(2);
      expect(result.user).toBe(2);
      expect(result.manager).toBe(1);
    });

    it('should count occurrences using a selector function', () => {
      // Count health metrics by date
      const result = countBy(healthMetrics, (metric) => metric.date);

      // Verify the structure of the result
      expect(Object.keys(result)).toHaveLength(2); // 2023-01-01, 2023-01-02

      // Verify the counts
      expect(result['2023-01-01']).toBe(3);
      expect(result['2023-01-02']).toBe(2);
    });

    it('should count occurrences using a complex selector function', () => {
      // Count appointments by provider and status
      const result = countBy(appointments, (appointment) => 
        `${appointment.provider}_${appointment.status}`
      );

      // Verify the structure of the result
      expect(Object.keys(result)).toHaveLength(4); // 4 unique provider+status combinations

      // Verify specific counts
      expect(result['Dr. Smith_completed']).toBe(1);
      expect(result['Dr. Jones_scheduled']).toBe(1);
      expect(result['Dr. Smith_scheduled']).toBe(1);
      expect(result['Dr. Brown_cancelled']).toBe(1);
    });

    it('should return an empty object for an empty array', () => {
      const result = countBy([], 'id');
      expect(result).toEqual({});
    });

    it('should throw an error for undefined or null arrays', () => {
      expect(() => countBy(undefined as any, 'id')).toThrow('Cannot count undefined or null array');
      expect(() => countBy(null as any, 'id')).toThrow('Cannot count undefined or null array');
    });

    it('should handle numeric and boolean keys by converting them to strings', () => {
      // Count users by active status (boolean)
      const resultBoolean = countBy(users, 'active');
      expect(resultBoolean['true']).toBe(4);
      expect(resultBoolean['false']).toBe(1);

      // Count health metrics by value (numeric)
      const resultNumeric = countBy(healthMetrics, 'value');
      expect(resultNumeric['120']).toBe(1);
      expect(resultNumeric['118']).toBe(1);
      expect(resultNumeric['72']).toBe(1);
      expect(resultNumeric['75']).toBe(1);
      expect(resultNumeric['70']).toBe(1);
    });

    it('should handle arrays with undefined or null values for the counting key', () => {
      const dataWithNulls = [
        { id: 1, category: 'A' },
        { id: 2, category: null },
        { id: 3, category: undefined },
        { id: 4, category: 'A' },
      ];

      const result = countBy(dataWithNulls, 'category');

      // Verify the structure of the result
      expect(Object.keys(result)).toHaveLength(3); // 'A', 'null', 'undefined'
      expect(result['A']).toBe(2);
      expect(result['null']).toBe(1);
      expect(result['undefined']).toBe(1);
    });
  });

  // Type safety tests
  describe('Type Safety', () => {
    // These tests are more for TypeScript compilation validation
    // They ensure that the utility functions maintain proper type safety

    it('should maintain type safety with groupBy', () => {
      interface User {
        id: number;
        name: string;
        role: string;
      }

      const typedUsers: User[] = [
        { id: 1, name: 'Alice', role: 'admin' },
        { id: 2, name: 'Bob', role: 'user' },
      ];

      // Using string key
      const groupedByRole = groupBy(typedUsers, 'role');
      expect(typeof groupedByRole).toBe('object');
      
      // The result should be Record<string, User[]>
      const adminUsers: User[] = groupedByRole['admin'];
      expect(adminUsers[0].name).toBe('Alice');

      // Using selector function
      const groupedById = groupBy(typedUsers, user => String(user.id));
      expect(typeof groupedById).toBe('object');
      
      // The result should be Record<string, User[]>
      const userWithId1: User[] = groupedById['1'];
      expect(userWithId1[0].name).toBe('Alice');
    });

    it('should maintain type safety with partitionBy', () => {
      interface Metric {
        id: number;
        value: number;
        normal: boolean;
      }

      const metrics: Metric[] = [
        { id: 1, value: 120, normal: true },
        { id: 2, value: 180, normal: false },
      ];

      // Using predicate function
      const [normalMetrics, abnormalMetrics] = partitionBy(metrics, metric => metric.normal);
      
      // Both arrays should be Metric[]
      expect(Array.isArray(normalMetrics)).toBe(true);
      expect(Array.isArray(abnormalMetrics)).toBe(true);
      
      // Type checking
      if (normalMetrics.length > 0) {
        const metric: Metric = normalMetrics[0];
        expect(metric.normal).toBe(true);
      }
      
      if (abnormalMetrics.length > 0) {
        const metric: Metric = abnormalMetrics[0];
        expect(metric.normal).toBe(false);
      }
    });

    it('should maintain type safety with keyBy', () => {
      interface Appointment {
        id: number;
        provider: string;
        date: string;
      }

      const appointments: Appointment[] = [
        { id: 1, provider: 'Dr. Smith', date: '2023-01-01' },
        { id: 2, provider: 'Dr. Jones', date: '2023-02-15' },
      ];

      // Using string key
      const appointmentsById = keyBy(appointments, 'id');
      expect(typeof appointmentsById).toBe('object');
      
      // The result should be Record<string, Appointment>
      const appointment1: Appointment = appointmentsById['1'];
      expect(appointment1.provider).toBe('Dr. Smith');

      // Using selector function
      const appointmentsByProvider = keyBy(appointments, app => app.provider);
      expect(typeof appointmentsByProvider).toBe('object');
      
      // The result should be Record<string, Appointment>
      const drSmithAppointment: Appointment = appointmentsByProvider['Dr. Smith'];
      expect(drSmithAppointment.id).toBe(1);
    });

    it('should maintain type safety with indexBy', () => {
      interface User {
        id: number;
        name: string;
        email: string;
      }

      const users: User[] = [
        { id: 1, name: 'Alice', email: 'alice@example.com' },
        { id: 2, name: 'Bob', email: 'bob@example.com' },
      ];

      // Using key and value selectors
      const emailsById = indexBy(
        users,
        user => user.id,
        user => user.email
      );
      expect(typeof emailsById).toBe('object');
      
      // The result should be Record<string, string>
      const email1: string = emailsById['1'];
      expect(email1).toBe('alice@example.com');
    });

    it('should maintain type safety with countBy', () => {
      interface Product {
        id: number;
        category: string;
        price: number;
      }

      const products: Product[] = [
        { id: 1, category: 'electronics', price: 100 },
        { id: 2, category: 'books', price: 20 },
        { id: 3, category: 'electronics', price: 200 },
      ];

      // Using string key
      const countsByCategory = countBy(products, 'category');
      expect(typeof countsByCategory).toBe('object');
      
      // The result should be Record<string, number>
      const electronicsCount: number = countsByCategory['electronics'];
      expect(electronicsCount).toBe(2);

      // Using selector function
      const countsByPriceRange = countBy(products, product => 
        product.price > 50 ? 'expensive' : 'cheap'
      );
      expect(typeof countsByPriceRange).toBe('object');
      
      // The result should be Record<string, number>
      const expensiveCount: number = countsByPriceRange['expensive'];
      expect(expensiveCount).toBe(2);
    });
  });
});