/**
 * @module rewards/interfaces
 * 
 * This module exports all interfaces and types related to rewards in the gamification system.
 * These types provide consistent data structures for reward management, tracking, and events.
 * 
 * The interfaces in this module are organized into logical groups:
 * - Core interfaces: Basic reward data structures
 * - Service interfaces: Contracts for reward-related services
 * - Request/Response interfaces: DTOs for API endpoints
 * - Event interfaces: Payloads for reward-related events
 */

// Import from @austa/interfaces for type-safe models
import '@austa/interfaces';

// Core interfaces
export * from './reward-request.interface';
export * from './reward-response.interface';

// Service interfaces
export * from './reward-service.interface';

// Event interfaces
export * from './reward-event.interface';