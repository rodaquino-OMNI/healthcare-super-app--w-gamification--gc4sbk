/**
 * Test fixtures for URL query parameters with various formats and encoding scenarios.
 * 
 * These fixtures are designed to test URL construction, parsing, and parameter handling
 * in HTTP utilities throughout the application. They cover simple key-value pairs,
 * arrays, nested objects, special characters, and URL-encoded values.
 */

/**
 * Interface for simple query parameter objects with string values
 */
export interface SimpleQueryParams {
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Interface for complex query parameter objects that can contain nested structures
 */
export interface ComplexQueryParams {
  [key: string]: string | number | boolean | null | undefined | string[] | number[] | Record<string, any> | ComplexQueryParams;
}

/**
 * Interface for pre-encoded query parameter strings
 */
export interface EncodedQueryParams {
  raw: string; // The raw query string without the leading '?'
  parsed: Record<string, any>; // The expected parsed result
}

/**
 * Simple key-value query parameters
 */
export const simpleQueryParams: Record<string, SimpleQueryParams> = {
  empty: {},
  
  basic: {
    name: 'John Doe',
    age: 30,
    active: true
  },
  
  withNullAndUndefined: {
    name: 'John Doe',
    email: null,
    phone: undefined
  },
  
  withNumbers: {
    id: 12345,
    price: 99.99,
    quantity: 0,
    negative: -10
  },
  
  withBooleans: {
    active: true,
    verified: false,
    premium: true
  },
  
  withSpecialCharacters: {
    search: 'health & wellness',
    tags: 'react,node.js,typescript',
    query: 'SELECT * FROM users'
  }
};

/**
 * Complex query parameters with arrays and nested objects
 */
export const complexQueryParams: Record<string, ComplexQueryParams> = {
  withArrays: {
    ids: [1, 2, 3, 4, 5],
    names: ['John', 'Jane', 'Bob'],
    mixed: [true, 123, 'test']
  },
  
  withNestedObjects: {
    user: {
      id: 1,
      name: 'John Doe',
      contact: {
        email: 'john@example.com',
        phone: '123-456-7890'
      }
    },
    preferences: {
      theme: 'dark',
      notifications: true
    }
  },
  
  withMixedTypes: {
    id: 12345,
    name: 'Product Name',
    tags: ['tag1', 'tag2', 'tag3'],
    metadata: {
      created: '2023-01-01',
      updated: '2023-02-15'
    },
    inStock: true
  },
  
  withDeepNesting: {
    journey: {
      health: {
        metrics: {
          steps: 10000,
          calories: 2500,
          activities: ['running', 'walking']
        },
        goals: {
          daily: {
            steps: 8000,
            water: 2000
          }
        }
      }
    }
  }
};

/**
 * Query parameters with special characters that require encoding
 */
export const specialCharacterParams: Record<string, SimpleQueryParams> = {
  withSpaces: {
    search: 'health and wellness',
    title: 'How to stay healthy'
  },
  
  withReservedCharacters: {
    query: 'name=John&age=30',
    filter: 'price>100&category=health',
    path: '/users/profile?tab=settings'
  },
  
  withSymbols: {
    equation: '5+5=10',
    range: '10~20',
    discount: '20% off',
    currency: '$100.00'
  },
  
  withInternationalCharacters: {
    greeting: 'こんにちは', // Japanese
    location: 'São Paulo', // Portuguese
    name: 'Jürgen Müller' // German
  },
  
  withEmojis: {
    reaction: '👍',
    weather: '☀️',
    mood: '😊'
  }
};

/**
 * Pre-encoded query parameter strings and their expected parsed results
 */
export const encodedQueryParams: Record<string, EncodedQueryParams> = {
  simple: {
    raw: 'name=John%20Doe&age=30&active=true',
    parsed: {
      name: 'John Doe',
      age: '30',
      active: 'true'
    }
  },
  
  withArrays: {
    raw: 'ids[]=1&ids[]=2&ids[]=3&category=health',
    parsed: {
      'ids[]': ['1', '2', '3'],
      category: 'health'
    }
  },
  
  withArraysAltFormat: {
    raw: 'ids=1,2,3&category=health',
    parsed: {
      ids: '1,2,3',
      category: 'health'
    }
  },
  
  withNestedBracketNotation: {
    raw: 'user[name]=John&user[email]=john%40example.com&user[address][city]=New%20York',
    parsed: {
      'user[name]': 'John',
      'user[email]': 'john@example.com',
      'user[address][city]': 'New York'
    }
  },
  
  withSpecialCharacters: {
    raw: 'search=%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF&filter=price%3E100',
    parsed: {
      search: 'こんにちは',
      filter: 'price>100'
    }
  },
  
  withPlusForSpace: {
    raw: 'query=health+and+wellness&category=fitness',
    parsed: {
      query: 'health and wellness',
      category: 'fitness'
    }
  },
  
  withReservedCharacters: {
    raw: 'equation=5%2B5%3D10&range=10%7E20&discount=20%25%20off',
    parsed: {
      equation: '5+5=10',
      range: '10~20',
      discount: '20% off'
    }
  },
  
  withEmptyValues: {
    raw: 'name=&email=john%40example.com&phone=',
    parsed: {
      name: '',
      email: 'john@example.com',
      phone: ''
    }
  },
  
  withDuplicateKeys: {
    raw: 'tag=health&tag=fitness&tag=wellness',
    parsed: {
      tag: ['health', 'fitness', 'wellness']
    }
  },
  
  withNoValues: {
    raw: 'nojs&cors&debug',
    parsed: {
      nojs: '',
      cors: '',
      debug: ''
    }
  }
};

/**
 * Edge cases for query parameter handling
 */
export const edgeCaseParams: Record<string, any> = {
  emptyString: {
    params: { q: '' },
    expected: 'q='
  },
  
  nullValue: {
    params: { q: null },
    expected: 'q='
  },
  
  undefinedValue: {
    params: { q: undefined },
    expected: ''
  },
  
  zeroValue: {
    params: { q: 0 },
    expected: 'q=0'
  },
  
  falseValue: {
    params: { q: false },
    expected: 'q=false'
  },
  
  mixedArrayTypes: {
    params: { items: [1, 'two', true, null, undefined] },
    expected: 'items=1&items=two&items=true&items='
  },
  
  deepObject: {
    params: {
      filter: {
        price: { min: 10, max: 100 },
        categories: ['health', 'fitness'],
        inStock: true
      }
    },
    // Different libraries may serialize this differently
    possibleResults: [
      'filter[price][min]=10&filter[price][max]=100&filter[categories][0]=health&filter[categories][1]=fitness&filter[inStock]=true',
      'filter=%7B%22price%22%3A%7B%22min%22%3A10%2C%22max%22%3A100%7D%2C%22categories%22%3A%5B%22health%22%2C%22fitness%22%5D%2C%22inStock%22%3Atrue%7D'
    ]
  },
  
  arrayWithEmptyItems: {
    params: { items: ['one', '', null, 'four'] },
    expected: 'items=one&items=&items=&items=four'
  },
  
  extremelyLongValue: {
    params: { q: 'a'.repeat(2000) },
    // This is just a prefix check since the full string would be too long
    expectedPrefix: 'q=aaaaaaaaaaaaaaaaaaaa'
  }
};

/**
 * Journey-specific query parameters for testing journey-related HTTP requests
 */
export const journeyQueryParams: Record<string, ComplexQueryParams> = {
  health: {
    userId: '12345',
    metrics: ['steps', 'heartRate', 'sleep'],
    dateRange: {
      start: '2023-01-01',
      end: '2023-01-31'
    },
    includeGoals: true,
    deviceIds: ['fitbit-123', 'apple-watch-456']
  },
  
  care: {
    userId: '12345',
    appointmentTypes: ['checkup', 'specialist', 'followup'],
    dateRange: {
      start: '2023-02-01',
      end: '2023-02-28'
    },
    providerIds: ['dr-smith-123', 'dr-jones-456'],
    includeTelemedicine: true,
    status: 'scheduled'
  },
  
  plan: {
    userId: '12345',
    planTypes: ['health', 'dental', 'vision'],
    coverageYear: 2023,
    includeDependent: true,
    claimStatus: ['approved', 'pending', 'rejected'],
    sortBy: 'date',
    sortOrder: 'desc'
  },
  
  gamification: {
    userId: '12345',
    achievementTypes: ['daily', 'weekly', 'milestone'],
    includeCompleted: true,
    journeys: ['health', 'care', 'plan'],
    timeframe: {
      start: '2023-01-01',
      end: '2023-12-31'
    },
    limit: 50,
    offset: 0
  }
};

/**
 * Default export with all query parameter fixtures
 */
export default {
  simple: simpleQueryParams,
  complex: complexQueryParams,
  specialCharacters: specialCharacterParams,
  encoded: encodedQueryParams,
  edgeCases: edgeCaseParams,
  journey: journeyQueryParams
};