/**
 * @austa/logging
 * 
 * Comprehensive logging package for the AUSTA SuperApp backend services.
 * Provides structured logging with context enrichment, distributed tracing correlation,
 * and support for multiple transports and formatters.
 */

// Core components
export { LoggerModule } from './src/logger.module';
export { LoggerService } from './src/logger.service';

// Interfaces
export {
  Logger,
  LoggerConfig,
  LogLevel,
  LogEntry,
  Transport,
  Formatter
} from './src/interfaces';

// Context
export {
  LoggingContext,
  RequestContext,
  UserContext,
  JourneyContext,
  ContextManager,
  JourneyType
} from './src/context';

// Formatters
export {
  JsonFormatter,
  TextFormatter,
  CloudWatchFormatter
} from './src/formatters';

// Transports
export {
  ConsoleTransport,
  FileTransport,
  CloudWatchTransport,
  TransportFactory
} from './src/transports';

// Utilities
export {
  formatError,
  formatObject,
  sanitizeData,
  createContext,
  extractTraceId,
  getLogLevel,
  isLevelEnabled
} from './src/utils';