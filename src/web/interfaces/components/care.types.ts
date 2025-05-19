/**
 * @file care.types.ts
 * @description TypeScript interfaces for Care journey-specific UI components in the AUSTA SuperApp.
 * These interfaces provide strongly-typed props for Care journey components, ensuring consistency
 * between component implementation and usage across web and mobile platforms while integrating
 * with the Care journey data models.
 *
 * Part of the @austa/interfaces package that houses all shared TypeScript definitions
 * and type contracts used across the design system and applications.
 */

import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle, TextStyle } from 'react-native';

// Import domain models from the shared types
import type { 
  Appointment, 
  Medication, 
  TelemedicineSession, 
  TreatmentPlan,
  Provider
} from '@austa/interfaces/care';

/**
 * Common props shared across all Care journey components
 */
export interface CareComponentBaseProps {
  /** Optional style overrides for the component container */
  style?: StyleProp<ViewStyle>;
  /** Optional test ID for component testing */
  testID?: string;
  /** Optional accessibility label for screen readers */
  accessibilityLabel?: string;
}

/**
 * Props for the AppointmentCard component that displays appointment details
 * with status indicators and action buttons.
 */
export interface AppointmentCardProps extends CareComponentBaseProps {
  /** The appointment to display */
  appointment: Appointment;
  /** Size variant for the card */
  size?: 'small' | 'medium' | 'large';
  /** Whether to show the provider information */
  showProvider?: boolean;
  /** Whether to show the appointment notes */
  showNotes?: boolean;
  /** Whether to show action buttons */
  showActions?: boolean;
  /** Callback when the card is pressed */
  onPress?: (appointment: Appointment) => void;
  /** Callback when the reschedule button is pressed */
  onReschedule?: (appointment: Appointment) => void;
  /** Callback when the cancel button is pressed */
  onCancel?: (appointment: Appointment) => void;
  /** Callback when the check-in button is pressed */
  onCheckIn?: (appointment: Appointment) => void;
  /** Callback when the join video call button is pressed */
  onJoinVideoCall?: (appointment: Appointment) => void;
  /** Optional style for the card container */
  cardStyle?: StyleProp<ViewStyle>;
  /** Optional style for the title text */
  titleStyle?: StyleProp<TextStyle>;
  /** Optional style for the description text */
  descriptionStyle?: StyleProp<TextStyle>;
  /** Optional style for the status indicator */
  statusStyle?: StyleProp<ViewStyle>;
  /** Whether the appointment is in the past */
  isPast?: boolean;
  /** Time remaining until the appointment (in minutes) */
  timeRemaining?: number;
}

/**
 * Props for the MedicationCard component that displays medication details
 * with dosage instructions and reminder settings.
 */
export interface MedicationCardProps extends CareComponentBaseProps {
  /** The medication to display */
  medication: Medication;
  /** Size variant for the card */
  size?: 'small' | 'medium' | 'large';
  /** Whether to show the medication schedule */
  showSchedule?: boolean;
  /** Whether to show the medication notes */
  showNotes?: boolean;
  /** Whether to show adherence tracking */
  showAdherence?: boolean;
  /** Callback when the card is pressed */
  onPress?: (medication: Medication) => void;
  /** Callback when the take medication button is pressed */
  onTakeMedication?: (medication: Medication) => void;
  /** Callback when the skip dose button is pressed */
  onSkipDose?: (medication: Medication) => void;
  /** Callback when the refill button is pressed */
  onRefill?: (medication: Medication) => void;
  /** Optional style for the card container */
  cardStyle?: StyleProp<ViewStyle>;
  /** Optional style for the title text */
  titleStyle?: StyleProp<TextStyle>;
  /** Optional style for the description text */
  descriptionStyle?: StyleProp<TextStyle>;
  /** Whether the next dose is due soon */
  isDueSoon?: boolean;
  /** Time remaining until next dose (in minutes) */
  timeToNextDose?: number;
}

/**
 * Props for the ProviderCard component that displays healthcare provider
 * information with specialty and availability indicators.
 */
export interface ProviderCardProps extends CareComponentBaseProps {
  /** The provider to display */
  provider: Provider;
  /** Size variant for the card */
  size?: 'small' | 'medium' | 'large';
  /** Whether to show the provider's availability */
  showAvailability?: boolean;
  /** Whether to show the provider's ratings */
  showRatings?: boolean;
  /** Whether to show the provider's specialties */
  showSpecialties?: boolean;
  /** Callback when the card is pressed */
  onPress?: (provider: Provider) => void;
  /** Callback when the book appointment button is pressed */
  onBookAppointment?: (provider: Provider) => void;
  /** Callback when the view profile button is pressed */
  onViewProfile?: (provider: Provider) => void;
  /** Callback when the message button is pressed */
  onMessage?: (provider: Provider) => void;
  /** Optional style for the card container */
  cardStyle?: StyleProp<ViewStyle>;
  /** Optional style for the name text */
  nameStyle?: StyleProp<TextStyle>;
  /** Optional style for the specialty text */
  specialtyStyle?: StyleProp<TextStyle>;
  /** Optional style for the avatar */
  avatarStyle?: StyleProp<ViewStyle>;
  /** Whether the provider is currently available for telemedicine */
  isAvailableNow?: boolean;
  /** Whether the provider is a favorite */
  isFavorite?: boolean;
  /** Callback when the favorite button is pressed */
  onToggleFavorite?: (provider: Provider, isFavorite: boolean) => void;
}

/**
 * Props for the SymptomSelector component that allows users to select
 * and track symptoms with severity indicators.
 */
export interface SymptomSelectorProps extends CareComponentBaseProps {
  /** List of available symptoms to select from */
  availableSymptoms: Symptom[];
  /** Currently selected symptoms */
  selectedSymptoms: SelectedSymptom[];
  /** Callback when a symptom is selected */
  onSymptomSelect: (symptom: Symptom, severity: SymptomSeverity) => void;
  /** Callback when a symptom is deselected */
  onSymptomDeselect: (symptomId: string) => void;
  /** Whether multiple symptoms can be selected */
  multiSelect?: boolean;
  /** Whether to show the severity selector */
  showSeverity?: boolean;
  /** Whether to show the symptom description */
  showDescription?: boolean;
  /** Whether the component is in a loading state */
  isLoading?: boolean;
  /** Error message if symptom loading failed */
  error?: string;
  /** Optional style for the selector container */
  selectorStyle?: StyleProp<ViewStyle>;
  /** Optional style for the symptom item */
  symptomItemStyle?: StyleProp<ViewStyle>;
  /** Optional style for the symptom text */
  symptomTextStyle?: StyleProp<TextStyle>;
  /** Optional style for the severity selector */
  severitySelectorStyle?: StyleProp<ViewStyle>;
  /** Maximum number of symptoms that can be selected */
  maxSelections?: number;
}

/**
 * Symptom data structure for the SymptomSelector component
 */
export interface Symptom {
  /** Unique identifier for the symptom */
  id: string;
  /** Display name of the symptom */
  name: string;
  /** Optional description of the symptom */
  description?: string;
  /** Optional icon for the symptom */
  icon?: string;
  /** Optional category for grouping symptoms */
  category?: string;
}

/**
 * Selected symptom with severity information
 */
export interface SelectedSymptom extends Symptom {
  /** Severity level of the symptom */
  severity: SymptomSeverity;
  /** When the symptom was selected/recorded */
  timestamp: Date;
}

/**
 * Severity levels for symptoms
 */
export enum SymptomSeverity {
  MILD = 'mild',
  MODERATE = 'moderate',
  SEVERE = 'severe'
}

/**
 * Props for the VideoConsultation component that provides telemedicine
 * functionality with video, audio, and chat capabilities.
 */
export interface VideoConsultationProps extends CareComponentBaseProps {
  /** The telemedicine session for this consultation */
  session: TelemedicineSession;
  /** The appointment associated with this consultation */
  appointment?: Appointment;
  /** Whether the local video is enabled */
  isVideoEnabled: boolean;
  /** Whether the local audio is enabled */
  isAudioEnabled: boolean;
  /** Whether the session is currently connecting */
  isConnecting: boolean;
  /** Whether the session is currently active */
  isSessionActive: boolean;
  /** Callback when the video toggle button is pressed */
  onToggleVideo: () => void;
  /** Callback when the audio toggle button is pressed */
  onToggleAudio: () => void;
  /** Callback when the end call button is pressed */
  onEndCall: () => void;
  /** Callback when the flip camera button is pressed */
  onFlipCamera?: () => void;
  /** Callback when the chat toggle button is pressed */
  onToggleChat?: () => void;
  /** Callback when the session connection status changes */
  onConnectionStatusChange?: (status: ConnectionStatus) => void;
  /** Callback when a participant joins the session */
  onParticipantJoined?: (participantId: string) => void;
  /** Callback when a participant leaves the session */
  onParticipantLeft?: (participantId: string) => void;
  /** Whether to show the chat panel */
  showChat?: boolean;
  /** Whether to show the appointment details */
  showAppointmentDetails?: boolean;
  /** Whether to show the timer */
  showTimer?: boolean;
  /** Optional style for the video container */
  videoContainerStyle?: StyleProp<ViewStyle>;
  /** Optional style for the controls container */
  controlsStyle?: StyleProp<ViewStyle>;
  /** Optional style for the local video */
  localVideoStyle?: StyleProp<ViewStyle>;
  /** Optional style for the remote video */
  remoteVideoStyle?: StyleProp<ViewStyle>;
  /** Optional custom render function for the local video */
  renderLocalVideo?: () => ReactNode;
  /** Optional custom render function for the remote video */
  renderRemoteVideo?: () => ReactNode;
  /** Optional custom render function for the controls */
  renderControls?: () => ReactNode;
  /** Optional custom render function for the chat */
  renderChat?: () => ReactNode;
}

/**
 * Connection status for video consultations
 */
export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  FAILED = 'failed'
}