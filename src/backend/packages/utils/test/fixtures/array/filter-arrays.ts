/**
 * @file Test fixtures for array filtering operations.
 * Contains arrays with elements that match various filtering criteria (by value, type, property, or condition).
 * These fixtures ensure consistent testing of filter functions across the codebase.
 */

// ===== PRIMITIVE ARRAYS =====

/**
 * Array of numbers for testing numeric filtering operations
 */
export const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/**
 * Expected results for filtering numbers by common conditions
 */
export const numbersFiltered = {
  even: [2, 4, 6, 8, 10],
  odd: [1, 3, 5, 7, 9],
  greaterThanFive: [6, 7, 8, 9, 10],
  lessThanFive: [1, 2, 3, 4],
  divisibleByThree: [3, 6, 9],
  betweenThreeAndSeven: [3, 4, 5, 6, 7]
};

/**
 * Array of strings for testing string filtering operations
 */
export const strings = [
  'apple',
  'banana',
  'cherry',
  'date',
  'elderberry',
  'fig',
  'grape',
  'honeydew',
  'apple pie',
  'banana bread'
];

/**
 * Expected results for filtering strings by common conditions
 */
export const stringsFiltered = {
  startingWithA: ['apple', 'apple pie'],
  startingWithB: ['banana', 'banana bread'],
  containingA: ['apple', 'banana', 'grape', 'apple pie', 'banana bread'],
  lengthGreaterThanFive: ['banana', 'cherry', 'elderberry', 'honeydew', 'apple pie', 'banana bread'],
  lengthLessThanFive: ['date', 'fig', 'grape'],
  containingSpace: ['apple pie', 'banana bread']
};

/**
 * Array of booleans for testing boolean filtering operations
 */
export const booleans = [true, false, true, true, false, false, true];

/**
 * Expected results for filtering booleans
 */
export const booleansFiltered = {
  trueValues: [true, true, true, true],
  falseValues: [false, false, false]
};

// ===== MIXED TYPE ARRAYS =====

/**
 * Array with mixed types for testing type-based filtering
 */
export const mixedTypes = [
  1,
  'string',
  true,
  { id: 1, name: 'object' },
  null,
  undefined,
  42,
  'another string',
  false,
  [1, 2, 3],
  new Date('2023-01-01')
];

/**
 * Expected results for filtering mixed types by type
 */
export const mixedTypesFiltered = {
  numbers: [1, 42],
  strings: ['string', 'another string'],
  booleans: [true, false],
  objects: [{ id: 1, name: 'object' }, [1, 2, 3], new Date('2023-01-01')],
  nullish: [null, undefined],
  notNullish: [1, 'string', true, { id: 1, name: 'object' }, 42, 'another string', false, [1, 2, 3], new Date('2023-01-01')]
};

// ===== OBJECT ARRAYS =====

/**
 * Interface for user objects in test fixtures
 */
export interface TestUser {
  id: number;
  name: string;
  age: number;
  active: boolean;
  role: string;
  department?: string;
  tags?: string[];
}

/**
 * Array of user objects for testing object filtering operations
 */
export const users: TestUser[] = [
  { id: 1, name: 'Alice', age: 28, active: true, role: 'admin', department: 'IT', tags: ['developer', 'team-lead'] },
  { id: 2, name: 'Bob', age: 35, active: true, role: 'user', department: 'HR', tags: ['manager'] },
  { id: 3, name: 'Charlie', age: 42, active: false, role: 'user', department: 'Finance', tags: ['accountant'] },
  { id: 4, name: 'Diana', age: 31, active: true, role: 'admin', department: 'IT', tags: ['developer', 'security'] },
  { id: 5, name: 'Eve', age: 25, active: true, role: 'user', department: 'Marketing', tags: ['designer'] },
  { id: 6, name: 'Frank', age: 44, active: false, role: 'user', department: 'Operations' },
  { id: 7, name: 'Grace', age: 29, active: true, role: 'admin', department: 'IT', tags: ['developer'] },
  { id: 8, name: 'Hank', age: 37, active: true, role: 'user', department: 'HR', tags: ['recruiter'] },
  { id: 9, name: 'Ivy', age: 33, active: false, role: 'user', department: 'Finance', tags: ['analyst'] },
  { id: 10, name: 'Jack', age: 27, active: true, role: 'user', department: 'Marketing', tags: ['copywriter'] }
];

/**
 * Expected results for filtering users by common conditions
 */
export const usersFiltered = {
  // Filter by single property
  active: users.filter(user => user.active),
  inactive: users.filter(user => !user.active),
  admins: users.filter(user => user.role === 'admin'),
  users: users.filter(user => user.role === 'user'),
  
  // Filter by department
  itDepartment: users.filter(user => user.department === 'IT'),
  hrDepartment: users.filter(user => user.department === 'HR'),
  financeDepartment: users.filter(user => user.department === 'Finance'),
  marketingDepartment: users.filter(user => user.department === 'Marketing'),
  
  // Filter by age
  under30: users.filter(user => user.age < 30),
  over30: users.filter(user => user.age >= 30),
  between25And35: users.filter(user => user.age >= 25 && user.age <= 35),
  
  // Filter by multiple criteria
  activeAdmins: users.filter(user => user.active && user.role === 'admin'),
  inactiveUsers: users.filter(user => !user.active && user.role === 'user'),
  itAdmins: users.filter(user => user.department === 'IT' && user.role === 'admin'),
  
  // Filter by array property
  developers: users.filter(user => user.tags?.includes('developer')),
  withTags: users.filter(user => user.tags && user.tags.length > 0),
  withoutTags: users.filter(user => !user.tags || user.tags.length === 0)
};

/**
 * Interface for product objects in test fixtures
 */
export interface TestProduct {
  id: number;
  name: string;
  price: number;
  category: string;
  inStock: boolean;
  tags?: string[];
  attributes?: {
    color?: string;
    size?: string;
    weight?: number;
  };
}

/**
 * Array of product objects for testing nested property filtering
 */
export const products: TestProduct[] = [
  {
    id: 1,
    name: 'Laptop',
    price: 1200,
    category: 'Electronics',
    inStock: true,
    tags: ['tech', 'work'],
    attributes: { color: 'silver', weight: 2.5 }
  },
  {
    id: 2,
    name: 'Smartphone',
    price: 800,
    category: 'Electronics',
    inStock: true,
    tags: ['tech', 'mobile'],
    attributes: { color: 'black', weight: 0.3 }
  },
  {
    id: 3,
    name: 'Headphones',
    price: 150,
    category: 'Electronics',
    inStock: false,
    tags: ['tech', 'audio'],
    attributes: { color: 'black', weight: 0.2 }
  },
  {
    id: 4,
    name: 'T-shirt',
    price: 25,
    category: 'Clothing',
    inStock: true,
    tags: ['casual', 'summer'],
    attributes: { color: 'blue', size: 'M' }
  },
  {
    id: 5,
    name: 'Jeans',
    price: 60,
    category: 'Clothing',
    inStock: true,
    tags: ['casual', 'denim'],
    attributes: { color: 'blue', size: 'L' }
  },
  {
    id: 6,
    name: 'Sneakers',
    price: 90,
    category: 'Footwear',
    inStock: false,
    tags: ['casual', 'sports'],
    attributes: { color: 'white', size: '42' }
  },
  {
    id: 7,
    name: 'Watch',
    price: 300,
    category: 'Accessories',
    inStock: true,
    tags: ['luxury', 'gift'],
    attributes: { color: 'gold' }
  },
  {
    id: 8,
    name: 'Backpack',
    price: 70,
    category: 'Accessories',
    inStock: true,
    tags: ['travel', 'outdoor'],
    attributes: { color: 'black' }
  },
  {
    id: 9,
    name: 'Coffee Maker',
    price: 120,
    category: 'Home',
    inStock: false,
    attributes: { color: 'silver', weight: 3.0 }
  },
  {
    id: 10,
    name: 'Desk Chair',
    price: 180,
    category: 'Furniture',
    inStock: true,
    attributes: { color: 'black', weight: 8.5 }
  }
];

/**
 * Expected results for filtering products by common conditions
 */
export const productsFiltered = {
  // Filter by category
  electronics: products.filter(product => product.category === 'Electronics'),
  clothing: products.filter(product => product.category === 'Clothing'),
  accessories: products.filter(product => product.category === 'Accessories'),
  
  // Filter by price
  under100: products.filter(product => product.price < 100),
  over100: products.filter(product => product.price >= 100),
  between50And200: products.filter(product => product.price >= 50 && product.price <= 200),
  
  // Filter by stock
  inStock: products.filter(product => product.inStock),
  outOfStock: products.filter(product => !product.inStock),
  
  // Filter by tags
  techProducts: products.filter(product => product.tags?.includes('tech')),
  casualProducts: products.filter(product => product.tags?.includes('casual')),
  
  // Filter by nested attributes
  blackProducts: products.filter(product => product.attributes?.color === 'black'),
  lightProducts: products.filter(product => product.attributes?.weight && product.attributes.weight < 1.0),
  heavyProducts: products.filter(product => product.attributes?.weight && product.attributes.weight >= 3.0),
  
  // Filter by multiple criteria
  inStockElectronics: products.filter(product => product.inStock && product.category === 'Electronics'),
  expensiveClothing: products.filter(product => product.category === 'Clothing' && product.price > 50),
  blackTechProducts: products.filter(
    product => product.attributes?.color === 'black' && product.tags?.includes('tech')
  )
};

// ===== UNIQUE FILTERING FIXTURES =====

/**
 * Array with duplicate values for testing uniqueness filtering
 */
export const duplicateNumbers = [1, 2, 2, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 5];

/**
 * Expected result for unique filtering of duplicateNumbers
 */
export const uniqueNumbers = [1, 2, 3, 4, 5];

/**
 * Array of objects with duplicate values for testing uniqueness filtering by property
 */
export interface DuplicateItem {
  id: number;
  category: string;
  value: number;
}

export const duplicateItems: DuplicateItem[] = [
  { id: 1, category: 'A', value: 10 },
  { id: 2, category: 'B', value: 20 },
  { id: 3, category: 'A', value: 30 },
  { id: 4, category: 'C', value: 40 },
  { id: 5, category: 'B', value: 50 },
  { id: 6, category: 'A', value: 60 },
  { id: 7, category: 'C', value: 70 },
  { id: 8, category: 'B', value: 80 },
  { id: 9, category: 'A', value: 90 },
  { id: 10, category: 'C', value: 100 }
];

/**
 * Expected results for unique filtering of duplicateItems by category
 */
export const uniqueItemsByCategory = [
  { id: 1, category: 'A', value: 10 },
  { id: 2, category: 'B', value: 20 },
  { id: 4, category: 'C', value: 40 }
];

// ===== DIFFERENCE FILTERING FIXTURES =====

/**
 * Arrays for testing difference operations
 */
export const arrayA = [1, 2, 3, 4, 5];
export const arrayB = [3, 4, 5, 6, 7];

/**
 * Expected results for difference operations
 */
export const differenceResults = {
  aMinusB: [1, 2],         // Elements in A that are not in B
  bMinusA: [6, 7],         // Elements in B that are not in A
  symmetricDifference: [1, 2, 6, 7]  // Elements in either A or B but not both
};

/**
 * Object arrays for testing difference operations by property
 */
export interface IdentifiableItem {
  id: number;
  name: string;
}

export const objectArrayA: IdentifiableItem[] = [
  { id: 1, name: 'Item 1' },
  { id: 2, name: 'Item 2' },
  { id: 3, name: 'Item 3' },
  { id: 4, name: 'Item 4' },
  { id: 5, name: 'Item 5' }
];

export const objectArrayB: IdentifiableItem[] = [
  { id: 3, name: 'Item 3' },
  { id: 4, name: 'Item 4 - Updated' },
  { id: 5, name: 'Item 5' },
  { id: 6, name: 'Item 6' },
  { id: 7, name: 'Item 7' }
];

/**
 * Expected results for difference operations on object arrays
 */
export const objectDifferenceResults = {
  aMinusBById: [{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }],
  bMinusAById: [{ id: 6, name: 'Item 6' }, { id: 7, name: 'Item 7' }],
  updatedItems: [{ id: 4, name: 'Item 4 - Updated' }]  // Items with same id but different properties
};

// ===== PROPERTY FILTERING FIXTURES =====

/**
 * Complex objects for testing property-based filtering
 */
export interface ComplexObject {
  id: number;
  properties: {
    name: string;
    values: number[];
    metadata: {
      created: Date;
      tags: string[];
      status: 'active' | 'inactive' | 'pending';
    };
  };
}

export const complexObjects: ComplexObject[] = [
  {
    id: 1,
    properties: {
      name: 'Object A',
      values: [10, 20, 30],
      metadata: {
        created: new Date('2023-01-15'),
        tags: ['important', 'featured'],
        status: 'active'
      }
    }
  },
  {
    id: 2,
    properties: {
      name: 'Object B',
      values: [5, 15, 25],
      metadata: {
        created: new Date('2023-02-20'),
        tags: ['normal'],
        status: 'inactive'
      }
    }
  },
  {
    id: 3,
    properties: {
      name: 'Object C',
      values: [50, 100, 150],
      metadata: {
        created: new Date('2023-03-10'),
        tags: ['important', 'urgent'],
        status: 'active'
      }
    }
  },
  {
    id: 4,
    properties: {
      name: 'Object D',
      values: [7, 14, 21],
      metadata: {
        created: new Date('2023-04-05'),
        tags: ['low-priority'],
        status: 'pending'
      }
    }
  },
  {
    id: 5,
    properties: {
      name: 'Object E',
      values: [33, 66, 99],
      metadata: {
        created: new Date('2023-05-12'),
        tags: ['important', 'featured'],
        status: 'active'
      }
    }
  }
];

/**
 * Expected results for filtering complex objects by nested properties
 */
export const complexObjectsFiltered = {
  // Filter by status
  active: complexObjects.filter(obj => obj.properties.metadata.status === 'active'),
  inactive: complexObjects.filter(obj => obj.properties.metadata.status === 'inactive'),
  pending: complexObjects.filter(obj => obj.properties.metadata.status === 'pending'),
  
  // Filter by tags
  important: complexObjects.filter(obj => obj.properties.metadata.tags.includes('important')),
  featured: complexObjects.filter(obj => obj.properties.metadata.tags.includes('featured')),
  urgent: complexObjects.filter(obj => obj.properties.metadata.tags.includes('urgent')),
  
  // Filter by date
  createdBefore: complexObjects.filter(
    obj => obj.properties.metadata.created < new Date('2023-03-01')
  ),
  createdAfter: complexObjects.filter(
    obj => obj.properties.metadata.created > new Date('2023-03-01')
  ),
  
  // Filter by values
  highValues: complexObjects.filter(
    obj => obj.properties.values.some(value => value > 50)
  ),
  lowValues: complexObjects.filter(
    obj => obj.properties.values.every(value => value < 50)
  ),
  
  // Combined filters
  activeAndImportant: complexObjects.filter(
    obj => obj.properties.metadata.status === 'active' && 
           obj.properties.metadata.tags.includes('important')
  ),
  featuredOrUrgent: complexObjects.filter(
    obj => obj.properties.metadata.tags.includes('featured') || 
           obj.properties.metadata.tags.includes('urgent')
  )
};