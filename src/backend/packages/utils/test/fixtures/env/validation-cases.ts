/**
 * Environment Variable Validation Test Cases
 * 
 * This module provides test fixtures for validating environment variables,
 * including valid and invalid values for different types of environment variables.
 * These fixtures are essential for testing the validation functions in the
 * env/validation.ts module and ensuring that environment validation correctly
 * identifies valid and invalid configurations.
 */

/**
 * Test cases for string validation
 */
export const stringValidationCases = {
  valid: [
    { name: 'SIMPLE_STRING', value: 'hello', description: 'Simple string value' },
    { name: 'EMPTY_STRING', value: '', description: 'Empty string' },
    { name: 'LONG_STRING', value: 'a'.repeat(1000), description: 'Long string' },
    { name: 'STRING_WITH_SPECIAL_CHARS', value: 'hello!@#$%^&*()', description: 'String with special characters' },
    { name: 'STRING_WITH_SPACES', value: 'hello world', description: 'String with spaces' },
    { name: 'STRING_WITH_NUMBERS', value: 'hello123', description: 'String with numbers' },
    { name: 'STRING_WITH_NEWLINES', value: 'hello\nworld', description: 'String with newlines' },
    { name: 'STRING_WITH_TABS', value: 'hello\tworld', description: 'String with tabs' },
    { name: 'STRING_WITH_QUOTES', value: '"hello"', description: 'String with quotes' },
    { name: 'STRING_WITH_UNICODE', value: 'héllö wörld', description: 'String with unicode characters' },
  ],
  invalid: [
    // For string validation, most values are valid as strings
    // These cases are more for testing specific string validation rules
    { name: 'TOO_SHORT', value: 'a', minLength: 2, description: 'String shorter than minimum length' },
    { name: 'TOO_LONG', value: 'abcdef', maxLength: 5, description: 'String longer than maximum length' },
    { name: 'INVALID_PATTERN', value: 'abc', pattern: /^\d+$/, description: 'String not matching required pattern' },
    { name: 'NOT_IN_ENUM', value: 'other', enum: ['option1', 'option2'], description: 'String not in allowed enum values' },
  ]
};

/**
 * Test cases for number validation
 */
export const numberValidationCases = {
  valid: [
    { name: 'ZERO', value: '0', expected: 0, description: 'Zero' },
    { name: 'POSITIVE_INTEGER', value: '42', expected: 42, description: 'Positive integer' },
    { name: 'NEGATIVE_INTEGER', value: '-42', expected: -42, description: 'Negative integer' },
    { name: 'POSITIVE_FLOAT', value: '3.14', expected: 3.14, description: 'Positive float' },
    { name: 'NEGATIVE_FLOAT', value: '-3.14', expected: -3.14, description: 'Negative float' },
    { name: 'SCIENTIFIC_NOTATION', value: '1e3', expected: 1000, description: 'Scientific notation' },
    { name: 'LARGE_NUMBER', value: '9007199254740991', expected: 9007199254740991, description: 'Large number (MAX_SAFE_INTEGER)' },
    { name: 'SMALL_NUMBER', value: '-9007199254740991', expected: -9007199254740991, description: 'Small number (MIN_SAFE_INTEGER)' },
    { name: 'NUMBER_WITH_WHITESPACE', value: ' 42 ', expected: 42, description: 'Number with whitespace' },
  ],
  invalid: [
    { name: 'EMPTY_STRING', value: '', description: 'Empty string' },
    { name: 'ALPHABETIC_STRING', value: 'abc', description: 'Alphabetic string' },
    { name: 'ALPHANUMERIC_STRING', value: '42abc', description: 'Alphanumeric string' },
    { name: 'SPECIAL_CHARS', value: '!@#', description: 'Special characters' },
    { name: 'MULTIPLE_DECIMAL_POINTS', value: '3.14.15', description: 'Multiple decimal points' },
    { name: 'TOO_SMALL', value: '5', min: 10, description: 'Number smaller than minimum' },
    { name: 'TOO_LARGE', value: '100', max: 50, description: 'Number larger than maximum' },
    { name: 'NOT_AN_INTEGER', value: '3.14', int: true, description: 'Float when integer required' },
    { name: 'NEGATIVE_WHEN_POSITIVE_REQUIRED', value: '-5', positive: true, description: 'Negative when positive required' },
    { name: 'NEGATIVE_WHEN_NON_NEGATIVE_REQUIRED', value: '-5', nonNegative: true, description: 'Negative when non-negative required' },
    { name: 'NAN', value: 'NaN', description: 'Not a number' },
    { name: 'INFINITY', value: 'Infinity', description: 'Infinity' },
  ]
};

/**
 * Test cases for boolean validation
 */
export const booleanValidationCases = {
  valid: [
    { name: 'TRUE_LOWERCASE', value: 'true', expected: true, description: 'true (lowercase)' },
    { name: 'TRUE_UPPERCASE', value: 'TRUE', expected: true, description: 'TRUE (uppercase)' },
    { name: 'TRUE_MIXED_CASE', value: 'True', expected: true, description: 'True (mixed case)' },
    { name: 'ONE', value: '1', expected: true, description: '1' },
    { name: 'YES_LOWERCASE', value: 'yes', expected: true, description: 'yes (lowercase)' },
    { name: 'YES_UPPERCASE', value: 'YES', expected: true, description: 'YES (uppercase)' },
    { name: 'Y_LOWERCASE', value: 'y', expected: true, description: 'y (lowercase)' },
    { name: 'Y_UPPERCASE', value: 'Y', expected: true, description: 'Y (uppercase)' },
    { name: 'ON_LOWERCASE', value: 'on', expected: true, description: 'on (lowercase)' },
    { name: 'ON_UPPERCASE', value: 'ON', expected: true, description: 'ON (uppercase)' },
    { name: 'FALSE_LOWERCASE', value: 'false', expected: false, description: 'false (lowercase)' },
    { name: 'FALSE_UPPERCASE', value: 'FALSE', expected: false, description: 'FALSE (uppercase)' },
    { name: 'FALSE_MIXED_CASE', value: 'False', expected: false, description: 'False (mixed case)' },
    { name: 'ZERO', value: '0', expected: false, description: '0' },
    { name: 'NO_LOWERCASE', value: 'no', expected: false, description: 'no (lowercase)' },
    { name: 'NO_UPPERCASE', value: 'NO', expected: false, description: 'NO (uppercase)' },
    { name: 'N_LOWERCASE', value: 'n', expected: false, description: 'n (lowercase)' },
    { name: 'N_UPPERCASE', value: 'N', expected: false, description: 'N (uppercase)' },
    { name: 'OFF_LOWERCASE', value: 'off', expected: false, description: 'off (lowercase)' },
    { name: 'OFF_UPPERCASE', value: 'OFF', expected: false, description: 'OFF (uppercase)' },
    { name: 'EMPTY_STRING', value: '', expected: false, description: 'Empty string (defaults to false)' },
  ],
  invalid: [
    // For boolean validation, most string values are interpreted as either true or false
    // These cases are for testing specific boolean validation rules or edge cases
    { name: 'INVALID_BOOLEAN', value: 'not-a-boolean', description: 'String that is not a recognized boolean value' },
    { name: 'NUMERIC_NON_BINARY', value: '2', description: 'Numeric value that is not 0 or 1' },
  ]
};

/**
 * Test cases for URL validation
 */
export const urlValidationCases = {
  valid: [
    { name: 'SIMPLE_HTTP_URL', value: 'http://example.com', description: 'Simple HTTP URL' },
    { name: 'SIMPLE_HTTPS_URL', value: 'https://example.com', description: 'Simple HTTPS URL' },
    { name: 'URL_WITH_PORT', value: 'https://example.com:8080', description: 'URL with port' },
    { name: 'URL_WITH_PATH', value: 'https://example.com/path', description: 'URL with path' },
    { name: 'URL_WITH_QUERY', value: 'https://example.com/path?query=value', description: 'URL with query' },
    { name: 'URL_WITH_FRAGMENT', value: 'https://example.com/path#fragment', description: 'URL with fragment' },
    { name: 'URL_WITH_USERNAME', value: 'https://user@example.com', description: 'URL with username' },
    { name: 'URL_WITH_USERNAME_PASSWORD', value: 'https://user:pass@example.com', description: 'URL with username and password' },
    { name: 'URL_WITH_IPV4', value: 'https://127.0.0.1', description: 'URL with IPv4 address' },
    { name: 'URL_WITH_IPV4_PORT', value: 'https://127.0.0.1:8080', description: 'URL with IPv4 address and port' },
    { name: 'URL_WITH_SUBDOMAIN', value: 'https://sub.example.com', description: 'URL with subdomain' },
    { name: 'URL_WITH_MULTIPLE_SUBDOMAINS', value: 'https://sub.sub.example.com', description: 'URL with multiple subdomains' },
    { name: 'FTP_URL', value: 'ftp://example.com', description: 'FTP URL' },
    { name: 'FILE_URL', value: 'file:///path/to/file', description: 'File URL' },
    { name: 'REDIS_URL', value: 'redis://localhost:6379', description: 'Redis URL' },
    { name: 'POSTGRESQL_URL', value: 'postgresql://user:pass@localhost:5432/dbname', description: 'PostgreSQL URL' },
    { name: 'MONGODB_URL', value: 'mongodb://localhost:27017/dbname', description: 'MongoDB URL' },
  ],
  invalid: [
    { name: 'EMPTY_STRING', value: '', description: 'Empty string' },
    { name: 'INVALID_URL_NO_PROTOCOL', value: 'example.com', description: 'URL without protocol' },
    { name: 'INVALID_URL_SPACE', value: 'https://example. com', description: 'URL with space' },
    { name: 'INVALID_URL_BACKSLASH', value: 'https:\\example.com', description: 'URL with backslash' },
    { name: 'INVALID_PROTOCOL', value: 'invalid://example.com', protocols: ['http', 'https'], description: 'URL with invalid protocol' },
    { name: 'INVALID_URL_MISSING_HOST', value: 'https://', description: 'URL missing host' },
    { name: 'INVALID_URL_SPECIAL_CHARS', value: 'https://example.com/<>', description: 'URL with invalid special characters' },
    { name: 'INVALID_URL_NO_TLD', value: 'https://example', requireTld: true, description: 'URL without TLD when required' },
  ]
};

/**
 * Test cases for array validation
 */
export const arrayValidationCases = {
  valid: [
    { name: 'EMPTY_ARRAY', value: '', expected: [], description: 'Empty array' },
    { name: 'SINGLE_ITEM', value: 'item1', expected: ['item1'], description: 'Single item' },
    { name: 'MULTIPLE_ITEMS', value: 'item1,item2,item3', expected: ['item1', 'item2', 'item3'], description: 'Multiple items' },
    { name: 'ITEMS_WITH_SPACES', value: 'item1, item2, item3', expected: ['item1', 'item2', 'item3'], description: 'Items with spaces' },
    { name: 'CUSTOM_DELIMITER', value: 'item1|item2|item3', delimiter: '|', expected: ['item1', 'item2', 'item3'], description: 'Custom delimiter' },
    { name: 'EMPTY_ITEMS_FILTERED', value: 'item1,,item3', expected: ['item1', 'item3'], description: 'Empty items filtered' },
    { name: 'ITEMS_WITH_SPECIAL_CHARS', value: 'item!,item@,item#', expected: ['item!', 'item@', 'item#'], description: 'Items with special characters' },
  ],
  invalid: [
    { name: 'TOO_FEW_ITEMS', value: 'item1', minLength: 2, description: 'Too few items' },
    { name: 'TOO_MANY_ITEMS', value: 'item1,item2,item3', maxLength: 2, description: 'Too many items' },
    { name: 'INVALID_ITEM', value: 'item1,item2,item3', itemValidator: (item: string) => item !== 'item3', description: 'Invalid item' },
  ]
};

/**
 * Test cases for JSON validation
 */
export const jsonValidationCases = {
  valid: [
    { name: 'EMPTY_OBJECT', value: '{}', expected: {}, description: 'Empty object' },
    { name: 'SIMPLE_OBJECT', value: '{"key":"value"}', expected: { key: 'value' }, description: 'Simple object' },
    { name: 'NESTED_OBJECT', value: '{"key":{"nested":"value"}}', expected: { key: { nested: 'value' } }, description: 'Nested object' },
    { name: 'OBJECT_WITH_ARRAY', value: '{"key":[1,2,3]}', expected: { key: [1, 2, 3] }, description: 'Object with array' },
    { name: 'OBJECT_WITH_BOOLEAN', value: '{"key":true}', expected: { key: true }, description: 'Object with boolean' },
    { name: 'OBJECT_WITH_NULL', value: '{"key":null}', expected: { key: null }, description: 'Object with null' },
    { name: 'OBJECT_WITH_NUMBER', value: '{"key":42}', expected: { key: 42 }, description: 'Object with number' },
    { name: 'EMPTY_ARRAY_JSON', value: '[]', expected: [], description: 'Empty array' },
    { name: 'ARRAY_OF_PRIMITIVES', value: '[1,2,3]', expected: [1, 2, 3], description: 'Array of primitives' },
    { name: 'ARRAY_OF_OBJECTS', value: '[{"key":1},{"key":2}]', expected: [{ key: 1 }, { key: 2 }], description: 'Array of objects' },
  ],
  invalid: [
    { name: 'EMPTY_STRING', value: '', description: 'Empty string' },
    { name: 'INVALID_JSON_SYNTAX', value: '{key:value}', description: 'Invalid JSON syntax (missing quotes)' },
    { name: 'INVALID_JSON_TRAILING_COMMA', value: '{"key":"value",}', description: 'Invalid JSON syntax (trailing comma)' },
    { name: 'INVALID_JSON_SINGLE_QUOTES', value: "{'key':'value'}", description: 'Invalid JSON syntax (single quotes)' },
    { name: 'INVALID_JSON_UNQUOTED_KEY', value: '{key:"value"}', description: 'Invalid JSON syntax (unquoted key)' },
    { name: 'INVALID_JSON_SCHEMA', value: '{"key":"value"}', schema: { requiredKey: 'string' }, description: 'Valid JSON but invalid schema' },
  ]
};

/**
 * Test cases for enum validation
 */
export const enumValidationCases = {
  valid: [
    { name: 'VALID_ENUM_VALUE', value: 'value1', enum: { VALUE1: 'value1', VALUE2: 'value2' }, expected: 'value1', description: 'Valid enum value' },
    { name: 'VALID_ENUM_KEY', value: 'VALUE1', enum: { VALUE1: 'value1', VALUE2: 'value2' }, expected: 'value1', description: 'Valid enum key' },
    { name: 'VALID_ENUM_CASE_INSENSITIVE', value: 'Value1', enum: { VALUE1: 'value1', VALUE2: 'value2' }, expected: 'value1', description: 'Valid enum value (case insensitive)' },
    { name: 'VALID_ENUM_WITH_DEFAULT', value: 'invalid', enum: { VALUE1: 'value1', VALUE2: 'value2' }, defaultValue: 'value1', expected: 'value1', description: 'Invalid enum value with default' },
    { name: 'VALID_NUMERIC_ENUM', value: '1', enum: { ONE: 1, TWO: 2 }, expected: 1, description: 'Valid numeric enum value' },
  ],
  invalid: [
    { name: 'EMPTY_STRING', value: '', enum: { VALUE1: 'value1', VALUE2: 'value2' }, description: 'Empty string' },
    { name: 'INVALID_ENUM_VALUE', value: 'value3', enum: { VALUE1: 'value1', VALUE2: 'value2' }, description: 'Invalid enum value' },
    { name: 'INVALID_ENUM_KEY', value: 'VALUE3', enum: { VALUE1: 'value1', VALUE2: 'value2' }, description: 'Invalid enum key' },
  ]
};

/**
 * Test cases for duration validation
 */
export const durationValidationCases = {
  valid: [
    { name: 'MILLISECONDS', value: '500ms', expected: 500, description: 'Milliseconds' },
    { name: 'SECONDS', value: '30s', expected: 30000, description: 'Seconds' },
    { name: 'MINUTES', value: '5m', expected: 300000, description: 'Minutes' },
    { name: 'HOURS', value: '2h', expected: 7200000, description: 'Hours' },
    { name: 'DAYS', value: '1d', expected: 86400000, description: 'Days' },
    { name: 'PLAIN_NUMBER', value: '1000', expected: 1000, description: 'Plain number (interpreted as milliseconds)' },
  ],
  invalid: [
    { name: 'EMPTY_STRING', value: '', description: 'Empty string' },
    { name: 'INVALID_DURATION_FORMAT', value: '5x', description: 'Invalid duration format' },
    { name: 'INVALID_DURATION_VALUE', value: 'abc', description: 'Invalid duration value' },
    { name: 'NEGATIVE_DURATION', value: '-5s', description: 'Negative duration' },
    { name: 'TOO_SMALL_DURATION', value: '500ms', min: 1000, description: 'Duration smaller than minimum' },
    { name: 'TOO_LARGE_DURATION', value: '10m', max: 300000, description: 'Duration larger than maximum' },
  ]
};

/**
 * Test cases for port validation
 */
export const portValidationCases = {
  valid: [
    { name: 'MIN_PORT', value: '1', expected: 1, description: 'Minimum valid port' },
    { name: 'MAX_PORT', value: '65535', expected: 65535, description: 'Maximum valid port' },
    { name: 'COMMON_HTTP_PORT', value: '80', expected: 80, description: 'Common HTTP port' },
    { name: 'COMMON_HTTPS_PORT', value: '443', expected: 443, description: 'Common HTTPS port' },
    { name: 'COMMON_DB_PORT', value: '5432', expected: 5432, description: 'Common database port' },
  ],
  invalid: [
    { name: 'EMPTY_STRING', value: '', description: 'Empty string' },
    { name: 'NEGATIVE_PORT', value: '-80', description: 'Negative port' },
    { name: 'ZERO_PORT', value: '0', description: 'Zero port' },
    { name: 'TOO_LARGE_PORT', value: '65536', description: 'Port larger than maximum' },
    { name: 'FLOAT_PORT', value: '80.5', description: 'Float port' },
    { name: 'NON_NUMERIC_PORT', value: 'abc', description: 'Non-numeric port' },
  ]
};

/**
 * Test cases for host validation
 */
export const hostValidationCases = {
  valid: [
    { name: 'LOCALHOST', value: 'localhost', description: 'Localhost' },
    { name: 'DOMAIN_NAME', value: 'example.com', description: 'Domain name' },
    { name: 'SUBDOMAIN', value: 'sub.example.com', description: 'Subdomain' },
    { name: 'IPV4_ADDRESS', value: '127.0.0.1', description: 'IPv4 address' },
    { name: 'IPV4_LOOPBACK', value: '127.0.0.1', description: 'IPv4 loopback' },
    { name: 'HOSTNAME_WITH_DASH', value: 'my-host.example.com', description: 'Hostname with dash' },
    { name: 'HOSTNAME_WITH_UNDERSCORE', value: 'my_host.example.com', description: 'Hostname with underscore' },
  ],
  invalid: [
    { name: 'EMPTY_STRING', value: '', description: 'Empty string' },
    { name: 'INVALID_HOSTNAME_SPACE', value: 'my host', description: 'Hostname with space' },
    { name: 'INVALID_HOSTNAME_SPECIAL_CHARS', value: 'host!', description: 'Hostname with special characters' },
    { name: 'INVALID_IPV4_FORMAT', value: '127.0.0', description: 'Invalid IPv4 format' },
    { name: 'INVALID_IPV4_VALUES', value: '999.999.999.999', description: 'Invalid IPv4 values' },
    { name: 'URL_WITH_PROTOCOL', value: 'http://example.com', description: 'URL with protocol' },
    { name: 'URL_WITH_PATH', value: 'example.com/path', description: 'URL with path' },
  ]
};

/**
 * Test cases for database URL validation
 */
export const databaseUrlValidationCases = {
  valid: [
    { name: 'POSTGRESQL_URL', value: 'postgresql://localhost:5432/dbname', description: 'PostgreSQL URL' },
    { name: 'POSTGRESQL_URL_WITH_CREDENTIALS', value: 'postgresql://user:pass@localhost:5432/dbname', description: 'PostgreSQL URL with credentials' },
    { name: 'POSTGRESQL_URL_WITH_PARAMS', value: 'postgresql://localhost:5432/dbname?sslmode=require', description: 'PostgreSQL URL with parameters' },
    { name: 'MYSQL_URL', value: 'mysql://localhost:3306/dbname', description: 'MySQL URL' },
    { name: 'MONGODB_URL', value: 'mongodb://localhost:27017/dbname', description: 'MongoDB URL' },
    { name: 'MONGODB_URL_WITH_REPLICA_SET', value: 'mongodb://host1:27017,host2:27017/dbname?replicaSet=rs0', description: 'MongoDB URL with replica set' },
  ],
  invalid: [
    { name: 'EMPTY_STRING', value: '', description: 'Empty string' },
    { name: 'INVALID_DB_PROTOCOL', value: 'invalid://localhost:5432/dbname', description: 'Invalid database protocol' },
    { name: 'MISSING_DB_NAME', value: 'postgresql://localhost:5432/', description: 'Missing database name' },
    { name: 'INVALID_DB_URL_FORMAT', value: 'postgresql:localhost:5432/dbname', description: 'Invalid database URL format' },
    { name: 'UNSUPPORTED_DB_PROTOCOL', value: 'redis://localhost:6379', protocols: ['postgresql', 'mysql', 'mongodb'], description: 'Unsupported database protocol' },
  ]
};

/**
 * Test cases for API key validation
 */
export const apiKeyValidationCases = {
  valid: [
    { name: 'SIMPLE_API_KEY', value: '1234567890abcdef', description: 'Simple API key' },
    { name: 'LONG_API_KEY', value: '1234567890abcdef1234567890abcdef', description: 'Long API key' },
    { name: 'API_KEY_WITH_SPECIAL_CHARS', value: '1234567890abcdef-_', description: 'API key with special characters' },
    { name: 'API_KEY_WITH_MIXED_CASE', value: '1234567890abcdefABCDEF', description: 'API key with mixed case' },
  ],
  invalid: [
    { name: 'EMPTY_STRING', value: '', description: 'Empty string' },
    { name: 'TOO_SHORT_API_KEY', value: '12345', minLength: 16, description: 'API key shorter than minimum length' },
    { name: 'INVALID_API_KEY_PATTERN', value: '12345!@#$%', pattern: /^[a-zA-Z0-9_-]+$/, description: 'API key not matching required pattern' },
  ]
};

/**
 * Test cases for JWT secret validation
 */
export const jwtSecretValidationCases = {
  valid: [
    { name: 'SIMPLE_JWT_SECRET', value: '1234567890abcdef1234567890abcdef', description: 'Simple JWT secret' },
    { name: 'LONG_JWT_SECRET', value: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', description: 'Long JWT secret' },
    { name: 'JWT_SECRET_WITH_SPECIAL_CHARS', value: '1234567890abcdef1234567890abcdef!@#$%^&*()', description: 'JWT secret with special characters' },
  ],
  invalid: [
    { name: 'EMPTY_STRING', value: '', description: 'Empty string' },
    { name: 'TOO_SHORT_JWT_SECRET', value: '12345', description: 'JWT secret shorter than minimum length' },
  ]
};

/**
 * Test cases for environment name validation
 */
export const environmentValidationCases = {
  valid: [
    { name: 'DEVELOPMENT', value: 'development', expected: 'development', description: 'Development environment' },
    { name: 'TEST', value: 'test', expected: 'test', description: 'Test environment' },
    { name: 'STAGING', value: 'staging', expected: 'staging', description: 'Staging environment' },
    { name: 'PRODUCTION', value: 'production', expected: 'production', description: 'Production environment' },
  ],
  invalid: [
    { name: 'EMPTY_STRING', value: '', description: 'Empty string' },
    { name: 'INVALID_ENVIRONMENT', value: 'dev', description: 'Invalid environment name' },
    { name: 'INVALID_ENVIRONMENT_CASE', value: 'DEVELOPMENT', description: 'Invalid environment name case' },
  ]
};

/**
 * Test cases for Redis URL validation
 */
export const redisUrlValidationCases = {
  valid: [
    { name: 'SIMPLE_REDIS_URL', value: 'redis://localhost:6379', description: 'Simple Redis URL' },
    { name: 'REDIS_URL_WITH_PASSWORD', value: 'redis://:password@localhost:6379', description: 'Redis URL with password' },
    { name: 'REDIS_URL_WITH_DATABASE', value: 'redis://localhost:6379/0', description: 'Redis URL with database' },
    { name: 'REDIS_URL_WITH_PASSWORD_AND_DATABASE', value: 'redis://:password@localhost:6379/0', description: 'Redis URL with password and database' },
    { name: 'REDIS_SENTINEL_URL', value: 'redis+sentinel://localhost:26379/mymaster/0', description: 'Redis Sentinel URL' },
    { name: 'REDIS_CLUSTER_URL', value: 'redis+cluster://localhost:6379/0', description: 'Redis Cluster URL' },
  ],
  invalid: [
    { name: 'EMPTY_STRING', value: '', description: 'Empty string' },
    { name: 'INVALID_REDIS_PROTOCOL', value: 'rediss://localhost:6379', description: 'Invalid Redis protocol' },
    { name: 'INVALID_REDIS_URL_FORMAT', value: 'redis:localhost:6379', description: 'Invalid Redis URL format' },
    { name: 'MISSING_REDIS_PORT', value: 'redis://localhost', description: 'Missing Redis port' },
  ]
};

/**
 * Test cases for Kafka brokers validation
 */
export const kafkaBrokersValidationCases = {
  valid: [
    { name: 'SINGLE_BROKER', value: 'localhost:9092', expected: ['localhost:9092'], description: 'Single broker' },
    { name: 'MULTIPLE_BROKERS', value: 'localhost:9092,localhost:9093,localhost:9094', expected: ['localhost:9092', 'localhost:9093', 'localhost:9094'], description: 'Multiple brokers' },
    { name: 'BROKERS_WITH_SPACES', value: 'localhost:9092, localhost:9093, localhost:9094', expected: ['localhost:9092', 'localhost:9093', 'localhost:9094'], description: 'Brokers with spaces' },
    { name: 'BROKERS_WITH_DOMAIN_NAMES', value: 'kafka1.example.com:9092,kafka2.example.com:9092', expected: ['kafka1.example.com:9092', 'kafka2.example.com:9092'], description: 'Brokers with domain names' },
    { name: 'BROKERS_WITH_IP_ADDRESSES', value: '192.168.1.1:9092,192.168.1.2:9092', expected: ['192.168.1.1:9092', '192.168.1.2:9092'], description: 'Brokers with IP addresses' },
  ],
  invalid: [
    { name: 'EMPTY_STRING', value: '', description: 'Empty string' },
    { name: 'INVALID_BROKER_FORMAT', value: 'localhost', description: 'Invalid broker format (missing port)' },
    { name: 'INVALID_BROKER_PORT', value: 'localhost:invalid', description: 'Invalid broker port' },
    { name: 'INVALID_BROKER_PORT_RANGE', value: 'localhost:70000', description: 'Invalid broker port range' },
    { name: 'MIXED_VALID_INVALID', value: 'localhost:9092,invalid', description: 'Mixed valid and invalid brokers' },
  ]
};

/**
 * Test cases for CORS origins validation
 */
export const corsOriginsValidationCases = {
  valid: [
    { name: 'WILDCARD', value: '*', expected: ['*'], description: 'Wildcard' },
    { name: 'SINGLE_ORIGIN', value: 'https://example.com', expected: ['https://example.com'], description: 'Single origin' },
    { name: 'MULTIPLE_ORIGINS', value: 'https://example.com,https://api.example.com', expected: ['https://example.com', 'https://api.example.com'], description: 'Multiple origins' },
    { name: 'ORIGINS_WITH_SPACES', value: 'https://example.com, https://api.example.com', expected: ['https://example.com', 'https://api.example.com'], description: 'Origins with spaces' },
    { name: 'ORIGINS_WITH_PORTS', value: 'https://example.com:8080,https://api.example.com:8081', expected: ['https://example.com:8080', 'https://api.example.com:8081'], description: 'Origins with ports' },
    { name: 'ORIGINS_WITH_PATHS', value: 'https://example.com/path,https://api.example.com/path', expected: ['https://example.com/path', 'https://api.example.com/path'], description: 'Origins with paths' },
  ],
  invalid: [
    { name: 'EMPTY_STRING', value: '', description: 'Empty string' },
    { name: 'INVALID_ORIGIN_FORMAT', value: 'example.com', description: 'Invalid origin format (missing protocol)' },
    { name: 'MIXED_VALID_INVALID', value: 'https://example.com,invalid', description: 'Mixed valid and invalid origins' },
  ]
};

/**
 * Test cases for log level validation
 */
export const logLevelValidationCases = {
  valid: [
    { name: 'DEBUG', value: 'debug', expected: 'debug', description: 'Debug log level' },
    { name: 'INFO', value: 'info', expected: 'info', description: 'Info log level' },
    { name: 'WARN', value: 'warn', expected: 'warn', description: 'Warn log level' },
    { name: 'ERROR', value: 'error', expected: 'error', description: 'Error log level' },
    { name: 'FATAL', value: 'fatal', expected: 'fatal', description: 'Fatal log level' },
    { name: 'UPPERCASE', value: 'DEBUG', expected: 'debug', description: 'Uppercase log level' },
    { name: 'MIXED_CASE', value: 'Debug', expected: 'debug', description: 'Mixed case log level' },
  ],
  invalid: [
    { name: 'EMPTY_STRING', value: '', description: 'Empty string' },
    { name: 'INVALID_LOG_LEVEL', value: 'trace', description: 'Invalid log level' },
    { name: 'INVALID_LOG_LEVEL_FORMAT', value: 'debugging', description: 'Invalid log level format' },
  ]
};

/**
 * Test cases for feature flags validation
 */
export const featureFlagsValidationCases = {
  valid: [
    { name: 'EMPTY_OBJECT', value: '{}', expected: {}, description: 'Empty object' },
    { name: 'SINGLE_FLAG', value: '{"feature1":true}', expected: { feature1: true }, description: 'Single feature flag' },
    { name: 'MULTIPLE_FLAGS', value: '{"feature1":true,"feature2":false}', expected: { feature1: true, feature2: false }, description: 'Multiple feature flags' },
    { name: 'ALL_BOOLEAN_VALUES', value: '{"feature1":true,"feature2":false}', expected: { feature1: true, feature2: false }, description: 'All boolean values' },
  ],
  invalid: [
    { name: 'EMPTY_STRING', value: '', description: 'Empty string' },
    { name: 'INVALID_JSON', value: '{feature1:true}', description: 'Invalid JSON' },
    { name: 'NON_OBJECT_VALUE', value: '"feature1"', description: 'Non-object value' },
    { name: 'NON_BOOLEAN_VALUES', value: '{"feature1":"true"}', description: 'Non-boolean values' },
    { name: 'MIXED_BOOLEAN_NON_BOOLEAN', value: '{"feature1":true,"feature2":"false"}', description: 'Mixed boolean and non-boolean values' },
  ]
};

/**
 * Test cases for journey configuration validation
 */
export const journeyConfigValidationCases = {
  valid: [
    {
      name: 'MINIMAL_CONFIG',
      value: '{"health":{"enabled":true},"care":{"enabled":false},"plan":{"enabled":true}}',
      expected: { health: { enabled: true }, care: { enabled: false }, plan: { enabled: true } },
      description: 'Minimal journey configuration'
    },
    {
      name: 'CONFIG_WITH_FEATURES',
      value: '{"health":{"enabled":true,"features":["metrics","goals"]},"care":{"enabled":true,"features":["appointments"]},"plan":{"enabled":true,"features":["claims","benefits"]}}',
      expected: {
        health: { enabled: true, features: ['metrics', 'goals'] },
        care: { enabled: true, features: ['appointments'] },
        plan: { enabled: true, features: ['claims', 'benefits'] }
      },
      description: 'Journey configuration with features'
    },
    {
      name: 'CONFIG_WITH_EMPTY_FEATURES',
      value: '{"health":{"enabled":true,"features":[]},"care":{"enabled":false},"plan":{"enabled":true}}',
      expected: { health: { enabled: true, features: [] }, care: { enabled: false }, plan: { enabled: true } },
      description: 'Journey configuration with empty features'
    },
  ],
  invalid: [
    { name: 'EMPTY_STRING', value: '', description: 'Empty string' },
    { name: 'INVALID_JSON', value: '{health:{enabled:true}}', description: 'Invalid JSON' },
    { name: 'MISSING_REQUIRED_JOURNEY', value: '{"health":{"enabled":true},"care":{"enabled":false}}', description: 'Missing required journey' },
    { name: 'MISSING_ENABLED_FLAG', value: '{"health":{},"care":{"enabled":false},"plan":{"enabled":true}}', description: 'Missing enabled flag' },
    { name: 'INVALID_FEATURES_TYPE', value: '{"health":{"enabled":true,"features":"metrics"},"care":{"enabled":false},"plan":{"enabled":true}}', description: 'Invalid features type' },
    { name: 'INVALID_ENABLED_TYPE', value: '{"health":{"enabled":"true"},"care":{"enabled":false},"plan":{"enabled":true}}', description: 'Invalid enabled type' },
  ]
};

/**
 * Test cases for database pool configuration validation
 */
export const dbPoolConfigValidationCases = {
  valid: [
    {
      name: 'MINIMAL_CONFIG',
      value: '{"min":1,"max":10,"idle":10000}',
      expected: { min: 1, max: 10, idle: 10000 },
      description: 'Minimal database pool configuration'
    },
    {
      name: 'EQUAL_MIN_MAX',
      value: '{"min":5,"max":5,"idle":10000}',
      expected: { min: 5, max: 5, idle: 10000 },
      description: 'Equal min and max values'
    },
    {
      name: 'HIGH_VALUES',
      value: '{"min":10,"max":100,"idle":60000}',
      expected: { min: 10, max: 100, idle: 60000 },
      description: 'High connection pool values'
    },
  ],
  invalid: [
    { name: 'EMPTY_STRING', value: '', description: 'Empty string' },
    { name: 'INVALID_JSON', value: '{min:1,max:10,idle:10000}', description: 'Invalid JSON' },
    { name: 'MISSING_REQUIRED_FIELD', value: '{"min":1,"max":10}', description: 'Missing required field' },
    { name: 'INVALID_MIN_TYPE', value: '{"min":"1","max":10,"idle":10000}', description: 'Invalid min type' },
    { name: 'INVALID_MAX_TYPE', value: '{"min":1,"max":"10","idle":10000}', description: 'Invalid max type' },
    { name: 'INVALID_IDLE_TYPE', value: '{"min":1,"max":10,"idle":"10000"}', description: 'Invalid idle type' },
    { name: 'MIN_GREATER_THAN_MAX', value: '{"min":20,"max":10,"idle":10000}', description: 'Min greater than max' },
    { name: 'NEGATIVE_MIN', value: '{"min":-1,"max":10,"idle":10000}', description: 'Negative min' },
    { name: 'ZERO_MIN', value: '{"min":0,"max":10,"idle":10000}', description: 'Zero min' },
    { name: 'NEGATIVE_MAX', value: '{"min":1,"max":-10,"idle":10000}', description: 'Negative max' },
    { name: 'ZERO_MAX', value: '{"min":1,"max":0,"idle":10000}', description: 'Zero max' },
    { name: 'NEGATIVE_IDLE', value: '{"min":1,"max":10,"idle":-10000}', description: 'Negative idle' },
    { name: 'TOO_LOW_IDLE', value: '{"min":1,"max":10,"idle":500}', description: 'Too low idle' },
  ]
};

/**
 * Test cases for retry policy configuration validation
 */
export const retryPolicyValidationCases = {
  valid: [
    {
      name: 'MINIMAL_CONFIG',
      value: '{"attempts":3,"delay":1000,"backoff":2}',
      expected: { attempts: 3, delay: 1000, backoff: 2 },
      description: 'Minimal retry policy configuration'
    },
    {
      name: 'WITH_MAX_DELAY',
      value: '{"attempts":5,"delay":1000,"backoff":2,"maxDelay":10000}',
      expected: { attempts: 5, delay: 1000, backoff: 2, maxDelay: 10000 },
      description: 'Retry policy with max delay'
    },
    {
      name: 'SINGLE_ATTEMPT',
      value: '{"attempts":1,"delay":1000,"backoff":1}',
      expected: { attempts: 1, delay: 1000, backoff: 1 },
      description: 'Single attempt retry policy'
    },
  ],
  invalid: [
    { name: 'EMPTY_STRING', value: '', description: 'Empty string' },
    { name: 'INVALID_JSON', value: '{attempts:3,delay:1000,backoff:2}', description: 'Invalid JSON' },
    { name: 'MISSING_REQUIRED_FIELD', value: '{"attempts":3,"delay":1000}', description: 'Missing required field' },
    { name: 'INVALID_ATTEMPTS_TYPE', value: '{"attempts":"3","delay":1000,"backoff":2}', description: 'Invalid attempts type' },
    { name: 'INVALID_DELAY_TYPE', value: '{"attempts":3,"delay":"1000","backoff":2}', description: 'Invalid delay type' },
    { name: 'INVALID_BACKOFF_TYPE', value: '{"attempts":3,"delay":1000,"backoff":"2"}', description: 'Invalid backoff type' },
    { name: 'INVALID_MAX_DELAY_TYPE', value: '{"attempts":3,"delay":1000,"backoff":2,"maxDelay":"10000"}', description: 'Invalid max delay type' },
    { name: 'NEGATIVE_ATTEMPTS', value: '{"attempts":-3,"delay":1000,"backoff":2}', description: 'Negative attempts' },
    { name: 'ZERO_ATTEMPTS', value: '{"attempts":0,"delay":1000,"backoff":2}', description: 'Zero attempts' },
    { name: 'NEGATIVE_DELAY', value: '{"attempts":3,"delay":-1000,"backoff":2}', description: 'Negative delay' },
    { name: 'ZERO_DELAY', value: '{"attempts":3,"delay":0,"backoff":2}', description: 'Zero delay' },
    { name: 'NEGATIVE_BACKOFF', value: '{"attempts":3,"delay":1000,"backoff":-2}', description: 'Negative backoff' },
    { name: 'ZERO_BACKOFF', value: '{"attempts":3,"delay":1000,"backoff":0}', description: 'Zero backoff' },
    { name: 'NEGATIVE_MAX_DELAY', value: '{"attempts":3,"delay":1000,"backoff":2,"maxDelay":-10000}', description: 'Negative max delay' },
    { name: 'ZERO_MAX_DELAY', value: '{"attempts":3,"delay":1000,"backoff":2,"maxDelay":0}', description: 'Zero max delay' },
  ]
};

/**
 * Test cases for service-specific environment variables
 */
export const serviceSpecificValidationCases = {
  health: {
    valid: [
      { name: 'METRICS_RETENTION_DAYS', value: '730', expected: 730, description: 'Metrics retention days' },
      { name: 'METRICS_AGGREGATION_INTERVALS', value: 'hour,day,week,month', expected: ['hour', 'day', 'week', 'month'], description: 'Metrics aggregation intervals' },
      { name: 'FHIR_API_URL', value: 'https://fhir.example.com/api', expected: new URL('https://fhir.example.com/api'), description: 'FHIR API URL' },
      { name: 'WEARABLES_SUPPORTED', value: 'googlefit,healthkit,fitbit', expected: ['googlefit', 'healthkit', 'fitbit'], description: 'Supported wearables' },
      { name: 'HEALTH_GOALS_MAX_ACTIVE', value: '10', expected: 10, description: 'Maximum active health goals' },
    ],
    invalid: [
      { name: 'METRICS_RETENTION_DAYS', value: '0', description: 'Zero metrics retention days' },
      { name: 'METRICS_RETENTION_DAYS', value: '3651', description: 'Metrics retention days exceeding maximum' },
      { name: 'FHIR_API_URL', value: 'invalid-url', description: 'Invalid FHIR API URL' },
      { name: 'HEALTH_GOALS_MAX_ACTIVE', value: '-1', description: 'Negative maximum active health goals' },
    ]
  },
  notification: {
    valid: [
      { name: 'EMAIL_PROVIDER', value: 'sendgrid', description: 'Email provider' },
      { name: 'EMAIL_DEFAULT_FROM', value: 'noreply@example.com', description: 'Default from email address' },
      { name: 'PUSH_API_KEY', value: '1234567890abcdef', description: 'Push API key' },
      { name: 'SMS_DEFAULT_FROM', value: '+15551234567', description: 'Default from phone number' },
      { name: 'WEBSOCKET_PORT', value: '3001', expected: 3001, description: 'WebSocket port' },
    ],
    invalid: [
      { name: 'EMAIL_PROVIDER', value: '', description: 'Empty email provider' },
      { name: 'EMAIL_DEFAULT_FROM', value: 'invalid-email', description: 'Invalid email address' },
      { name: 'WEBSOCKET_PORT', value: '70000', description: 'Invalid WebSocket port' },
    ]
  }
};

/**
 * Combined validation test cases for all environment variable types
 */
export const allValidationCases = {
  string: stringValidationCases,
  number: numberValidationCases,
  boolean: booleanValidationCases,
  url: urlValidationCases,
  array: arrayValidationCases,
  json: jsonValidationCases,
  enum: enumValidationCases,
  duration: durationValidationCases,
  port: portValidationCases,
  host: hostValidationCases,
  databaseUrl: databaseUrlValidationCases,
  apiKey: apiKeyValidationCases,
  jwtSecret: jwtSecretValidationCases,
  environment: environmentValidationCases,
  redisUrl: redisUrlValidationCases,
  kafkaBrokers: kafkaBrokersValidationCases,
  corsOrigins: corsOriginsValidationCases,
  logLevel: logLevelValidationCases,
  featureFlags: featureFlagsValidationCases,
  journeyConfig: journeyConfigValidationCases,
  dbPoolConfig: dbPoolConfigValidationCases,
  retryPolicy: retryPolicyValidationCases,
  serviceSpecific: serviceSpecificValidationCases
};