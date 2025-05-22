import {
  SerializationFormat,
  DEFAULT_SERIALIZATION_FORMAT,
  CharacterEncoding,
  DEFAULT_CHARACTER_ENCODING,
  CompressionType,
  DEFAULT_COMPRESSION_TYPE,
  ContentType,
  SERIALIZATION_FORMAT_CONTENT_TYPE_MAP,
  SCHEMA_REGISTRY,
  SerializationErrorCode,
  DEFAULT_SERIALIZATION_OPTIONS,
  BATCH_SERIALIZATION
} from '../../../src/constants/serialization.constants';

describe('Serialization Constants', () => {
  describe('SerializationFormat', () => {
    it('should define the correct serialization formats', () => {
      expect(SerializationFormat.JSON).toBe('json');
      expect(SerializationFormat.AVRO).toBe('avro');
      expect(SerializationFormat.PROTOBUF).toBe('protobuf');
    });

    it('should have exactly 3 serialization formats', () => {
      const formatValues = Object.values(SerializationFormat);
      expect(formatValues.length).toBe(3);
      expect(formatValues).toContain('json');
      expect(formatValues).toContain('avro');
      expect(formatValues).toContain('protobuf');
    });
  });

  describe('DEFAULT_SERIALIZATION_FORMAT', () => {
    it('should set JSON as the default serialization format', () => {
      expect(DEFAULT_SERIALIZATION_FORMAT).toBe(SerializationFormat.JSON);
    });
  });

  describe('CharacterEncoding', () => {
    it('should define the correct character encodings', () => {
      expect(CharacterEncoding.UTF8).toBe('utf8');
      expect(CharacterEncoding.UTF16).toBe('utf16le');
      expect(CharacterEncoding.ASCII).toBe('ascii');
      expect(CharacterEncoding.BINARY).toBe('binary');
    });

    it('should have exactly 4 character encodings', () => {
      const encodingValues = Object.values(CharacterEncoding);
      expect(encodingValues.length).toBe(4);
      expect(encodingValues).toContain('utf8');
      expect(encodingValues).toContain('utf16le');
      expect(encodingValues).toContain('ascii');
      expect(encodingValues).toContain('binary');
    });
  });

  describe('DEFAULT_CHARACTER_ENCODING', () => {
    it('should set UTF8 as the default character encoding', () => {
      expect(DEFAULT_CHARACTER_ENCODING).toBe(CharacterEncoding.UTF8);
    });
  });

  describe('CompressionType', () => {
    it('should define the correct compression types', () => {
      expect(CompressionType.NONE).toBe('none');
      expect(CompressionType.GZIP).toBe('gzip');
      expect(CompressionType.SNAPPY).toBe('snappy');
      expect(CompressionType.LZ4).toBe('lz4');
      expect(CompressionType.ZSTD).toBe('zstd');
    });

    it('should have exactly 5 compression types', () => {
      const compressionValues = Object.values(CompressionType);
      expect(compressionValues.length).toBe(5);
      expect(compressionValues).toContain('none');
      expect(compressionValues).toContain('gzip');
      expect(compressionValues).toContain('snappy');
      expect(compressionValues).toContain('lz4');
      expect(compressionValues).toContain('zstd');
    });
  });

  describe('DEFAULT_COMPRESSION_TYPE', () => {
    it('should set NONE as the default compression type', () => {
      expect(DEFAULT_COMPRESSION_TYPE).toBe(CompressionType.NONE);
    });
  });

  describe('ContentType', () => {
    it('should define the correct content types', () => {
      expect(ContentType.JSON).toBe('application/json');
      expect(ContentType.AVRO).toBe('application/avro');
      expect(ContentType.PROTOBUF).toBe('application/protobuf');
      expect(ContentType.TEXT).toBe('text/plain');
      expect(ContentType.BINARY).toBe('application/octet-stream');
    });

    it('should have exactly 5 content types', () => {
      const contentTypeValues = Object.values(ContentType);
      expect(contentTypeValues.length).toBe(5);
      expect(contentTypeValues).toContain('application/json');
      expect(contentTypeValues).toContain('application/avro');
      expect(contentTypeValues).toContain('application/protobuf');
      expect(contentTypeValues).toContain('text/plain');
      expect(contentTypeValues).toContain('application/octet-stream');
    });
  });

  describe('SERIALIZATION_FORMAT_CONTENT_TYPE_MAP', () => {
    it('should map serialization formats to correct content types', () => {
      expect(SERIALIZATION_FORMAT_CONTENT_TYPE_MAP[SerializationFormat.JSON]).toBe(ContentType.JSON);
      expect(SERIALIZATION_FORMAT_CONTENT_TYPE_MAP[SerializationFormat.AVRO]).toBe(ContentType.AVRO);
      expect(SERIALIZATION_FORMAT_CONTENT_TYPE_MAP[SerializationFormat.PROTOBUF]).toBe(ContentType.PROTOBUF);
    });

    it('should have a mapping for every serialization format', () => {
      const formatKeys = Object.keys(SerializationFormat).filter(key => isNaN(Number(key)));
      const mappedFormats = Object.keys(SERIALIZATION_FORMAT_CONTENT_TYPE_MAP);
      
      expect(mappedFormats.length).toBe(formatKeys.length);
      formatKeys.forEach(format => {
        const formatValue = SerializationFormat[format];
        expect(SERIALIZATION_FORMAT_CONTENT_TYPE_MAP[formatValue]).toBeDefined();
      });
    });
  });

  describe('SCHEMA_REGISTRY', () => {
    it('should define the correct schema registry defaults', () => {
      expect(SCHEMA_REGISTRY.DEFAULT_URL).toBe('http://localhost:8081');
      expect(SCHEMA_REGISTRY.DEFAULT_TIMEOUT_MS).toBe(5000);
      expect(SCHEMA_REGISTRY.MAX_CACHE_SIZE).toBe(100);
      expect(SCHEMA_REGISTRY.DEFAULT_COMPATIBILITY).toBe('BACKWARD');
    });

    it('should define the correct compatibility modes', () => {
      expect(SCHEMA_REGISTRY.COMPATIBILITY_MODES.BACKWARD).toBe('BACKWARD');
      expect(SCHEMA_REGISTRY.COMPATIBILITY_MODES.FORWARD).toBe('FORWARD');
      expect(SCHEMA_REGISTRY.COMPATIBILITY_MODES.FULL).toBe('FULL');
      expect(SCHEMA_REGISTRY.COMPATIBILITY_MODES.NONE).toBe('NONE');
    });

    it('should have exactly 4 compatibility modes', () => {
      const compatibilityModes = Object.values(SCHEMA_REGISTRY.COMPATIBILITY_MODES);
      expect(compatibilityModes.length).toBe(4);
      expect(compatibilityModes).toContain('BACKWARD');
      expect(compatibilityModes).toContain('FORWARD');
      expect(compatibilityModes).toContain('FULL');
      expect(compatibilityModes).toContain('NONE');
    });
  });

  describe('SerializationErrorCode', () => {
    it('should define the correct error codes', () => {
      expect(SerializationErrorCode.SERIALIZATION_FAILED).toBe('SERIALIZATION_001');
      expect(SerializationErrorCode.DESERIALIZATION_FAILED).toBe('SERIALIZATION_002');
      expect(SerializationErrorCode.SCHEMA_VALIDATION_FAILED).toBe('SERIALIZATION_003');
      expect(SerializationErrorCode.COMPRESSION_FAILED).toBe('SERIALIZATION_004');
      expect(SerializationErrorCode.DECOMPRESSION_FAILED).toBe('SERIALIZATION_005');
      expect(SerializationErrorCode.SCHEMA_REGISTRY_CONNECTION_FAILED).toBe('SERIALIZATION_006');
      expect(SerializationErrorCode.SCHEMA_NOT_FOUND).toBe('SERIALIZATION_007');
      expect(SerializationErrorCode.UNSUPPORTED_FORMAT).toBe('SERIALIZATION_008');
      expect(SerializationErrorCode.UNSUPPORTED_COMPRESSION).toBe('SERIALIZATION_009');
    });

    it('should have error codes with the correct prefix', () => {
      const errorCodes = Object.values(SerializationErrorCode);
      errorCodes.forEach(code => {
        expect(code).toMatch(/^SERIALIZATION_\d{3}$/);
      });
    });

    it('should have sequential error codes', () => {
      const errorCodes = Object.values(SerializationErrorCode);
      const numericParts = errorCodes
        .map(code => parseInt(code.split('_')[1]))
        .sort((a, b) => a - b);
      
      for (let i = 0; i < numericParts.length; i++) {
        expect(numericParts[i]).toBe(i + 1);
      }
    });
  });

  describe('DEFAULT_SERIALIZATION_OPTIONS', () => {
    it('should set the correct default serialization options', () => {
      expect(DEFAULT_SERIALIZATION_OPTIONS.format).toBe(DEFAULT_SERIALIZATION_FORMAT);
      expect(DEFAULT_SERIALIZATION_OPTIONS.encoding).toBe(DEFAULT_CHARACTER_ENCODING);
      expect(DEFAULT_SERIALIZATION_OPTIONS.compression).toBe(DEFAULT_COMPRESSION_TYPE);
      expect(DEFAULT_SERIALIZATION_OPTIONS.validateSchema).toBe(true);
      expect(DEFAULT_SERIALIZATION_OPTIONS.schemaRegistryUrl).toBe(SCHEMA_REGISTRY.DEFAULT_URL);
      expect(DEFAULT_SERIALIZATION_OPTIONS.formatOptions).toEqual({});
    });
  });

  describe('BATCH_SERIALIZATION', () => {
    it('should define the correct batch serialization limits', () => {
      expect(BATCH_SERIALIZATION.MAX_BATCH_SIZE_BYTES).toBe(1000000); // 1MB
      expect(BATCH_SERIALIZATION.DEFAULT_BATCH_SIZE_BYTES).toBe(16384); // 16KB
      expect(BATCH_SERIALIZATION.MAX_BATCH_MESSAGE_COUNT).toBe(500);
      expect(BATCH_SERIALIZATION.DEFAULT_BATCH_MESSAGE_COUNT).toBe(100);
      expect(BATCH_SERIALIZATION.MAX_LINGER_MS).toBe(1000); // 1 second
      expect(BATCH_SERIALIZATION.DEFAULT_LINGER_MS).toBe(5); // 5 milliseconds
    });

    it('should have default values that are less than or equal to maximum values', () => {
      expect(BATCH_SERIALIZATION.DEFAULT_BATCH_SIZE_BYTES).toBeLessThanOrEqual(BATCH_SERIALIZATION.MAX_BATCH_SIZE_BYTES);
      expect(BATCH_SERIALIZATION.DEFAULT_BATCH_MESSAGE_COUNT).toBeLessThanOrEqual(BATCH_SERIALIZATION.MAX_BATCH_MESSAGE_COUNT);
      expect(BATCH_SERIALIZATION.DEFAULT_LINGER_MS).toBeLessThanOrEqual(BATCH_SERIALIZATION.MAX_LINGER_MS);
    });
  });
});