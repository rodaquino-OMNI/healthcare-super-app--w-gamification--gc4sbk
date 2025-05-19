// This file serves as a barrel file, exporting all components related to the dashboard.
// It provides a single point of import for dashboard components, simplifying imports throughout the application.

// Export components using relative imports
export { AchievementsWidget } from './AchievementsWidget';
export { AppointmentsWidget } from './AppointmentsWidget';
export { ClaimsWidget } from './ClaimsWidget';
export { MetricsWidget } from './MetricsWidget';
export { RecentActivityWidget } from './RecentActivityWidget';

// Export component types from @austa/interfaces
// These type exports maintain backward compatibility with existing code
export type { AchievementsWidget as AchievementsWidgetType } from '@austa/interfaces/components/gamification.types';
export type { AppointmentsWidget as AppointmentsWidgetType } from '@austa/interfaces/components/care.types';
export type { ClaimsWidget as ClaimsWidgetType } from '@austa/interfaces/components/plan.types';
export type { MetricsWidget as MetricsWidgetType } from '@austa/interfaces/components/health.types';
export type { RecentActivityWidget as RecentActivityWidgetType } from '@austa/interfaces/components/core.types';