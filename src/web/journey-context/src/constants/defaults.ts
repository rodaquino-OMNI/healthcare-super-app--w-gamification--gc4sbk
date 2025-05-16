/**
 * Default configurations and fallback values for journey state management
 * in the AUSTA SuperApp. These defaults ensure consistent behavior across
 * platforms when no explicit journey is selected or when initializing new
 * user sessions.
 */

/**
 * Default journey ID to use when no journey is explicitly selected
 * This ensures a consistent starting point across platforms
 */
export const DEFAULT_JOURNEY_ID = 'HEALTH';

/**
 * Fallback journey ID to use if the selected journey is invalid
 * This provides a safety mechanism to prevent UI errors
 */
export const FALLBACK_JOURNEY_ID = 'HEALTH';

/**
 * Preferred order for displaying journeys in navigation and selection UI
 * This standardizes the presentation across platforms
 */
export const JOURNEY_DISPLAY_ORDER = ['HEALTH', 'CARE', 'PLAN'];

/**
 * Default initialization parameters for journey context providers
 * These ensure consistent behavior when creating new journey contexts
 */
export const JOURNEY_PROVIDER_DEFAULTS = {
  /**
   * Whether to persist journey selection in storage
   */
  persistSelection: true,
  
  /**
   * Storage key for persisting journey selection
   */
  storageKey: 'austa_selected_journey',
  
  /**
   * Whether to restore the last selected journey on initialization
   */
  restoreLastSelected: true,
  
  /**
   * Whether to validate journey IDs against available journeys
   */
  validateJourneyId: true,
};

/**
 * Default journey theme mapping
 * Maps journey IDs to their corresponding theme names
 */
export const DEFAULT_JOURNEY_THEMES = {
  HEALTH: 'healthTheme',
  CARE: 'careTheme',
  PLAN: 'planTheme',
};

/**
 * Default journey icon mapping
 * Maps journey IDs to their corresponding icon names
 */
export const DEFAULT_JOURNEY_ICONS = {
  HEALTH: 'health',
  CARE: 'care',
  PLAN: 'plan',
};

/**
 * Default journey display names
 * Provides human-readable names for each journey
 */
export const DEFAULT_JOURNEY_NAMES = {
  HEALTH: 'Minha Saúde',
  CARE: 'Cuidar-me Agora',
  PLAN: 'Meu Plano & Benefícios',
};

/**
 * Default journey route mapping
 * Maps journey IDs to their corresponding root routes
 */
export const DEFAULT_JOURNEY_ROUTES = {
  HEALTH: '/health',
  CARE: '/care',
  PLAN: '/plan',
};