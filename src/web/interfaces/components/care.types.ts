/**
 * @file Care Component Types
 * @description Defines TypeScript interfaces for Care journey-specific UI components in the AUSTA SuperApp.
 * These interfaces provide strongly-typed props for Care journey components, ensuring consistency
 * between component implementation and usage across web and mobile platforms.
 */

// Import types from the shared interfaces package
import { Appointment, Medication, TelemedicineSession, TreatmentPlan } from '@austa/interfaces/care';

/**
 * Common props shared across all Care journey components
 */
export interface CareComponentBaseProps {
  /**
   * Optional className for custom styling
   */
  className?: string;
  
  /**
   * Optional test ID for testing
   */
  testID?: string;
  
  /**
   * Optional theme override for the component
   */
  themeOverride?: Record<string, any>;
}

/**
 * Props for the AppointmentCard component that displays a single appointment.
 */
export interface AppointmentCardProps extends CareComponentBaseProps {
  /**
   * The appointment data to display
   */
  appointment: Appointment;
  
  /**
   * Optional custom title to override the default
   */
  title?: string;
  
  /**
   * Whether to show the provider information
   * @default true
   */
  showProvider?: boolean;
  
  /**
   * Whether to show the location information
   * @default true
   */
  showLocation?: boolean;
  
  /**
   * Optional handler for when the card is clicked
   */
  onClick?: () => void;
  
  /**
   * Optional handler for when the reschedule button is clicked
   */
  onReschedule?: () => void;
  
  /**
   * Optional handler for when the cancel button is clicked
   */
  onCancel?: () => void;
  
  /**
   * Optional handler for when the check-in button is clicked
   */
  onCheckIn?: () => void;
  
  /**
   * Optional handler for when the start telemedicine button is clicked
   */
  onStartTelemedicine?: () => void;
  
  /**
   * Whether the appointment is a telemedicine appointment
   * @default false
   */
  isTelemedicine?: boolean;
  
  /**
   * Whether the appointment can be checked in
   * @default false
   */
  canCheckIn?: boolean;
  
  /**
   * Optional theme variant for the card
   * @default 'default'
   */
  variant?: 'default' | 'compact' | 'detailed' | 'upcoming';
}

/**
 * Props for the MedicationCard component that displays a single medication.
 */
export interface MedicationCardProps extends CareComponentBaseProps {
  /**
   * The medication data to display
   */
  medication: Medication;
  
  /**
   * Optional custom title to override the default
   */
  title?: string;
  
  /**
   * Whether to show the dosage information
   * @default true
   */
  showDosage?: boolean;
  
  /**
   * Whether to show the schedule information
   * @default true
   */
  showSchedule?: boolean;
  
  /**
   * Whether to show the refill information
   * @default true
   */
  showRefill?: boolean;
  
  /**
   * Optional handler for when the card is clicked
   */
  onClick?: () => void;
  
  /**
   * Optional handler for when the refill button is clicked
   */
  onRefill?: () => void;
  
  /**
   * Optional handler for when the set reminder button is clicked
   */
  onSetReminder?: () => void;
  
  /**
   * Optional handler for when the view details button is clicked
   */
  onViewDetails?: () => void;
  
  /**
   * Whether the medication needs a refill
   * @default false
   */
  needsRefill?: boolean;
  
  /**
   * Optional theme variant for the card
   * @default 'default'
   */
  variant?: 'default' | 'compact' | 'detailed' | 'reminder';
}

/**
 * Props for the ProviderCard component that displays a healthcare provider.
 */
export interface ProviderCardProps extends CareComponentBaseProps {
  /**
   * The provider data to display
   */
  provider: {
    id: string;
    name: string;
    specialty: string;
    imageUrl?: string;
    rating?: number;
    location?: string;
    availableDates?: Date[];
    acceptsInsurance?: boolean;
    telemedicineAvailable?: boolean;
  };
  
  /**
   * Optional custom title to override the default
   */
  title?: string;
  
  /**
   * Whether to show the rating information
   * @default true
   */
  showRating?: boolean;
  
  /**
   * Whether to show the location information
   * @default true
   */
  showLocation?: boolean;
  
  /**
   * Whether to show the availability information
   * @default false
   */
  showAvailability?: boolean;
  
  /**
   * Optional handler for when the card is clicked
   */
  onClick?: () => void;
  
  /**
   * Optional handler for when the book appointment button is clicked
   */
  onBookAppointment?: () => void;
  
  /**
   * Optional handler for when the view profile button is clicked
   */
  onViewProfile?: () => void;
  
  /**
   * Whether the provider is currently selected
   * @default false
   */
  isSelected?: boolean;
  
  /**
   * Optional theme variant for the card
   * @default 'default'
   */
  variant?: 'default' | 'compact' | 'detailed' | 'search';
}

/**
 * Props for the SymptomSelector component that allows users to select symptoms.
 */
export interface SymptomSelectorProps extends CareComponentBaseProps {
  /**
   * List of available symptoms to select from
   */
  availableSymptoms: Array<{
    id: string;
    name: string;
    category?: string;
    severity?: 'mild' | 'moderate' | 'severe';
  }>;
  
  /**
   * Currently selected symptoms
   */
  selectedSymptoms: string[];
  
  /**
   * Handler for when symptoms are selected or deselected
   */
  onSymptomToggle: (symptomId: string, selected: boolean) => void;
  
  /**
   * Optional handler for when the severity of a symptom is changed
   */
  onSeverityChange?: (symptomId: string, severity: 'mild' | 'moderate' | 'severe') => void;
  
  /**
   * Optional handler for when the submit button is clicked
   */
  onSubmit?: () => void;
  
  /**
   * Optional handler for when the clear button is clicked
   */
  onClear?: () => void;
  
  /**
   * Whether to group symptoms by category
   * @default false
   */
  groupByCategory?: boolean;
  
  /**
   * Whether to show severity selection
   * @default true
   */
  showSeverity?: boolean;
  
  /**
   * Whether the component is in a loading state
   * @default false
   */
  isLoading?: boolean;
  
  /**
   * Optional error message to display
   */
  error?: string;
  
  /**
   * Maximum number of symptoms that can be selected
   */
  maxSelections?: number;
  
  /**
   * Optional theme variant for the selector
   * @default 'default'
   */
  variant?: 'default' | 'compact' | 'detailed' | 'body-map';
}

/**
 * Props for the VideoConsultation component that provides telemedicine functionality.
 */
export interface VideoConsultationProps extends CareComponentBaseProps {
  /**
   * The telemedicine session data
   */
  session: TelemedicineSession;
  
  /**
   * Handler for when the session ends
   */
  onSessionEnd: () => void;
  
  /**
   * Optional handler for when the camera is toggled
   */
  onToggleCamera?: (enabled: boolean) => void;
  
  /**
   * Optional handler for when the microphone is toggled
   */
  onToggleMicrophone?: (enabled: boolean) => void;
  
  /**
   * Optional handler for when the chat is toggled
   */
  onToggleChat?: (visible: boolean) => void;
  
  /**
   * Optional handler for when a message is sent in the chat
   */
  onSendMessage?: (message: string) => void;
  
  /**
   * Optional handler for when the screen is shared
   */
  onShareScreen?: (sharing: boolean) => void;
  
  /**
   * Whether the local camera is enabled
   * @default true
   */
  cameraEnabled?: boolean;
  
  /**
   * Whether the local microphone is enabled
   * @default true
   */
  microphoneEnabled?: boolean;
  
  /**
   * Whether the chat panel is visible
   * @default false
   */
  chatVisible?: boolean;
  
  /**
   * Whether screen sharing is active
   * @default false
   */
  screenSharing?: boolean;
  
  /**
   * Whether the session is currently connecting
   * @default false
   */
  isConnecting?: boolean;
  
  /**
   * Whether the session has encountered an error
   * @default false
   */
  hasError?: boolean;
  
  /**
   * Optional error message to display
   */
  errorMessage?: string;
  
  /**
   * Chat messages for the session
   */
  chatMessages?: Array<{
    id: string;
    sender: 'patient' | 'provider';
    text: string;
    timestamp: Date;
  }>;
  
  /**
   * Optional theme variant for the video consultation
   * @default 'default'
   */
  variant?: 'default' | 'compact' | 'fullscreen';
}

/**
 * Props for the TreatmentPlanCard component that displays a treatment plan.
 */
export interface TreatmentPlanCardProps extends CareComponentBaseProps {
  /**
   * The treatment plan data to display
   */
  treatmentPlan: TreatmentPlan;
  
  /**
   * Optional custom title to override the default
   */
  title?: string;
  
  /**
   * Whether to show the progress information
   * @default true
   */
  showProgress?: boolean;
  
  /**
   * Whether to show the provider information
   * @default true
   */
  showProvider?: boolean;
  
  /**
   * Optional handler for when the card is clicked
   */
  onClick?: () => void;
  
  /**
   * Optional handler for when the view details button is clicked
   */
  onViewDetails?: () => void;
  
  /**
   * Optional handler for when a treatment item is marked as completed
   */
  onMarkCompleted?: (itemId: string, completed: boolean) => void;
  
  /**
   * Optional handler for when the contact provider button is clicked
   */
  onContactProvider?: () => void;
  
  /**
   * Whether to show individual treatment items
   * @default false
   */
  showItems?: boolean;
  
  /**
   * Optional theme variant for the card
   * @default 'default'
   */
  variant?: 'default' | 'compact' | 'detailed' | 'progress';
}