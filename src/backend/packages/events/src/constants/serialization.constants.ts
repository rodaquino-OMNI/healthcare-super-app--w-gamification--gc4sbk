/**
 * Serialization format constants for event processing
 * Defines supported serialization formats, encoding options, compression settings,
 * schema registry configuration, and content type identifiers.
 */

/**
 * Supported serialization formats for event data
 */
export const SERIALIZATION_FORMATS = {
  /**
   * JSON (JavaScript Object Notation) format
   * Human-readable text format that is easy to read and write
   */
  JSON: {
    id: 'json',
    version: '1.0',
    description: 'Human-readable text format for data interchange',
    schemaRequired: false
  },

  /**
   * Apache Avro binary format
   * Compact binary format with schema support
   */
  AVRO: {
    id: 'avro',
    version: '1.11.1',
    description: 'Compact binary format with schema support for efficient storage',
    schemaRequired: true
  },

  /**
   * Protocol Buffers (Protobuf) binary format
   * Efficient binary format developed by Google
   */
  PROTOBUF: {
    id: 'protobuf',
    version: '3.21.12',
    description: 'Efficient binary format with schema support for structured data',
    schemaRequired: true
  }
};

/**
 * Encoding options for serialization
 */
export const ENCODING_OPTIONS = {
  /**
   * UTF-8 character encoding
   * Standard encoding for Unicode text
   */
  UTF_8: {
    id: 'utf8',
    description: 'Unicode Transformation Format 8-bit for text data',
    defaultForText: true
  },

  /**
   * ISO-8859-1 character encoding
   * Latin alphabet encoding
   */
  ISO_8859_1: {
    id: 'iso8859-1',
    description: 'Latin alphabet encoding for legacy systems',
    defaultForText: false
  },

  /**
   * Binary encoding
   * Raw binary data without character encoding
   */
  BINARY: {
    id: 'binary',
    description: 'Raw binary data without character encoding',
    defaultForBinary: true
  },

  /**
   * Big-endian byte order
   * Most significant byte first (network byte order)
   */
  BIG_ENDIAN: {
    id: 'big-endian',
    description: 'Most significant byte first (network byte order)',
    defaultEndianness: true
  },

  /**
   * Little-endian byte order
   * Least significant byte first
   */
  LITTLE_ENDIAN: {
    id: 'little-endian',
    description: 'Least significant byte first (reverse byte order)',
    defaultEndianness: false
  }
};

/**
 * Compression settings for event data
 */
export const COMPRESSION_SETTINGS = {
  /**
   * GZIP compression algorithm
   * General-purpose compression with good balance of speed and compression ratio
   */
  GZIP: {
    id: 'gzip',
    compressionLevel: 6, // Default level (0-9, where 9 is highest compression)
    description: 'General-purpose compression with good balance of speed and compression ratio',
    defaultCompression: true
  },

  /**
   * Snappy compression algorithm
   * Fast compression with moderate compression ratio
   */
  SNAPPY: {
    id: 'snappy',
    description: 'Fast compression with moderate compression ratio, optimized for speed',
    defaultCompression: false
  },

  /**
   * LZ4 compression algorithm
   * Very fast compression with moderate compression ratio
   */
  LZ4: {
    id: 'lz4',
    description: 'High-speed compression with moderate compression ratio',
    defaultCompression: false
  },

  /**
   * Zstandard (zstd) compression algorithm
   * High compression ratio with good performance
   */
  ZSTD: {
    id: 'zstd',
    compressionLevel: 3, // Default level (1-22, where 22 is highest compression)
    description: 'High compression ratio with good performance',
    defaultCompression: false
  },

  /**
   * Compression threshold
   * Minimum size in bytes before compression is applied
   */
  THRESHOLD: {
    bytes: 1024, // 1KB threshold
    description: 'Minimum size in bytes before compression is applied'
  }
};

/**
 * Schema Registry configuration options
 */
export const SCHEMA_REGISTRY_CONFIG = {
  /**
   * Schema Registry URL
   * Default URL for the Schema Registry service
   */
  URL: {
    default: 'http://localhost:8081',
    description: 'URL for the Schema Registry service'
  },

  /**
   * Schema validation setting
   * Whether to validate events against their schemas
   */
  VALIDATION_ENABLED: {
    default: true,
    description: 'Whether to validate events against their schemas'
  },

  /**
   * Schema compatibility modes
   * Defines how schemas can evolve over time
   */
  COMPATIBILITY_MODES: {
    /**
     * Backward compatibility
     * New schema can read data written with old schema
     */
    BACKWARD: 'BACKWARD',

    /**
     * Forward compatibility
     * Old schema can read data written with new schema
     */
    FORWARD: 'FORWARD',

    /**
     * Full compatibility
     * Both backward and forward compatibility
     */
    FULL: 'FULL',

    /**
     * No compatibility checking
     * Schemas can change without restrictions
     */
    NONE: 'NONE'
  },

  /**
   * Schema cache size
   * Maximum number of schemas to cache
   */
  CACHE_SIZE: {
    default: 1000,
    description: 'Maximum number of schemas to cache in memory'
  },

  /**
   * Schema cache expiry time
   * Time in milliseconds before cached schemas expire
   */
  CACHE_EXPIRY_MS: {
    default: 300000, // 5 minutes
    description: 'Time in milliseconds before cached schemas expire'
  }
};

/**
 * Content type identifiers for event data
 */
export const CONTENT_TYPE_IDENTIFIERS = {
  /**
   * JSON content type
   * MIME type for JSON data
   */
  JSON: {
    mimeType: 'application/json',
    description: 'JSON data format'
  },

  /**
   * Avro content type
   * MIME type for Avro binary data
   */
  AVRO: {
    mimeType: 'avro/binary',
    description: 'Avro binary data format'
  },

  /**
   * Protocol Buffers content type
   * MIME type for Protocol Buffers binary data
   */
  PROTOBUF: {
    mimeType: 'application/protobuf',
    description: 'Protocol Buffers binary data format'
  },

  /**
   * Schema version header
   * HTTP header for specifying schema version
   */
  VERSION_HEADER: {
    name: 'X-Event-Schema-Version',
    description: 'HTTP header for specifying schema version'
  }
};