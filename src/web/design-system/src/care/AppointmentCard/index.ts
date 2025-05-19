/**
 * AppointmentCard Component
 * 
 * A component that displays appointment information in a card format for the Care journey.
 * 
 * @example Web Usage
 * ```tsx
 * import { AppointmentCard } from '@austa/design-system/care/AppointmentCard';
 * import { Appointment, Provider } from '@austa/interfaces/care';
 * 
 * const MyComponent = () => {
 *   const appointment: Appointment = { ... };
 *   const provider: Provider = { ... };
 *   
 *   return (
 *     <AppointmentCard
 *       appointment={appointment}
 *       provider={provider}
 *       onViewDetails={() => console.log('View details')}
 *       onReschedule={() => console.log('Reschedule')}
 *       onCancel={() => console.log('Cancel')}
 *     />
 *   );
 * };
 * ```
 * 
 * @example Mobile Usage
 * ```tsx
 * import { AppointmentCard } from '@austa/design-system/care/AppointmentCard';
 * import { Appointment, Provider } from '@austa/interfaces/care';
 * 
 * const MyScreen = () => {
 *   const appointment: Appointment = { ... };
 *   const provider: Provider = { ... };
 *   
 *   return (
 *     <AppointmentCard
 *       appointment={appointment}
 *       provider={provider}
 *       onViewDetails={() => navigation.navigate('AppointmentDetails', { id: appointment.id })}
 *       onJoinTelemedicine={() => navigation.navigate('TelemedicineSession', { id: appointment.id })}
 *       testID="appointment-card"
 *     />
 *   );
 * };
 * ```
 */
export { AppointmentCard } from './AppointmentCard';