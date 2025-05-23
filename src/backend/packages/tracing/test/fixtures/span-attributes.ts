/**
 * Test fixtures for span attributes used in tracing tests.
 * 
 * These fixtures provide standardized attribute sets for different journeys and operation types,
 * ensuring consistent testing of attribute management in traces.
 */

/**
 * Common attributes that should be present in all spans
 */
export const commonAttributes = {
  'service.name': 'austa-service',
  'service.version': '1.0.0',
  'deployment.environment': 'test',
};

/**
 * Journey-specific attributes for the Health journey
 */
export const healthJourneyAttributes = {
  'journey.name': 'health',
  'journey.display_name': 'Minha Saúde',
  'journey.context': 'health-monitoring',
};

/**
 * Journey-specific attributes for the Care journey
 */
export const careJourneyAttributes = {
  'journey.name': 'care',
  'journey.display_name': 'Cuidar-me Agora',
  'journey.context': 'care-services',
};

/**
 * Journey-specific attributes for the Plan journey
 */
export const planJourneyAttributes = {
  'journey.name': 'plan',
  'journey.display_name': 'Meu Plano & Benefícios',
  'journey.context': 'insurance-management',
};

/**
 * HTTP request attributes for tracing HTTP operations
 */
export const httpAttributes = {
  'http.method': 'GET',
  'http.url': 'https://api.austa.health/v1/resource',
  'http.status_code': 200,
  'http.flavor': '1.1',
  'http.user_agent': 'AUSTA-SuperApp/1.0',
  'net.peer.name': 'api.austa.health',
  'net.peer.port': 443,
};

/**
 * Database operation attributes for tracing database interactions
 */
export const dbAttributes = {
  'db.system': 'postgresql',
  'db.name': 'austa_db',
  'db.user': 'austa_service',
  'db.operation': 'SELECT',
  'db.statement': 'SELECT * FROM users WHERE id = $1',
  'db.connection_string': 'postgresql://localhost:5432/austa_db',
};

/**
 * Message processing attributes for tracing messaging operations
 */
export const messagingAttributes = {
  'messaging.system': 'kafka',
  'messaging.destination': 'austa.events',
  'messaging.destination_kind': 'topic',
  'messaging.operation': 'process',
  'messaging.message_id': '1234567890',
  'messaging.conversation_id': 'conv-123456',
};

/**
 * Health journey specific business attributes for health monitoring operations
 */
export const healthBusinessAttributes = {
  'business.operation': 'health_metric_recording',
  'business.entity_type': 'health_metric',
  'business.entity_id': 'metric-123',
  'business.user_id': 'user-123',
  'business.device_id': 'device-456',
  'business.metric_type': 'blood_pressure',
};

/**
 * Care journey specific business attributes for care operations
 */
export const careBusinessAttributes = {
  'business.operation': 'appointment_booking',
  'business.entity_type': 'appointment',
  'business.entity_id': 'appt-123',
  'business.user_id': 'user-123',
  'business.provider_id': 'provider-456',
  'business.specialty': 'cardiology',
};

/**
 * Plan journey specific business attributes for insurance operations
 */
export const planBusinessAttributes = {
  'business.operation': 'claim_submission',
  'business.entity_type': 'claim',
  'business.entity_id': 'claim-123',
  'business.user_id': 'user-123',
  'business.plan_id': 'plan-456',
  'business.claim_type': 'medical',
};

/**
 * Gamification attributes for tracking gamification events
 */
export const gamificationAttributes = {
  'gamification.event_type': 'achievement_unlocked',
  'gamification.achievement_id': 'achievement-123',
  'gamification.points_awarded': 100,
  'gamification.level': 3,
  'gamification.journey_source': 'health', // The journey that triggered the gamification event
};

/**
 * Helper function to combine multiple attribute sets
 * 
 * @param attributeSets - Array of attribute objects to combine
 * @returns Combined attributes object
 */
export function combineAttributes(...attributeSets: Record<string, any>[]): Record<string, any> {
  return Object.assign({}, ...attributeSets);
}

/**
 * Creates a complete set of attributes for a health journey HTTP operation
 * 
 * @param additionalAttributes - Optional additional attributes to include
 * @returns Combined attributes for health journey HTTP operation
 */
export function createHealthHttpAttributes(additionalAttributes: Record<string, any> = {}): Record<string, any> {
  return combineAttributes(
    commonAttributes,
    healthJourneyAttributes,
    httpAttributes,
    additionalAttributes
  );
}

/**
 * Creates a complete set of attributes for a care journey HTTP operation
 * 
 * @param additionalAttributes - Optional additional attributes to include
 * @returns Combined attributes for care journey HTTP operation
 */
export function createCareHttpAttributes(additionalAttributes: Record<string, any> = {}): Record<string, any> {
  return combineAttributes(
    commonAttributes,
    careJourneyAttributes,
    httpAttributes,
    additionalAttributes
  );
}

/**
 * Creates a complete set of attributes for a plan journey HTTP operation
 * 
 * @param additionalAttributes - Optional additional attributes to include
 * @returns Combined attributes for plan journey HTTP operation
 */
export function createPlanHttpAttributes(additionalAttributes: Record<string, any> = {}): Record<string, any> {
  return combineAttributes(
    commonAttributes,
    planJourneyAttributes,
    httpAttributes,
    additionalAttributes
  );
}

/**
 * Creates a complete set of attributes for a health journey database operation
 * 
 * @param additionalAttributes - Optional additional attributes to include
 * @returns Combined attributes for health journey database operation
 */
export function createHealthDbAttributes(additionalAttributes: Record<string, any> = {}): Record<string, any> {
  return combineAttributes(
    commonAttributes,
    healthJourneyAttributes,
    dbAttributes,
    additionalAttributes
  );
}

/**
 * Creates a complete set of attributes for a care journey database operation
 * 
 * @param additionalAttributes - Optional additional attributes to include
 * @returns Combined attributes for care journey database operation
 */
export function createCareDbAttributes(additionalAttributes: Record<string, any> = {}): Record<string, any> {
  return combineAttributes(
    commonAttributes,
    careJourneyAttributes,
    dbAttributes,
    additionalAttributes
  );
}

/**
 * Creates a complete set of attributes for a plan journey database operation
 * 
 * @param additionalAttributes - Optional additional attributes to include
 * @returns Combined attributes for plan journey database operation
 */
export function createPlanDbAttributes(additionalAttributes: Record<string, any> = {}): Record<string, any> {
  return combineAttributes(
    commonAttributes,
    planJourneyAttributes,
    dbAttributes,
    additionalAttributes
  );
}

/**
 * Creates a complete set of attributes for a health journey messaging operation
 * 
 * @param additionalAttributes - Optional additional attributes to include
 * @returns Combined attributes for health journey messaging operation
 */
export function createHealthMessagingAttributes(additionalAttributes: Record<string, any> = {}): Record<string, any> {
  return combineAttributes(
    commonAttributes,
    healthJourneyAttributes,
    messagingAttributes,
    additionalAttributes
  );
}

/**
 * Creates a complete set of attributes for a care journey messaging operation
 * 
 * @param additionalAttributes - Optional additional attributes to include
 * @returns Combined attributes for care journey messaging operation
 */
export function createCareMessagingAttributes(additionalAttributes: Record<string, any> = {}): Record<string, any> {
  return combineAttributes(
    commonAttributes,
    careJourneyAttributes,
    messagingAttributes,
    additionalAttributes
  );
}

/**
 * Creates a complete set of attributes for a plan journey messaging operation
 * 
 * @param additionalAttributes - Optional additional attributes to include
 * @returns Combined attributes for plan journey messaging operation
 */
export function createPlanMessagingAttributes(additionalAttributes: Record<string, any> = {}): Record<string, any> {
  return combineAttributes(
    commonAttributes,
    planJourneyAttributes,
    messagingAttributes,
    additionalAttributes
  );
}

/**
 * Creates a complete set of attributes for a health journey business operation
 * 
 * @param additionalAttributes - Optional additional attributes to include
 * @returns Combined attributes for health journey business operation
 */
export function createHealthBusinessAttributes(additionalAttributes: Record<string, any> = {}): Record<string, any> {
  return combineAttributes(
    commonAttributes,
    healthJourneyAttributes,
    healthBusinessAttributes,
    additionalAttributes
  );
}

/**
 * Creates a complete set of attributes for a care journey business operation
 * 
 * @param additionalAttributes - Optional additional attributes to include
 * @returns Combined attributes for care journey business operation
 */
export function createCareBusinessAttributes(additionalAttributes: Record<string, any> = {}): Record<string, any> {
  return combineAttributes(
    commonAttributes,
    careJourneyAttributes,
    careBusinessAttributes,
    additionalAttributes
  );
}

/**
 * Creates a complete set of attributes for a plan journey business operation
 * 
 * @param additionalAttributes - Optional additional attributes to include
 * @returns Combined attributes for plan journey business operation
 */
export function createPlanBusinessAttributes(additionalAttributes: Record<string, any> = {}): Record<string, any> {
  return combineAttributes(
    commonAttributes,
    planJourneyAttributes,
    planBusinessAttributes,
    additionalAttributes
  );
}

/**
 * Creates a complete set of attributes for a gamification operation
 * 
 * @param journeyAttributes - Journey attributes to associate with the gamification event
 * @param additionalAttributes - Optional additional attributes to include
 * @returns Combined attributes for gamification operation
 */
export function createGamificationAttributes(
  journeyAttributes: Record<string, any>,
  additionalAttributes: Record<string, any> = {}
): Record<string, any> {
  return combineAttributes(
    commonAttributes,
    journeyAttributes,
    gamificationAttributes,
    additionalAttributes
  );
}