import { gql } from '@apollo/client';
import { AppointmentFragment, ProviderFragment, TelemedicineSessionFragment } from '../fragments/care.fragments';
import { AppointmentStatus, AppointmentType } from '@austa/interfaces/care/types';

/**
 * Query to get a list of appointments for a user
 * @param userId - ID of the user whose appointments to retrieve
 * @param status - Optional filter for appointment status
 * @param type - Optional filter for appointment type
 */
export const GET_USER_APPOINTMENTS = gql`
  query GetUserAppointments($userId: ID!, $status: AppointmentStatus, $type: AppointmentType) {
    userAppointments(userId: $userId, status: $status, type: $type) {
      ...AppointmentFragment
      status
      notes
      location
      provider {
        ...ProviderFragment
        phoneNumber
        email
        acceptsNewPatients
        languages
      }
    }
  }
  ${AppointmentFragment}
  ${ProviderFragment}
`;

/**
 * Query to get details for a specific appointment
 * @param appointmentId - ID of the appointment to retrieve
 */
export const GET_APPOINTMENT_DETAILS = gql`
  query GetAppointmentDetails($appointmentId: ID!) {
    appointment(id: $appointmentId) {
      ...AppointmentFragment
      status
      notes
      location
      provider {
        ...ProviderFragment
        phoneNumber
        email
        acceptsNewPatients
        languages
        availableSlots {
          date
          slots
        }
      }
    }
  }
  ${AppointmentFragment}
  ${ProviderFragment}
`;

/**
 * Query to get available appointment slots for a provider
 * @param providerId - ID of the provider
 * @param startDate - Start date for the availability search
 * @param endDate - End date for the availability search
 */
export const GET_PROVIDER_AVAILABILITY = gql`
  query GetProviderAvailability($providerId: ID!, $startDate: Date!, $endDate: Date!) {
    providerAvailability(providerId: $providerId, startDate: $startDate, endDate: $endDate) {
      date
      slots
    }
  }
`;

/**
 * Query to search for healthcare providers
 * @param specialty - Optional filter for provider specialty
 * @param location - Optional filter for provider location
 * @param acceptingNewPatients - Optional filter for providers accepting new patients
 * @param languages - Optional filter for languages spoken by provider
 */
export const SEARCH_PROVIDERS = gql`
  query SearchProviders(
    $specialty: String, 
    $location: String, 
    $acceptingNewPatients: Boolean, 
    $languages: [String]
  ) {
    searchProviders(
      specialty: $specialty, 
      location: $location, 
      acceptingNewPatients: $acceptingNewPatients, 
      languages: $languages
    ) {
      ...ProviderFragment
      phoneNumber
      email
      acceptsNewPatients
      languages
      availableSlots {
        date
        slots
      }
      telemedicineEnabled
      rating
      reviewCount
    }
  }
  ${ProviderFragment}
`;

/**
 * Query to get details for a specific provider
 * @param providerId - ID of the provider to retrieve
 */
export const GET_PROVIDER_DETAILS = gql`
  query GetProviderDetails($providerId: ID!) {
    provider(id: $providerId) {
      ...ProviderFragment
      phoneNumber
      email
      acceptsNewPatients
      languages
      biography
      education
      certifications
      specialties
      insuranceAccepted
      telemedicineEnabled
      officeHours {
        day
        open
        close
      }
      rating
      reviewCount
      reviews {
        id
        userId
        rating
        comment
        date
      }
    }
  }
  ${ProviderFragment}
`;

/**
 * Query to get telemedicine sessions for a user
 * @param userId - ID of the user whose telemedicine sessions to retrieve
 * @param status - Optional filter for session status
 */
export const GET_USER_TELEMEDICINE_SESSIONS = gql`
  query GetUserTelemedicineSessions($userId: ID!, $status: String) {
    userTelemedicineSessions(userId: $userId, status: $status) {
      ...TelemedicineSessionFragment
      appointmentId
      connectionDetails {
        url
        token
        roomName
      }
      provider {
        ...ProviderFragment
        phoneNumber
        email
      }
    }
  }
  ${TelemedicineSessionFragment}
  ${ProviderFragment}
`;

/**
 * Query to get details for a specific telemedicine session
 * @param sessionId - ID of the telemedicine session to retrieve
 */
export const GET_TELEMEDICINE_SESSION_DETAILS = gql`
  query GetTelemedicineSessionDetails($sessionId: ID!) {
    telemedicineSession(id: $sessionId) {
      ...TelemedicineSessionFragment
      appointmentId
      connectionDetails {
        url
        token
        roomName
      }
      provider {
        ...ProviderFragment
        phoneNumber
        email
      }
      notes
      prescriptions {
        id
        name
        dosage
        instructions
        startDate
        endDate
      }
    }
  }
  ${TelemedicineSessionFragment}
  ${ProviderFragment}
`;

/**
 * Query to get medications for a user
 * @param userId - ID of the user whose medications to retrieve
 * @param active - Optional filter for active medications only
 */
export const GET_USER_MEDICATIONS = gql`
  query GetUserMedications($userId: ID!, $active: Boolean) {
    userMedications(userId: $userId, active: $active) {
      id
      name
      dosage
      frequency
      startDate
      endDate
      instructions
      prescribedBy {
        ...ProviderFragment
      }
      reminders {
        id
        time
        enabled
        daysOfWeek
      }
      adherenceRate
      refillReminder
      refillDate
    }
  }
  ${ProviderFragment}
`;

/**
 * Query to get details for a specific medication
 * @param medicationId - ID of the medication to retrieve
 */
export const GET_MEDICATION_DETAILS = gql`
  query GetMedicationDetails($medicationId: ID!) {
    medication(id: $medicationId) {
      id
      name
      dosage
      frequency
      startDate
      endDate
      instructions
      prescribedBy {
        ...ProviderFragment
      }
      reminders {
        id
        time
        enabled
        daysOfWeek
      }
      adherenceRate
      refillReminder
      refillDate
      sideEffects
      interactions
      adherenceHistory {
        date
        taken
        skipped
        notes
      }
    }
  }
  ${ProviderFragment}
`;

/**
 * Query to get treatment plans for a user
 * @param userId - ID of the user whose treatment plans to retrieve
 * @param active - Optional filter for active treatment plans only
 */
export const GET_USER_TREATMENT_PLANS = gql`
  query GetUserTreatmentPlans($userId: ID!, $active: Boolean) {
    userTreatmentPlans(userId: $userId, active: $active) {
      id
      name
      description
      startDate
      endDate
      provider {
        ...ProviderFragment
      }
      condition
      goals
      progress
      activities {
        id
        name
        description
        frequency
        completed
      }
      medications {
        id
        name
        dosage
        frequency
      }
      appointments {
        ...AppointmentFragment
        status
      }
    }
  }
  ${ProviderFragment}
  ${AppointmentFragment}
`;

/**
 * Query to get details for a specific treatment plan
 * @param planId - ID of the treatment plan to retrieve
 */
export const GET_TREATMENT_PLAN_DETAILS = gql`
  query GetTreatmentPlanDetails($planId: ID!) {
    treatmentPlan(id: $planId) {
      id
      name
      description
      startDate
      endDate
      provider {
        ...ProviderFragment
      }
      condition
      goals
      progress
      activities {
        id
        name
        description
        frequency
        completed
        history {
          date
          completed
          notes
        }
      }
      medications {
        id
        name
        dosage
        frequency
        adherenceRate
      }
      appointments {
        ...AppointmentFragment
        status
        notes
      }
      notes
      documents {
        id
        name
        type
        url
        uploadDate
      }
    }
  }
  ${ProviderFragment}
  ${AppointmentFragment}
`;

/**
 * Query to check symptoms and get possible conditions
 * @param symptoms - Array of symptom IDs or descriptions
 * @param userId - Optional ID of the user for personalized results
 */
export const CHECK_SYMPTOMS = gql`
  query CheckSymptoms($symptoms: [String!]!, $userId: ID) {
    checkSymptoms(symptoms: $symptoms, userId: $userId) {
      possibleConditions {
        id
        name
        probability
        description
        urgencyLevel
        recommendedAction
      }
      recommendedProviders {
        ...ProviderFragment
        specialty
        availableSlots {
          date
          slots
        }
      }
      urgencyAssessment {
        level
        message
        seekCareWithin
      }
    }
  }
  ${ProviderFragment}
`;

/**
 * Query to get a list of common symptoms for symptom checker
 * @param searchTerm - Optional search term to filter symptoms
 * @param bodyArea - Optional body area to filter symptoms
 */
export const GET_COMMON_SYMPTOMS = gql`
  query GetCommonSymptoms($searchTerm: String, $bodyArea: String) {
    commonSymptoms(searchTerm: $searchTerm, bodyArea: $bodyArea) {
      id
      name
      description
      bodyArea
      commonlyAssociatedWith {
        conditionId
        conditionName
        frequency
      }
    }
  }
`;