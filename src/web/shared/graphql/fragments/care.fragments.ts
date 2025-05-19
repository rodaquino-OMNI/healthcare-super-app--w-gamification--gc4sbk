import { gql } from '@apollo/client'; // v3.8.10 - Used to define GraphQL fragments
import type { Appointment, Provider, TelemedicineSession } from '@austa/interfaces/care';

/**
 * Fragment containing common fields for Appointment type
 * Used in queries and mutations related to appointment booking and management
 * @type {import('@apollo/client').DocumentNode}
 */
export const AppointmentFragment = gql`
  fragment AppointmentFragment on Appointment {
    id
    providerId
    dateTime
    type
    reason
  }
`;

/**
 * Fragment containing common fields for Provider type
 * Used in queries related to healthcare providers
 * @type {import('@apollo/client').DocumentNode}
 */
export const ProviderFragment = gql`
  fragment ProviderFragment on Provider {
    id
    name
    specialty
    location
  }
`;

/**
 * Fragment containing common fields for TelemedicineSession type
 * Used in queries and mutations related to telemedicine functionality
 * @type {import('@apollo/client').DocumentNode}
 */
export const TelemedicineSessionFragment = gql`
  fragment TelemedicineSessionFragment on TelemedicineSession {
    id
    providerId
    startTime
    endTime
    status
  }
`;