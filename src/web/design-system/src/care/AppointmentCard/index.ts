/**
 * AppointmentCard Component
 * 
 * A component that displays appointment information in a card format for the Care journey.
 * 
 * @example
 * // Web usage
 * import { AppointmentCard } from '@austa/design-system/care/AppointmentCard';
 * import type { AppointmentCardProps } from '@austa/interfaces/care';
 * 
 * const MyComponent = () => {
 *   const appointmentData = { /* ... */ };
 *   const providerData = { /* ... */ };
 *   
 *   return (
 *     <AppointmentCard
 *       appointment={appointmentData}
 *       provider={providerData}
 *       onViewDetails={() => console.log('View details')}
 *     />
 *   );
 * };
 * 
 * @example
 * // React Native usage
 * import { AppointmentCard } from '@austa/design-system/care/AppointmentCard';
 * import type { AppointmentCardProps } from '@austa/interfaces/care';
 * 
 * const MyScreen = () => {
 *   const appointmentData = { /* ... */ };
 *   const providerData = { /* ... */ };
 *   
 *   return (
 *     <AppointmentCard
 *       appointment={appointmentData}
 *       provider={providerData}
 *       onJoinTelemedicine={() => navigation.navigate('Telemedicine')}
 *       testID="appointment-card"
 *     />
 *   );
 * };
 */

// Only export the component itself, interfaces are now in @austa/interfaces/care
export { AppointmentCard } from './AppointmentCard';