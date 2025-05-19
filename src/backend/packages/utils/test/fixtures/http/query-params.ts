/**
 * @file query-params.ts
 * @description Test fixtures for URL query parameters with various formats and encoding scenarios.
 * These fixtures are used for testing HTTP utilities that handle URL construction, parsing,
 * and parameter handling throughout the application.
 */

/**
 * Simple key-value query parameters
 */
export const simpleQueryParams = {
  // Basic string values
  basic: {
    params: { page: '1', limit: '10', sort: 'name' },
    expected: 'page=1&limit=10&sort=name',
    parsed: { page: '1', limit: '10', sort: 'name' }
  },
  
  // Different value types
  mixedTypes: {
    params: { id: 123, active: true, name: 'test-user', score: 99.5 },
    expected: 'id=123&active=true&name=test-user&score=99.5',
    parsed: { id: '123', active: 'true', name: 'test-user', score: '99.5' }
  },
  
  // Empty values
  emptyValues: {
    params: { empty: '', null: null, undefined: undefined },
    expected: 'empty=&null=&undefined=',
    parsed: { empty: '', null: '', undefined: '' }
  },
  
  // Single parameter
  singleParam: {
    params: { token: 'abc123' },
    expected: 'token=abc123',
    parsed: { token: 'abc123' }
  },
  
  // No parameters
  noParams: {
    params: {},
    expected: '',
    parsed: {}
  }
};

/**
 * Query parameters with special characters that require encoding
 */
export const specialCharQueryParams = {
  // URL unsafe characters
  urlUnsafeChars: {
    params: { query: 'hello world', path: '/users/profile' },
    expected: 'query=hello%20world&path=%2Fusers%2Fprofile',
    parsed: { query: 'hello world', path: '/users/profile' }
  },
  
  // Reserved characters
  reservedChars: {
    params: { filter: 'price>100', range: '10-20', query: 'name:John' },
    expected: 'filter=price%3E100&range=10-20&query=name%3AJohn',
    parsed: { filter: 'price>100', range: '10-20', query: 'name:John' }
  },
  
  // Unicode characters
  unicodeChars: {
    params: { name: '你好', city: 'São Paulo', emoji: '🚀' },
    expected: 'name=%E4%BD%A0%E5%A5%BD&city=S%C3%A3o%20Paulo&emoji=%F0%9F%9A%80',
    parsed: { name: '你好', city: 'São Paulo', emoji: '🚀' }
  },
  
  // HTML entities
  htmlEntities: {
    params: { html: '<div>Test</div>', script: 'alert("XSS")' },
    expected: 'html=%3Cdiv%3ETest%3C%2Fdiv%3E&script=alert%28%22XSS%22%29',
    parsed: { html: '<div>Test</div>', script: 'alert("XSS")' }
  },
  
  // Already encoded values
  preEncodedValues: {
    params: { encoded: 'already%20encoded', double: 'double%2520encoded' },
    expected: 'encoded=already%2520encoded&double=double%252520encoded',
    parsed: { encoded: 'already%20encoded', double: 'double%2520encoded' }
  }
};

/**
 * Query parameters with array values
 */
export const arrayQueryParams = {
  // Simple array values
  simpleArrays: {
    params: { ids: ['1', '2', '3'], tags: ['news', 'tech'] },
    expected: 'ids=1&ids=2&ids=3&tags=news&tags=tech',
    parsed: { ids: ['1', '2', '3'], tags: ['news', 'tech'] }
  },
  
  // Array with bracket notation
  bracketArrays: {
    params: { 'ids[]': ['1', '2', '3'], 'tags[]': ['news', 'tech'] },
    expected: 'ids%5B%5D=1&ids%5B%5D=2&ids%5B%5D=3&tags%5B%5D=news&tags%5B%5D=tech',
    parsed: { 'ids[]': ['1', '2', '3'], 'tags[]': ['news', 'tech'] }
  },
  
  // Array with indexed bracket notation
  indexedArrays: {
    params: { 'ids[0]': '1', 'ids[1]': '2', 'ids[2]': '3' },
    expected: 'ids%5B0%5D=1&ids%5B1%5D=2&ids%5B2%5D=3',
    parsed: { 'ids[0]': '1', 'ids[1]': '2', 'ids[2]': '3' }
  },
  
  // Mixed array formats
  mixedArrayFormats: {
    params: { ids: ['1', '2'], 'tags[]': ['news', 'tech'], 'colors[0]': 'red' },
    expected: 'ids=1&ids=2&tags%5B%5D=news&tags%5B%5D=tech&colors%5B0%5D=red',
    parsed: { ids: ['1', '2'], 'tags[]': ['news', 'tech'], 'colors[0]': 'red' }
  },
  
  // Empty arrays
  emptyArrays: {
    params: { empty: [] },
    expected: '',
    parsed: {}
  }
};

/**
 * Query parameters with nested objects
 */
export const nestedQueryParams = {
  // Simple nested object
  simpleNested: {
    params: { user: { id: '123', name: 'John' } },
    expected: 'user%5Bid%5D=123&user%5Bname%5D=John',
    parsed: { 'user[id]': '123', 'user[name]': 'John' }
  },
  
  // Deeply nested objects
  deeplyNested: {
    params: { user: { profile: { address: { city: 'New York', zip: '10001' } } } },
    expected: 'user%5Bprofile%5D%5Baddress%5D%5Bcity%5D=New%20York&user%5Bprofile%5D%5Baddress%5D%5Bzip%5D=10001',
    parsed: { 'user[profile][address][city]': 'New York', 'user[profile][address][zip]': '10001' }
  },
  
  // Mixed nested objects and arrays
  mixedNestedAndArrays: {
    params: { user: { id: '123', roles: ['admin', 'editor'] } },
    expected: 'user%5Bid%5D=123&user%5Broles%5D=admin&user%5Broles%5D=editor',
    parsed: { 'user[id]': '123', 'user[roles]': ['admin', 'editor'] }
  },
  
  // Nested objects with dot notation
  dotNotation: {
    params: { 'user.id': '123', 'user.name': 'John' },
    expected: 'user.id=123&user.name=John',
    parsed: { 'user.id': '123', 'user.name': 'John' }
  },
  
  // Empty nested objects
  emptyNestedObjects: {
    params: { user: {} },
    expected: '',
    parsed: {}
  }
};

/**
 * Complex query parameter combinations
 */
export const complexQueryParams = {
  // Journey-specific query parameters
  journeyParams: {
    params: {
      journeyType: 'health',
      filters: {
        dateRange: { start: '2023-01-01', end: '2023-12-31' },
        metrics: ['weight', 'steps', 'heartRate'],
        goals: { achieved: true }
      },
      pagination: { page: 1, limit: 25 },
      sort: '-date'
    },
    expected: 'journeyType=health&filters%5BdateRange%5D%5Bstart%5D=2023-01-01&filters%5BdateRange%5D%5Bend%5D=2023-12-31&filters%5Bmetrics%5D=weight&filters%5Bmetrics%5D=steps&filters%5Bmetrics%5D=heartRate&filters%5Bgoals%5D%5Bachieved%5D=true&pagination%5Bpage%5D=1&pagination%5Blimit%5D=25&sort=-date',
    parsed: {
      'journeyType': 'health',
      'filters[dateRange][start]': '2023-01-01',
      'filters[dateRange][end]': '2023-12-31',
      'filters[metrics]': ['weight', 'steps', 'heartRate'],
      'filters[goals][achieved]': 'true',
      'pagination[page]': '1',
      'pagination[limit]': '25',
      'sort': '-date'
    }
  },
  
  // API query parameters with all features
  apiParams: {
    params: {
      q: 'search term',
      fields: ['name', 'email', 'phone'],
      include: ['profile', 'orders'],
      filter: {
        status: ['active', 'pending'],
        'created_at': { gte: '2023-01-01' }
      },
      page: { number: 1, size: 20 },
      sort: '-created_at'
    },
    expected: 'q=search%20term&fields=name&fields=email&fields=phone&include=profile&include=orders&filter%5Bstatus%5D=active&filter%5Bstatus%5D=pending&filter%5Bcreated_at%5D%5Bgte%5D=2023-01-01&page%5Bnumber%5D=1&page%5Bsize%5D=20&sort=-created_at',
    parsed: {
      'q': 'search term',
      'fields': ['name', 'email', 'phone'],
      'include': ['profile', 'orders'],
      'filter[status]': ['active', 'pending'],
      'filter[created_at][gte]': '2023-01-01',
      'page[number]': '1',
      'page[size]': '20',
      'sort': '-created_at'
    }
  },
  
  // GraphQL-like query parameters
  graphqlParams: {
    params: {
      query: `{
        user(id: "123") {
          name
          email
        }
      }`,
      variables: {
        includeEmail: true
      },
      operationName: 'GetUser'
    },
    expected: 'query=%7B%0A%20%20%20%20%20%20%20%20user%28id%3A%20%22123%22%29%20%7B%0A%20%20%20%20%20%20%20%20%20%20name%0A%20%20%20%20%20%20%20%20%20%20email%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%7D&variables%5BincludeEmail%5D=true&operationName=GetUser',
    parsed: {
      'query': `{
        user(id: "123") {
          name
          email
        }
      }`,
      'variables[includeEmail]': 'true',
      'operationName': 'GetUser'
    }
  }
};

/**
 * Edge cases for query parameters
 */
export const edgeCaseQueryParams = {
  // Very long parameter values
  longValues: {
    params: { token: 'a'.repeat(2000) },
    expected: `token=${'a'.repeat(2000)}`,
    parsed: { token: 'a'.repeat(2000) }
  },
  
  // Parameters with same name
  duplicateNames: {
    params: { id: ['1', '1'], filter: ['active', 'active'] },
    expected: 'id=1&id=1&filter=active&filter=active',
    parsed: { id: ['1', '1'], filter: ['active', 'active'] }
  },
  
  // Parameters with unusual names
  unusualNames: {
    params: { '': 'empty-key', ' ': 'space-key', '!@#$': 'special-chars' },
    expected: '=empty-key&%20=space-key&!%40%23%24=special-chars',
    parsed: { '': 'empty-key', ' ': 'space-key', '!@#$': 'special-chars' }
  },
  
  // Boolean values with different representations
  booleanValues: {
    params: { a: true, b: false, c: 'true', d: 'false', e: 1, f: 0 },
    expected: 'a=true&b=false&c=true&d=false&e=1&f=0',
    parsed: { a: 'true', b: 'false', c: 'true', d: 'false', e: '1', f: '0' }
  },
  
  // Numeric values with different formats
  numericValues: {
    params: { a: 123, b: -456, c: 3.14, d: '123', e: '3.14', f: 1e6 },
    expected: 'a=123&b=-456&c=3.14&d=123&e=3.14&f=1000000',
    parsed: { a: '123', b: '-456', c: '3.14', d: '123', e: '3.14', f: '1000000' }
  }
};

/**
 * Complete URL examples with query parameters
 */
export const urlExamples = {
  // Simple URL with query parameters
  simpleUrl: {
    baseUrl: 'https://api.example.com/users',
    params: { page: '1', limit: '10', sort: 'name' },
    expected: 'https://api.example.com/users?page=1&limit=10&sort=name'
  },
  
  // URL with path parameters and query parameters
  pathAndQueryUrl: {
    baseUrl: 'https://api.example.com/users/123/profile',
    params: { fields: ['name', 'email'], include: 'address' },
    expected: 'https://api.example.com/users/123/profile?fields=name&fields=email&include=address'
  },
  
  // URL with existing query parameters
  existingQueryUrl: {
    baseUrl: 'https://api.example.com/search?q=initial',
    params: { page: '1', limit: '10' },
    expected: 'https://api.example.com/search?q=initial&page=1&limit=10'
  },
  
  // URL with complex query parameters
  complexUrl: {
    baseUrl: 'https://api.example.com/data',
    params: {
      filter: { status: 'active', date: { gte: '2023-01-01' } },
      sort: '-created_at',
      page: { number: 1, size: 20 }
    },
    expected: 'https://api.example.com/data?filter%5Bstatus%5D=active&filter%5Bdate%5D%5Bgte%5D=2023-01-01&sort=-created_at&page%5Bnumber%5D=1&page%5Bsize%5D=20'
  },
  
  // URL with hash fragment and query parameters
  hashFragmentUrl: {
    baseUrl: 'https://example.com/page#section',
    params: { highlight: 'true' },
    expected: 'https://example.com/page?highlight=true#section'
  }
};

/**
 * Factory functions for generating test query parameters
 */
export const queryParamFactories = {
  /**
   * Creates pagination query parameters
   * 
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 20)
   * @returns Pagination query parameters
   */
  createPaginationParams: (page = 1, limit = 20) => ({
    page: page.toString(),
    limit: limit.toString()
  }),
  
  /**
   * Creates sorting query parameters
   * 
   * @param field - Field to sort by
   * @param direction - Sort direction ('asc' or 'desc')
   * @returns Sorting query parameters
   */
  createSortParams: (field: string, direction: 'asc' | 'desc' = 'asc') => ({
    sort: direction === 'desc' ? `-${field}` : field
  }),
  
  /**
   * Creates filtering query parameters
   * 
   * @param filters - Object containing filter criteria
   * @returns Filtering query parameters
   */
  createFilterParams: (filters: Record<string, string | string[] | boolean | number>) => ({
    filter: filters
  }),
  
  /**
   * Creates field selection query parameters
   * 
   * @param fields - Array of field names to include
   * @returns Field selection query parameters
   */
  createFieldsParams: (fields: string[]) => ({
    fields
  }),
  
  /**
   * Creates inclusion query parameters for related resources
   * 
   * @param includes - Array of related resources to include
   * @returns Inclusion query parameters
   */
  createIncludeParams: (includes: string[]) => ({
    include: includes
  })
};