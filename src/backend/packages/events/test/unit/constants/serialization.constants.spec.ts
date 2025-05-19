import {
  SerializationFormat,
  DEFAULT_SERIALIZATION_FORMAT,
  SERIALIZATION_CONTENT_TYPES,
  SERIALIZATION_FILE_EXTENSIONS,
  CharacterEncoding,
  DEFAULT_CHARACTER_ENCODING,
  MAX_EVENT_SIZE_BYTES,
  DEFAULT_BUFFER_SIZE,
  CompressionAlgorithm,
  DEFAULT_COMPRESSION_ALGORITHM,
  MIN_COMPRESSION_SIZE_BYTES,
  COMPRESSION_LEVELS,
  DEFAULT_COMPRESSION_LEVEL,
  SCHEMA_REGISTRY_URL,
  SCHEMA_REGISTRY_AUTH,
  SchemaCompatibilityMode,
  DEFAULT_SCHEMA_COMPATIBILITY_MODE,
  SchemaSubjectNamingStrategy,
  DEFAULT_SCHEMA_SUBJECT_NAMING_STRATEGY,
  JSON_SERIALIZATION_OPTIONS,
  AVRO_SERIALIZATION_OPTIONS,
  PROTOBUF_SERIALIZATION_OPTIONS,
  MSGPACK_SERIALIZATION_OPTIONS,
  CBOR_SERIALIZATION_OPTIONS,
  CONTENT_TYPE_HEADER,
  CONTENT_ENCODING_HEADER,
  SCHEMA_VERSION_HEADER,
  COMPRESSION_CONTENT_ENCODINGS,
  DEFAULT_CONTENT_TYPE,
  MAX_SERIALIZATION_ERROR_CACHE_SIZE,
  SERIALIZATION_ERROR_CACHE_TTL_MS,
  INCLUDE_PAYLOAD_IN_ERROR_REPORTS,
  MAX_ERROR_PAYLOAD_EXCERPT_LENGTH
} from '../../../src/constants/serialization.constants';

/**
 * Unit tests for serialization constants
 * 
 * These tests validate the correct definition of serialization formats,
 * encoding options, and schema validation settings to ensure consistent
 * serialization behavior across all services.
 */
describe('Serialization Constants', () => {
  // -----------------------------------------------------------------------------
  // Serialization Format Constants Tests
  // -----------------------------------------------------------------------------
  describe('Serialization Format Constants', () => {
    it('should define all required serialization formats with correct values', () => {
      // Verify all serialization formats are defined
      expect(SerializationFormat.JSON).toBe('application/json');
      expect(SerializationFormat.AVRO).toBe('application/avro');
      expect(SerializationFormat.PROTOBUF).toBe('application/protobuf');
      expect(SerializationFormat.MSGPACK).toBe('application/msgpack');
      expect(SerializationFormat.CBOR).toBe('application/cbor');
      
      // Verify enum completeness
      const expectedFormats = ['JSON', 'AVRO', 'PROTOBUF', 'MSGPACK', 'CBOR'];
      const actualFormats = Object.keys(SerializationFormat).filter(key => isNaN(Number(key)));
      expect(actualFormats).toEqual(expectedFormats);
    });

    it('should set the default serialization format to JSON', () => {
      expect(DEFAULT_SERIALIZATION_FORMAT).toBe(SerializationFormat.JSON);
    });

    it('should map serialization formats to correct content types', () => {
      expect(SERIALIZATION_CONTENT_TYPES[SerializationFormat.JSON]).toBe('application/json');
      expect(SERIALIZATION_CONTENT_TYPES[SerializationFormat.AVRO]).toBe('application/avro');
      expect(SERIALIZATION_CONTENT_TYPES[SerializationFormat.PROTOBUF]).toBe('application/protobuf');
      expect(SERIALIZATION_CONTENT_TYPES[SerializationFormat.MSGPACK]).toBe('application/msgpack');
      expect(SERIALIZATION_CONTENT_TYPES[SerializationFormat.CBOR]).toBe('application/cbor');
      
      // Verify all formats have a content type mapping
      Object.values(SerializationFormat).forEach(format => {
        if (typeof format === 'string') {
          expect(SERIALIZATION_CONTENT_TYPES[format]).toBeDefined();
        }
      });
    });

    it('should map serialization formats to correct file extensions', () => {
      expect(SERIALIZATION_FILE_EXTENSIONS[SerializationFormat.JSON]).toBe('.json');
      expect(SERIALIZATION_FILE_EXTENSIONS[SerializationFormat.AVRO]).toBe('.avsc');
      expect(SERIALIZATION_FILE_EXTENSIONS[SerializationFormat.PROTOBUF]).toBe('.proto');
      expect(SERIALIZATION_FILE_EXTENSIONS[SerializationFormat.MSGPACK]).toBe('.msgpack');
      expect(SERIALIZATION_FILE_EXTENSIONS[SerializationFormat.CBOR]).toBe('.cbor');
      
      // Verify all formats have a file extension mapping
      Object.values(SerializationFormat).forEach(format => {
        if (typeof format === 'string') {
          expect(SERIALIZATION_FILE_EXTENSIONS[format]).toBeDefined();
        }
      });
    });
  });

  // -----------------------------------------------------------------------------
  // Encoding Constants Tests
  // -----------------------------------------------------------------------------
  describe('Encoding Constants', () => {
    it('should define all required character encodings with correct values', () => {
      // Verify all character encodings are defined
      expect(CharacterEncoding.UTF8).toBe('utf8');
      expect(CharacterEncoding.UTF16).toBe('utf16le');
      expect(CharacterEncoding.ASCII).toBe('ascii');
      expect(CharacterEncoding.LATIN1).toBe('latin1');
      expect(CharacterEncoding.BASE64).toBe('base64');
      expect(CharacterEncoding.HEX).toBe('hex');
      
      // Verify enum completeness
      const expectedEncodings = ['UTF8', 'UTF16', 'ASCII', 'LATIN1', 'BASE64', 'HEX'];
      const actualEncodings = Object.keys(CharacterEncoding).filter(key => isNaN(Number(key)));
      expect(actualEncodings).toEqual(expectedEncodings);
    });

    it('should set the default character encoding to UTF8', () => {
      expect(DEFAULT_CHARACTER_ENCODING).toBe(CharacterEncoding.UTF8);
    });

    it('should define maximum event size with appropriate value', () => {
      expect(MAX_EVENT_SIZE_BYTES).toBe(1024 * 1024); // 1MB
      expect(MAX_EVENT_SIZE_BYTES).toBeGreaterThan(0);
    });

    it('should define default buffer size with appropriate value', () => {
      expect(DEFAULT_BUFFER_SIZE).toBe(16384); // 16KB
      expect(DEFAULT_BUFFER_SIZE).toBeGreaterThan(0);
      expect(DEFAULT_BUFFER_SIZE).toBeLessThan(MAX_EVENT_SIZE_BYTES);
    });
  });

  // -----------------------------------------------------------------------------
  // Compression Constants Tests
  // -----------------------------------------------------------------------------
  describe('Compression Constants', () => {
    it('should define all required compression algorithms with correct values', () => {
      // Verify all compression algorithms are defined
      expect(CompressionAlgorithm.NONE).toBe('none');
      expect(CompressionAlgorithm.GZIP).toBe('gzip');
      expect(CompressionAlgorithm.SNAPPY).toBe('snappy');
      expect(CompressionAlgorithm.LZ4).toBe('lz4');
      expect(CompressionAlgorithm.ZSTD).toBe('zstd');
      
      // Verify enum completeness
      const expectedAlgorithms = ['NONE', 'GZIP', 'SNAPPY', 'LZ4', 'ZSTD'];
      const actualAlgorithms = Object.keys(CompressionAlgorithm).filter(key => isNaN(Number(key)));
      expect(actualAlgorithms).toEqual(expectedAlgorithms);
    });

    it('should set the default compression algorithm to NONE', () => {
      expect(DEFAULT_COMPRESSION_ALGORITHM).toBe(CompressionAlgorithm.NONE);
    });

    it('should define minimum compression size with appropriate value', () => {
      expect(MIN_COMPRESSION_SIZE_BYTES).toBe(1024); // 1KB
      expect(MIN_COMPRESSION_SIZE_BYTES).toBeGreaterThan(0);
      expect(MIN_COMPRESSION_SIZE_BYTES).toBeLessThan(MAX_EVENT_SIZE_BYTES);
    });

    it('should define compression levels for supported algorithms', () => {
      // GZIP compression levels
      expect(COMPRESSION_LEVELS[CompressionAlgorithm.GZIP].MIN).toBe(1);
      expect(COMPRESSION_LEVELS[CompressionAlgorithm.GZIP].DEFAULT).toBe(6);
      expect(COMPRESSION_LEVELS[CompressionAlgorithm.GZIP].MAX).toBe(9);
      
      // ZSTD compression levels
      expect(COMPRESSION_LEVELS[CompressionAlgorithm.ZSTD].MIN).toBe(1);
      expect(COMPRESSION_LEVELS[CompressionAlgorithm.ZSTD].DEFAULT).toBe(3);
      expect(COMPRESSION_LEVELS[CompressionAlgorithm.ZSTD].MAX).toBe(22);
      
      // LZ4 compression levels
      expect(COMPRESSION_LEVELS[CompressionAlgorithm.LZ4].MIN).toBe(0);
      expect(COMPRESSION_LEVELS[CompressionAlgorithm.LZ4].DEFAULT).toBe(1);
      expect(COMPRESSION_LEVELS[CompressionAlgorithm.LZ4].MAX).toBe(16);
      
      // Verify compression levels are in ascending order
      Object.keys(COMPRESSION_LEVELS).forEach(algorithm => {
        const levels = COMPRESSION_LEVELS[algorithm];
        expect(levels.MIN).toBeLessThanOrEqual(levels.DEFAULT);
        expect(levels.DEFAULT).toBeLessThanOrEqual(levels.MAX);
      });
    });

    it('should define default compression levels for all algorithms', () => {
      expect(DEFAULT_COMPRESSION_LEVEL[CompressionAlgorithm.GZIP]).toBe(COMPRESSION_LEVELS[CompressionAlgorithm.GZIP].DEFAULT);
      expect(DEFAULT_COMPRESSION_LEVEL[CompressionAlgorithm.ZSTD]).toBe(COMPRESSION_LEVELS[CompressionAlgorithm.ZSTD].DEFAULT);
      expect(DEFAULT_COMPRESSION_LEVEL[CompressionAlgorithm.LZ4]).toBe(COMPRESSION_LEVELS[CompressionAlgorithm.LZ4].DEFAULT);
      expect(DEFAULT_COMPRESSION_LEVEL[CompressionAlgorithm.SNAPPY]).toBe(0); // Snappy doesn't support levels
      expect(DEFAULT_COMPRESSION_LEVEL[CompressionAlgorithm.NONE]).toBe(0); // No compression
      
      // Verify all algorithms have a default compression level
      Object.values(CompressionAlgorithm).forEach(algorithm => {
        if (typeof algorithm === 'string') {
          expect(DEFAULT_COMPRESSION_LEVEL[algorithm]).toBeDefined();
        }
      });
    });
  });

  // -----------------------------------------------------------------------------
  // Schema Registry Constants Tests
  // -----------------------------------------------------------------------------
  describe('Schema Registry Constants', () => {
    it('should define schema registry URL with correct value', () => {
      expect(SCHEMA_REGISTRY_URL).toBe('http://schema-registry:8081');
    });

    it('should define schema registry authentication settings', () => {
      expect(SCHEMA_REGISTRY_AUTH).toHaveProperty('ENABLED');
      expect(SCHEMA_REGISTRY_AUTH).toHaveProperty('USERNAME');
      expect(SCHEMA_REGISTRY_AUTH).toHaveProperty('PASSWORD');
      expect(typeof SCHEMA_REGISTRY_AUTH.ENABLED).toBe('boolean');
    });

    it('should define all required schema compatibility modes with correct values', () => {
      // Verify all schema compatibility modes are defined
      expect(SchemaCompatibilityMode.NONE).toBe('NONE');
      expect(SchemaCompatibilityMode.FORWARD).toBe('FORWARD');
      expect(SchemaCompatibilityMode.BACKWARD).toBe('BACKWARD');
      expect(SchemaCompatibilityMode.FULL).toBe('FULL');
      expect(SchemaCompatibilityMode.FORWARD_TRANSITIVE).toBe('FORWARD_TRANSITIVE');
      expect(SchemaCompatibilityMode.BACKWARD_TRANSITIVE).toBe('BACKWARD_TRANSITIVE');
      expect(SchemaCompatibilityMode.FULL_TRANSITIVE).toBe('FULL_TRANSITIVE');
      
      // Verify enum completeness
      const expectedModes = [
        'NONE', 'FORWARD', 'BACKWARD', 'FULL',
        'FORWARD_TRANSITIVE', 'BACKWARD_TRANSITIVE', 'FULL_TRANSITIVE'
      ];
      const actualModes = Object.keys(SchemaCompatibilityMode).filter(key => isNaN(Number(key)));
      expect(actualModes).toEqual(expectedModes);
    });

    it('should set the default schema compatibility mode to BACKWARD', () => {
      expect(DEFAULT_SCHEMA_COMPATIBILITY_MODE).toBe(SchemaCompatibilityMode.BACKWARD);
    });

    it('should define all required schema subject naming strategies with correct values', () => {
      // Verify all schema subject naming strategies are defined
      expect(SchemaSubjectNamingStrategy.TOPIC_NAME_STRATEGY)
        .toBe('io.confluent.kafka.serializers.subject.TopicNameStrategy');
      expect(SchemaSubjectNamingStrategy.RECORD_NAME_STRATEGY)
        .toBe('io.confluent.kafka.serializers.subject.RecordNameStrategy');
      expect(SchemaSubjectNamingStrategy.TOPIC_RECORD_NAME_STRATEGY)
        .toBe('io.confluent.kafka.serializers.subject.TopicRecordNameStrategy');
      
      // Verify enum completeness
      const expectedStrategies = [
        'TOPIC_NAME_STRATEGY', 'RECORD_NAME_STRATEGY', 'TOPIC_RECORD_NAME_STRATEGY'
      ];
      const actualStrategies = Object.keys(SchemaSubjectNamingStrategy).filter(key => isNaN(Number(key)));
      expect(actualStrategies).toEqual(expectedStrategies);
    });

    it('should set the default schema subject naming strategy to TOPIC_NAME_STRATEGY', () => {
      expect(DEFAULT_SCHEMA_SUBJECT_NAMING_STRATEGY).toBe(SchemaSubjectNamingStrategy.TOPIC_NAME_STRATEGY);
    });
  });

  // -----------------------------------------------------------------------------
  // Serialization Options Constants Tests
  // -----------------------------------------------------------------------------
  describe('Serialization Options Constants', () => {
    it('should define JSON serialization options with correct properties', () => {
      expect(JSON_SERIALIZATION_OPTIONS).toHaveProperty('PRETTY_PRINT');
      expect(JSON_SERIALIZATION_OPTIONS).toHaveProperty('INDENT_SPACES');
      expect(JSON_SERIALIZATION_OPTIONS).toHaveProperty('ESCAPE_NON_ASCII');
      expect(JSON_SERIALIZATION_OPTIONS).toHaveProperty('INCLUDE_NULL_VALUES');
      
      expect(typeof JSON_SERIALIZATION_OPTIONS.PRETTY_PRINT).toBe('boolean');
      expect(typeof JSON_SERIALIZATION_OPTIONS.INDENT_SPACES).toBe('number');
      expect(typeof JSON_SERIALIZATION_OPTIONS.ESCAPE_NON_ASCII).toBe('boolean');
      expect(typeof JSON_SERIALIZATION_OPTIONS.INCLUDE_NULL_VALUES).toBe('boolean');
    });

    it('should define Avro serialization options with correct properties', () => {
      expect(AVRO_SERIALIZATION_OPTIONS).toHaveProperty('USE_CONFLUENT_WIRE_FORMAT');
      expect(AVRO_SERIALIZATION_OPTIONS).toHaveProperty('VALIDATE_SCHEMA');
      expect(AVRO_SERIALIZATION_OPTIONS).toHaveProperty('INCLUDE_SCHEMA_FINGERPRINT');
      
      expect(typeof AVRO_SERIALIZATION_OPTIONS.USE_CONFLUENT_WIRE_FORMAT).toBe('boolean');
      expect(typeof AVRO_SERIALIZATION_OPTIONS.VALIDATE_SCHEMA).toBe('boolean');
      expect(typeof AVRO_SERIALIZATION_OPTIONS.INCLUDE_SCHEMA_FINGERPRINT).toBe('boolean');
    });

    it('should define Protocol Buffers serialization options with correct properties', () => {
      expect(PROTOBUF_SERIALIZATION_OPTIONS).toHaveProperty('USE_CONFLUENT_WIRE_FORMAT');
      expect(PROTOBUF_SERIALIZATION_OPTIONS).toHaveProperty('VALIDATE_SCHEMA');
      expect(PROTOBUF_SERIALIZATION_OPTIONS).toHaveProperty('USE_BINARY_FORMAT');
      
      expect(typeof PROTOBUF_SERIALIZATION_OPTIONS.USE_CONFLUENT_WIRE_FORMAT).toBe('boolean');
      expect(typeof PROTOBUF_SERIALIZATION_OPTIONS.VALIDATE_SCHEMA).toBe('boolean');
      expect(typeof PROTOBUF_SERIALIZATION_OPTIONS.USE_BINARY_FORMAT).toBe('boolean');
    });

    it('should define MessagePack serialization options with correct properties', () => {
      expect(MSGPACK_SERIALIZATION_OPTIONS).toHaveProperty('SORT_KEYS');
      expect(MSGPACK_SERIALIZATION_OPTIONS).toHaveProperty('SERIALIZE_UNDEFINED_AS_NULL');
      expect(MSGPACK_SERIALIZATION_OPTIONS).toHaveProperty('USE_TIMESTAMP_EXTENSION');
      
      expect(typeof MSGPACK_SERIALIZATION_OPTIONS.SORT_KEYS).toBe('boolean');
      expect(typeof MSGPACK_SERIALIZATION_OPTIONS.SERIALIZE_UNDEFINED_AS_NULL).toBe('boolean');
      expect(typeof MSGPACK_SERIALIZATION_OPTIONS.USE_TIMESTAMP_EXTENSION).toBe('boolean');
    });

    it('should define CBOR serialization options with correct properties', () => {
      expect(CBOR_SERIALIZATION_OPTIONS).toHaveProperty('SORT_KEYS');
      expect(CBOR_SERIALIZATION_OPTIONS).toHaveProperty('USE_DATE_TIME_TAG');
      expect(CBOR_SERIALIZATION_OPTIONS).toHaveProperty('USE_UNDEFINED_TAG');
      
      expect(typeof CBOR_SERIALIZATION_OPTIONS.SORT_KEYS).toBe('boolean');
      expect(typeof CBOR_SERIALIZATION_OPTIONS.USE_DATE_TIME_TAG).toBe('boolean');
      expect(typeof CBOR_SERIALIZATION_OPTIONS.USE_UNDEFINED_TAG).toBe('boolean');
    });
  });

  // -----------------------------------------------------------------------------
  // Content Type Constants Tests
  // -----------------------------------------------------------------------------
  describe('Content Type Constants', () => {
    it('should define content type header with correct value', () => {
      expect(CONTENT_TYPE_HEADER).toBe('content-type');
    });

    it('should define content encoding header with correct value', () => {
      expect(CONTENT_ENCODING_HEADER).toBe('content-encoding');
    });

    it('should define schema version header with correct value', () => {
      expect(SCHEMA_VERSION_HEADER).toBe('schema-version');
    });

    it('should map compression algorithms to correct content encoding values', () => {
      expect(COMPRESSION_CONTENT_ENCODINGS[CompressionAlgorithm.NONE]).toBe('');
      expect(COMPRESSION_CONTENT_ENCODINGS[CompressionAlgorithm.GZIP]).toBe('gzip');
      expect(COMPRESSION_CONTENT_ENCODINGS[CompressionAlgorithm.SNAPPY]).toBe('snappy');
      expect(COMPRESSION_CONTENT_ENCODINGS[CompressionAlgorithm.LZ4]).toBe('lz4');
      expect(COMPRESSION_CONTENT_ENCODINGS[CompressionAlgorithm.ZSTD]).toBe('zstd');
      
      // Verify all algorithms have a content encoding mapping
      Object.values(CompressionAlgorithm).forEach(algorithm => {
        if (typeof algorithm === 'string') {
          expect(COMPRESSION_CONTENT_ENCODINGS[algorithm]).toBeDefined();
        }
      });
    });

    it('should set the default content type to match the default serialization format', () => {
      expect(DEFAULT_CONTENT_TYPE).toBe(SERIALIZATION_CONTENT_TYPES[DEFAULT_SERIALIZATION_FORMAT]);
    });
  });

  // -----------------------------------------------------------------------------
  // Serialization Error Constants Tests
  // -----------------------------------------------------------------------------
  describe('Serialization Error Constants', () => {
    it('should define maximum serialization error cache size with appropriate value', () => {
      expect(MAX_SERIALIZATION_ERROR_CACHE_SIZE).toBe(100);
      expect(MAX_SERIALIZATION_ERROR_CACHE_SIZE).toBeGreaterThan(0);
    });

    it('should define serialization error cache TTL with appropriate value', () => {
      expect(SERIALIZATION_ERROR_CACHE_TTL_MS).toBe(60 * 60 * 1000); // 1 hour
      expect(SERIALIZATION_ERROR_CACHE_TTL_MS).toBeGreaterThan(0);
    });

    it('should define payload inclusion in error reports setting', () => {
      expect(typeof INCLUDE_PAYLOAD_IN_ERROR_REPORTS).toBe('boolean');
    });

    it('should define maximum error payload excerpt length with appropriate value', () => {
      expect(MAX_ERROR_PAYLOAD_EXCERPT_LENGTH).toBe(1000);
      expect(MAX_ERROR_PAYLOAD_EXCERPT_LENGTH).toBeGreaterThan(0);
    });
  });
});