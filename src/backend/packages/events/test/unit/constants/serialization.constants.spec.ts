import { describe, it, expect } from 'jest';
import {
  SERIALIZATION_FORMATS,
  ENCODING_OPTIONS,
  COMPRESSION_SETTINGS,
  SCHEMA_REGISTRY_CONFIG,
  CONTENT_TYPE_IDENTIFIERS
} from '../../../src/constants/serialization.constants';

describe('Serialization Constants', () => {
  describe('SERIALIZATION_FORMATS', () => {
    it('should define JSON format correctly', () => {
      expect(SERIALIZATION_FORMATS.JSON).toBeDefined();
      expect(SERIALIZATION_FORMATS.JSON.id).toBe('json');
      expect(SERIALIZATION_FORMATS.JSON.version).toBe('1.0');
      expect(SERIALIZATION_FORMATS.JSON.description).toContain('human-readable');
    });

    it('should define Avro format correctly', () => {
      expect(SERIALIZATION_FORMATS.AVRO).toBeDefined();
      expect(SERIALIZATION_FORMATS.AVRO.id).toBe('avro');
      expect(SERIALIZATION_FORMATS.AVRO.version).toBe('1.11.1');
      expect(SERIALIZATION_FORMATS.AVRO.description).toContain('binary');
    });

    it('should define Protocol Buffers format correctly', () => {
      expect(SERIALIZATION_FORMATS.PROTOBUF).toBeDefined();
      expect(SERIALIZATION_FORMATS.PROTOBUF.id).toBe('protobuf');
      expect(SERIALIZATION_FORMATS.PROTOBUF.version).toBe('3.21.12');
      expect(SERIALIZATION_FORMATS.PROTOBUF.description).toContain('binary');
    });

    it('should have the correct number of serialization formats', () => {
      // This test ensures that if a new format is added, tests are updated
      expect(Object.keys(SERIALIZATION_FORMATS)).toHaveLength(3);
    });
  });

  describe('ENCODING_OPTIONS', () => {
    it('should define UTF-8 encoding correctly', () => {
      expect(ENCODING_OPTIONS.UTF_8).toBeDefined();
      expect(ENCODING_OPTIONS.UTF_8.id).toBe('utf8');
      expect(ENCODING_OPTIONS.UTF_8.description).toContain('Unicode');
    });

    it('should define ISO-8859-1 encoding correctly', () => {
      expect(ENCODING_OPTIONS.ISO_8859_1).toBeDefined();
      expect(ENCODING_OPTIONS.ISO_8859_1.id).toBe('iso8859-1');
      expect(ENCODING_OPTIONS.ISO_8859_1.description).toContain('Latin');
    });

    it('should define binary encoding options correctly', () => {
      expect(ENCODING_OPTIONS.BINARY).toBeDefined();
      expect(ENCODING_OPTIONS.BINARY.id).toBe('binary');
      expect(ENCODING_OPTIONS.BINARY.description).toContain('raw');
    });

    it('should define endianness options correctly', () => {
      expect(ENCODING_OPTIONS.BIG_ENDIAN).toBeDefined();
      expect(ENCODING_OPTIONS.BIG_ENDIAN.id).toBe('big-endian');
      expect(ENCODING_OPTIONS.BIG_ENDIAN.description).toContain('network byte order');

      expect(ENCODING_OPTIONS.LITTLE_ENDIAN).toBeDefined();
      expect(ENCODING_OPTIONS.LITTLE_ENDIAN.id).toBe('little-endian');
      expect(ENCODING_OPTIONS.LITTLE_ENDIAN.description).toContain('reverse byte order');
    });

    it('should have the correct number of encoding options', () => {
      // This test ensures that if a new encoding option is added, tests are updated
      expect(Object.keys(ENCODING_OPTIONS)).toHaveLength(5);
    });
  });

  describe('COMPRESSION_SETTINGS', () => {
    it('should define GZIP compression correctly', () => {
      expect(COMPRESSION_SETTINGS.GZIP).toBeDefined();
      expect(COMPRESSION_SETTINGS.GZIP.id).toBe('gzip');
      expect(COMPRESSION_SETTINGS.GZIP.compressionLevel).toBeGreaterThan(0);
      expect(COMPRESSION_SETTINGS.GZIP.description).toContain('general-purpose');
    });

    it('should define Snappy compression correctly', () => {
      expect(COMPRESSION_SETTINGS.SNAPPY).toBeDefined();
      expect(COMPRESSION_SETTINGS.SNAPPY.id).toBe('snappy');
      expect(COMPRESSION_SETTINGS.SNAPPY.description).toContain('fast');
    });

    it('should define LZ4 compression correctly', () => {
      expect(COMPRESSION_SETTINGS.LZ4).toBeDefined();
      expect(COMPRESSION_SETTINGS.LZ4.id).toBe('lz4');
      expect(COMPRESSION_SETTINGS.LZ4.description).toContain('high-speed');
    });

    it('should define Zstandard compression correctly', () => {
      expect(COMPRESSION_SETTINGS.ZSTD).toBeDefined();
      expect(COMPRESSION_SETTINGS.ZSTD.id).toBe('zstd');
      expect(COMPRESSION_SETTINGS.ZSTD.compressionLevel).toBeGreaterThan(0);
      expect(COMPRESSION_SETTINGS.ZSTD.description).toContain('high compression ratio');
    });

    it('should define compression threshold correctly', () => {
      expect(COMPRESSION_SETTINGS.THRESHOLD).toBeDefined();
      expect(COMPRESSION_SETTINGS.THRESHOLD.bytes).toBeGreaterThan(0);
      expect(COMPRESSION_SETTINGS.THRESHOLD.description).toContain('minimum size');
    });

    it('should have the correct number of compression settings', () => {
      // This test ensures that if a new compression setting is added, tests are updated
      expect(Object.keys(COMPRESSION_SETTINGS)).toHaveLength(5);
    });
  });

  describe('SCHEMA_REGISTRY_CONFIG', () => {
    it('should define schema registry URL correctly', () => {
      expect(SCHEMA_REGISTRY_CONFIG.URL).toBeDefined();
      expect(SCHEMA_REGISTRY_CONFIG.URL.default).toContain('http');
      expect(SCHEMA_REGISTRY_CONFIG.URL.description).toContain('Schema Registry');
    });

    it('should define schema validation settings correctly', () => {
      expect(SCHEMA_REGISTRY_CONFIG.VALIDATION_ENABLED).toBeDefined();
      expect(typeof SCHEMA_REGISTRY_CONFIG.VALIDATION_ENABLED.default).toBe('boolean');
      expect(SCHEMA_REGISTRY_CONFIG.VALIDATION_ENABLED.description).toContain('validation');
    });

    it('should define schema compatibility modes correctly', () => {
      expect(SCHEMA_REGISTRY_CONFIG.COMPATIBILITY_MODES).toBeDefined();
      expect(SCHEMA_REGISTRY_CONFIG.COMPATIBILITY_MODES.BACKWARD).toBe('BACKWARD');
      expect(SCHEMA_REGISTRY_CONFIG.COMPATIBILITY_MODES.FORWARD).toBe('FORWARD');
      expect(SCHEMA_REGISTRY_CONFIG.COMPATIBILITY_MODES.FULL).toBe('FULL');
      expect(SCHEMA_REGISTRY_CONFIG.COMPATIBILITY_MODES.NONE).toBe('NONE');
    });

    it('should define schema caching options correctly', () => {
      expect(SCHEMA_REGISTRY_CONFIG.CACHE_SIZE).toBeDefined();
      expect(SCHEMA_REGISTRY_CONFIG.CACHE_SIZE.default).toBeGreaterThan(0);
      expect(SCHEMA_REGISTRY_CONFIG.CACHE_SIZE.description).toContain('cache');

      expect(SCHEMA_REGISTRY_CONFIG.CACHE_EXPIRY_MS).toBeDefined();
      expect(SCHEMA_REGISTRY_CONFIG.CACHE_EXPIRY_MS.default).toBeGreaterThan(0);
      expect(SCHEMA_REGISTRY_CONFIG.CACHE_EXPIRY_MS.description).toContain('milliseconds');
    });

    it('should have the correct number of schema registry config options', () => {
      // This test ensures that if a new schema registry config option is added, tests are updated
      expect(Object.keys(SCHEMA_REGISTRY_CONFIG)).toHaveLength(5);
    });
  });

  describe('CONTENT_TYPE_IDENTIFIERS', () => {
    it('should define JSON content type correctly', () => {
      expect(CONTENT_TYPE_IDENTIFIERS.JSON).toBeDefined();
      expect(CONTENT_TYPE_IDENTIFIERS.JSON.mimeType).toBe('application/json');
      expect(CONTENT_TYPE_IDENTIFIERS.JSON.description).toContain('JSON');
    });

    it('should define Avro content type correctly', () => {
      expect(CONTENT_TYPE_IDENTIFIERS.AVRO).toBeDefined();
      expect(CONTENT_TYPE_IDENTIFIERS.AVRO.mimeType).toBe('avro/binary');
      expect(CONTENT_TYPE_IDENTIFIERS.AVRO.description).toContain('Avro');
    });

    it('should define Protocol Buffers content type correctly', () => {
      expect(CONTENT_TYPE_IDENTIFIERS.PROTOBUF).toBeDefined();
      expect(CONTENT_TYPE_IDENTIFIERS.PROTOBUF.mimeType).toBe('application/protobuf');
      expect(CONTENT_TYPE_IDENTIFIERS.PROTOBUF.description).toContain('Protocol Buffers');
    });

    it('should define version identifier correctly', () => {
      expect(CONTENT_TYPE_IDENTIFIERS.VERSION_HEADER).toBeDefined();
      expect(CONTENT_TYPE_IDENTIFIERS.VERSION_HEADER.name).toBe('X-Event-Schema-Version');
      expect(CONTENT_TYPE_IDENTIFIERS.VERSION_HEADER.description).toContain('schema version');
    });

    it('should have the correct number of content type identifiers', () => {
      // This test ensures that if a new content type identifier is added, tests are updated
      expect(Object.keys(CONTENT_TYPE_IDENTIFIERS)).toHaveLength(4);
    });
  });
});