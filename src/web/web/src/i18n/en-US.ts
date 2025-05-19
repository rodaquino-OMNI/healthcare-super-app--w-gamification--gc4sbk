// English (US) translations for the AUSTA SuperApp
// This file contains all text strings used throughout the application
// organized by feature areas and journeys.

import { 
  JourneyType, 
  NotificationType,
  HealthMetricType,
  HealthGoalStatus,
  DeviceConnectionStatus,
  AppointmentStatus,
  AppointmentType,
  MedicationFrequency,
  TreatmentPlanStatus,
  ClaimStatus,
  CoverageType,
  BenefitEligibilityStatus,
  AchievementStatus,
  QuestStatus,
  RewardStatus
} from '@austa/interfaces';

/**
 * Common translation strings used throughout the application
 */
interface CommonTranslations {
  yes: string;
  no: string;
  ok: string;
  cancel: string;
  save: string;
  delete: string;
  edit: string;
  back: string;
  next: string;
  submit: string;
  loading: string;
  search: string;
  filter: string;
  sort: string;
  view: string;
  close: string;
  confirm: string;
  error: string;
  success: string;
  warning: string;
  info: string;
  required: string;
  optional: string;
  today: string;
  yesterday: string;
  tomorrow: string;
  days: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
  months: {
    january: string;
    february: string;
    march: string;
    april: string;
    may: string;
    june: string;
    july: string;
    august: string;
    september: string;
    october: string;
    november: string;
    december: string;
  };
}

/**
 * Authentication-related translation strings
 */
interface AuthTranslations {
  login: string;
  logout: string;
  register: string;
  forgotPassword: string;
  resetPassword: string;
  username: string;
  password: string;
  email: string;
  confirmPassword: string;
  newPassword: string;
  currentPassword: string;
  rememberMe: string;
  signIn: string;
  signUp: string;
  createAccount: string;
  alreadyHaveAccount: string;
  dontHaveAccount: string;
  passwordResetSent: string;
  mfa: {
    title: string;
    enterCode: string;
    resendCode: string;
    verifyCode: string;
  };
  biometric: {
    useFingerprint: string;
    useFaceId: string;
    setupBiometric: string;
  };
}

/**
 * Error message translation strings
 */
interface ErrorTranslations {
  required: string;
  invalid_email: string;
  invalid_password: string;
  password_mismatch: string;
  server_error: string;
  connection_error: string;
  unauthorized: string;
  not_found: string;
  validation_error: string;
  session_expired: string;
  unknown_error: string;
}

/**
 * Navigation-related translation strings
 */
interface NavigationTranslations {
  home: string;
  profile: string;
  settings: string;
  notifications: string;
  achievements: string;
  logout: string;
}

/**
 * Health journey translation strings
 */
interface HealthJourneyTranslations {
  title: string;
  dashboard: string;
  metrics: {
    title: string;
    heartRate: string;
    bloodPressure: string;
    bloodGlucose: string;
    steps: string;
    sleep: string;
    weight: string;
    bmi: string;
    addMetric: string;
    viewDetails: string;
    units: {
      bpm: string;
      mmHg: string;
      mgdl: string;
      steps: string;
      hours: string;
      kg: string;
      lbs: string;
    };
    status: {
      normal: string;
      elevated: string;
      high: string;
      low: string;
      critical: string;
    };
  };
  goals: {
    title: string;
    dailySteps: string;
    weeklyExercise: string;
    sleepHours: string;
    weightTarget: string;
    addGoal: string;
    editGoal: string;
    progress: string;
    completed: string;
    inProgress: string;
    notStarted: string;
  };
  history: {
    title: string;
    timeline: string;
    events: string;
    conditions: string;
    medications: string;
    procedures: string;
    vaccinations: string;
    allergies: string;
    viewAll: string;
  };
  devices: {
    title: string;
    connect: string;
    disconnect: string;
    sync: string;
    lastSync: string;
    connected: string;
    disconnected: string;
    syncing: string;
    syncComplete: string;
    syncFailed: string;
  };
}

/**
 * Care journey translation strings
 */
interface CareJourneyTranslations {
  title: string;
  dashboard: string;
  appointments: {
    title: string;
    upcoming: string;
    past: string;
    book: string;
    reschedule: string;
    cancel: string;
    details: string;
    with: string;
    at: string;
    on: string;
    status: {
      scheduled: string;
      confirmed: string;
      completed: string;
      cancelled: string;
      noShow: string;
    };
    type: {
      inPerson: string;
      telemedicine: string;
      homeVisit: string;
    };
  };
  providers: {
    title: string;
    search: string;
    specialty: string;
    location: string;
    availability: string;
    ratings: string;
    distance: string;
    viewProfile: string;
    bookAppointment: string;
  };
  telemedicine: {
    title: string;
    startSession: string;
    joinSession: string;
    endSession: string;
    connecting: string;
    connected: string;
    disconnected: string;
    reconnecting: string;
    waitingForProvider: string;
    providerJoined: string;
    connectionIssues: string;
    enableCamera: string;
    disableCamera: string;
    enableMic: string;
    disableMic: string;
    chat: string;
    shareScreen: string;
  };
  symptomChecker: {
    title: string;
    selectSymptoms: string;
    howLong: string;
    severity: string;
    results: string;
    possibleConditions: string;
    recommendedActions: string;
    disclaimer: string;
    emergency: string;
  };
  medications: {
    title: string;
    current: string;
    past: string;
    addMedication: string;
    editMedication: string;
    removeMedication: string;
    dosage: string;
    frequency: string;
    startDate: string;
    endDate: string;
    instructions: string;
    refill: string;
    refillReminder: string;
    setReminder: string;
    takeMedication: string;
    medicationTaken: string;
    missedDose: string;
  };
  treatmentPlans: {
    title: string;
    active: string;
    completed: string;
    viewPlan: string;
    tasks: string;
    progress: string;
    startDate: string;
    endDate: string;
    provider: string;
    notes: string;
    completeTask: string;
    taskCompleted: string;
  };
}

/**
 * Plan journey translation strings
 */
interface PlanJourneyTranslations {
  title: string;
  dashboard: string;
  coverage: {
    title: string;
    planDetails: string;
    planNumber: string;
    memberSince: string;
    renewalDate: string;
    coverageType: string;
    network: string;
    deductible: string;
    outOfPocketMax: string;
    copay: string;
    coinsurance: string;
    covered: string;
    notCovered: string;
    inNetwork: string;
    outOfNetwork: string;
  };
  digitalCard: {
    title: string;
    front: string;
    back: string;
    memberName: string;
    memberId: string;
    groupNumber: string;
    planType: string;
    issueDate: string;
    customerService: string;
    share: string;
    download: string;
  };
  claims: {
    title: string;
    submit: string;
    history: string;
    details: string;
    claimNumber: string;
    serviceDate: string;
    provider: string;
    serviceType: string;
    amount: string;
    status: {
      submitted: string;
      inReview: string;
      approved: string;
      denied: string;
      moreinfoNeeded: string;
      paid: string;
      appealed: string;
    };
    documents: string;
    uploadDocuments: string;
    additionalInfo: string;
    processingTime: string;
    reimbursement: string;
  };
  costSimulator: {
    title: string;
    selectProcedure: string;
    selectProvider: string;
    estimatedCost: string;
    outOfPocket: string;
    coveredAmount: string;
    disclaimer: string;
    calculate: string;
    results: string;
    breakdown: string;
  };
  benefits: {
    title: string;
    available: string;
    used: string;
    details: string;
    eligibility: string;
    limitations: string;
    howToUse: string;
    expirationDate: string;
    eligible: string;
    notEligible: string;
  };
}

/**
 * Journey-specific translation strings
 */
interface JourneyTranslations {
  health: HealthJourneyTranslations;
  care: CareJourneyTranslations;
  plan: PlanJourneyTranslations;
}

/**
 * Gamification-related translation strings
 */
interface GamificationTranslations {
  level: string;
  xp: string;
  nextLevel: string;
  achievements: {
    title: string;
    unlocked: string;
    progress: string;
    reward: string;
    recent: string;
    all: string;
    locked: string;
    completed: string;
    shareAchievement?: string; // New field for sharing achievements
    achievementUnlocked?: string; // New field for achievement unlocked notification
  };
  quests: {
    title: string;
    active: string;
    completed: string;
    new: string;
    progress: string;
    reward: string;
    timeRemaining: string;
    startQuest: string;
    completeQuest: string;
    questCompleted?: string; // New field for quest completed notification
    questExpiring?: string; // New field for quest expiring notification
  };
  rewards: {
    title: string;
    available: string;
    redeemed: string;
    redeem: string;
    pointsNeeded: string;
    expiresOn: string;
    redeemSuccess: string;
    rewardClaimed?: string; // New field for reward claimed notification
    rewardExpiring?: string; // New field for reward expiring notification
  };
  leaderboard: {
    title: string;
    weekly: string;
    monthly: string;
    allTime: string;
    rank: string;
    user: string;
    score: string;
    yourRank: string;
    leaderboardUpdated?: string; // New field for leaderboard updated notification
    newRanking?: string; // New field for new ranking notification
  };
  // New section for cross-journey events
  crossJourney?: {
    healthQuestCompleted: string;
    careQuestCompleted: string;
    planQuestCompleted: string;
    multiJourneyAchievement: string;
  };
}

/**
 * Profile-related translation strings
 */
interface ProfileTranslations {
  title: string;
  personalInfo: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  emergencyContact: string;
  editProfile: string;
  changePassword: string;
  language: string;
  theme: string;
  notifications: string;
  privacy: string;
  deleteAccount: string;
  logoutAllDevices: string;
}

/**
 * Notification-related translation strings
 */
interface NotificationTranslations {
  title: string;
  all: string;
  unread: string;
  markAsRead: string;
  markAllAsRead: string;
  delete: string;
  deleteAll: string;
  noNotifications: string;
  types: {
    achievement: string;
    appointment: string;
    medication: string;
    claim: string;
    system: string;
  };
  // New section for journey-specific notifications
  journeys?: {
    health: {
      metricAlert: string;
      goalCompleted: string;
      deviceSynced: string;
    };
    care: {
      appointmentReminder: string;
      medicationReminder: string;
      treatmentPlanUpdate: string;
    };
    plan: {
      claimStatusUpdate: string;
      benefitExpiring: string;
      coverageRenewal: string;
    };
  };
}

/**
 * Settings-related translation strings
 */
interface SettingsTranslations {
  title: string;
  account: string;
  appearance: string;
  notifications: string;
  privacy: string;
  language: string;
  theme: {
    title: string;
    light: string;
    dark: string;
    system: string;
  };
  notificationPreferences: {
    title: string;
    push: string;
    email: string;
    sms: string;
    inApp: string;
  };
  privacySettings: {
    title: string;
    dataSharing: string;
    analytics: string;
    marketing: string;
    locationServices: string;
  };
  accessibility: {
    title: string;
    fontSize: string;
    contrast: string;
    reduceMotion: string;
    screenReader: string;
  };
  about: {
    title: string;
    version: string;
    termsOfService: string;
    privacyPolicy: string;
    licenses: string;
    contact: string;
  };
}

/**
 * Complete translations object interface
 */
interface TranslationsObject {
  common: CommonTranslations;
  auth: AuthTranslations;
  errors: ErrorTranslations;
  navigation: NavigationTranslations;
  journeys: JourneyTranslations;
  gamification: GamificationTranslations;
  profile: ProfileTranslations;
  notifications: NotificationTranslations;
  settings: SettingsTranslations;
}

/**
 * English (US) translations for the AUSTA SuperApp
 */
const translations: TranslationsObject = {
  common: {
    yes: 'Yes',
    no: 'No',
    ok: 'OK',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    back: 'Back',
    next: 'Next',
    submit: 'Submit',
    loading: 'Loading...',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    view: 'View',
    close: 'Close',
    confirm: 'Confirm',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Information',
    required: 'Required',
    optional: 'Optional',
    today: 'Today',
    yesterday: 'Yesterday',
    tomorrow: 'Tomorrow',
    days: {
      monday: 'Monday',
      tuesday: 'Tuesday',
      wednesday: 'Wednesday',
      thursday: 'Thursday',
      friday: 'Friday',
      saturday: 'Saturday',
      sunday: 'Sunday'
    },
    months: {
      january: 'January',
      february: 'February',
      march: 'March',
      april: 'April',
      may: 'May',
      june: 'June',
      july: 'July',
      august: 'August',
      september: 'September',
      october: 'October',
      november: 'November',
      december: 'December'
    }
  },
  auth: {
    login: 'Login',
    logout: 'Logout',
    register: 'Register',
    forgotPassword: 'Forgot Password',
    resetPassword: 'Reset Password',
    username: 'Username',
    password: 'Password',
    email: 'Email',
    confirmPassword: 'Confirm Password',
    newPassword: 'New Password',
    currentPassword: 'Current Password',
    rememberMe: 'Remember Me',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    createAccount: 'Create Account',
    alreadyHaveAccount: 'Already have an account?',
    dontHaveAccount: "Don't have an account?",
    passwordResetSent: 'Password reset instructions have been sent to your email',
    mfa: {
      title: 'Two-Factor Authentication',
      enterCode: 'Enter the code sent to your device',
      resendCode: 'Resend Code',
      verifyCode: 'Verify Code'
    },
    biometric: {
      useFingerprint: 'Use Fingerprint',
      useFaceId: 'Use Face ID',
      setupBiometric: 'Setup Biometric Authentication'
    }
  },
  errors: {
    required: 'This field is required',
    invalid_email: 'Invalid email address',
    invalid_password: 'Invalid password',
    password_mismatch: 'Passwords do not match',
    server_error: 'Server error occurred',
    connection_error: 'Connection error',
    unauthorized: 'Unauthorized access',
    not_found: 'Not found',
    validation_error: 'Validation error',
    session_expired: 'Your session has expired, please login again',
    unknown_error: 'An unknown error occurred'
  },
  navigation: {
    home: 'Home',
    profile: 'Profile',
    settings: 'Settings',
    notifications: 'Notifications',
    achievements: 'Achievements',
    logout: 'Logout'
  },
  journeys: {
    health: {
      title: 'My Health',
      dashboard: 'Health Dashboard',
      metrics: {
        title: 'Health Metrics',
        heartRate: 'Heart Rate',
        bloodPressure: 'Blood Pressure',
        bloodGlucose: 'Blood Glucose',
        steps: 'Steps',
        sleep: 'Sleep',
        weight: 'Weight',
        bmi: 'BMI',
        addMetric: 'Add Metric',
        viewDetails: 'View Details',
        units: {
          bpm: 'bpm',
          mmHg: 'mmHg',
          mgdl: 'mg/dL',
          steps: 'steps',
          hours: 'hours',
          kg: 'kg',
          lbs: 'lbs'
        },
        status: {
          normal: 'Normal',
          elevated: 'Elevated',
          high: 'High',
          low: 'Low',
          critical: 'Critical'
        }
      },
      goals: {
        title: 'Health Goals',
        dailySteps: 'Daily Steps',
        weeklyExercise: 'Weekly Exercise',
        sleepHours: 'Sleep Hours',
        weightTarget: 'Weight Target',
        addGoal: 'Add Goal',
        editGoal: 'Edit Goal',
        progress: 'Progress',
        completed: 'Completed',
        inProgress: 'In Progress',
        notStarted: 'Not Started'
      },
      history: {
        title: 'Medical History',
        timeline: 'Timeline',
        events: 'Medical Events',
        conditions: 'Conditions',
        medications: 'Medications',
        procedures: 'Procedures',
        vaccinations: 'Vaccinations',
        allergies: 'Allergies',
        viewAll: 'View All'
      },
      devices: {
        title: 'Connected Devices',
        connect: 'Connect Device',
        disconnect: 'Disconnect',
        sync: 'Sync Now',
        lastSync: 'Last Sync',
        connected: 'Connected',
        disconnected: 'Disconnected',
        syncing: 'Syncing...',
        syncComplete: 'Sync Complete',
        syncFailed: 'Sync Failed'
      }
    },
    care: {
      title: 'Care Now',
      dashboard: 'Care Dashboard',
      appointments: {
        title: 'Appointments',
        upcoming: 'Upcoming Appointments',
        past: 'Past Appointments',
        book: 'Book Appointment',
        reschedule: 'Reschedule',
        cancel: 'Cancel Appointment',
        details: 'Appointment Details',
        with: 'with',
        at: 'at',
        on: 'on',
        status: {
          scheduled: 'Scheduled',
          confirmed: 'Confirmed',
          completed: 'Completed',
          cancelled: 'Cancelled',
          noShow: 'No Show'
        },
        type: {
          inPerson: 'In-Person',
          telemedicine: 'Telemedicine',
          homeVisit: 'Home Visit'
        }
      },
      providers: {
        title: 'Healthcare Providers',
        search: 'Search Providers',
        specialty: 'Specialty',
        location: 'Location',
        availability: 'Availability',
        ratings: 'Ratings',
        distance: 'Distance',
        viewProfile: 'View Profile',
        bookAppointment: 'Book Appointment'
      },
      telemedicine: {
        title: 'Telemedicine',
        startSession: 'Start Session',
        joinSession: 'Join Session',
        endSession: 'End Session',
        connecting: 'Connecting...',
        connected: 'Connected',
        disconnected: 'Disconnected',
        reconnecting: 'Reconnecting...',
        waitingForProvider: 'Waiting for provider to join...',
        providerJoined: 'Provider has joined the session',
        connectionIssues: 'Connection issues detected',
        enableCamera: 'Enable Camera',
        disableCamera: 'Disable Camera',
        enableMic: 'Enable Microphone',
        disableMic: 'Disable Microphone',
        chat: 'Chat',
        shareScreen: 'Share Screen'
      },
      symptomChecker: {
        title: 'Symptom Checker',
        selectSymptoms: 'Select Symptoms',
        howLong: 'How long have you had these symptoms?',
        severity: 'How severe are your symptoms?',
        results: 'Results',
        possibleConditions: 'Possible Conditions',
        recommendedActions: 'Recommended Actions',
        disclaimer: 'This is not a medical diagnosis. Please consult a healthcare professional.',
        emergency: 'If this is an emergency, please call emergency services immediately.'
      },
      medications: {
        title: 'Medications',
        current: 'Current Medications',
        past: 'Past Medications',
        addMedication: 'Add Medication',
        editMedication: 'Edit Medication',
        removeMedication: 'Remove Medication',
        dosage: 'Dosage',
        frequency: 'Frequency',
        startDate: 'Start Date',
        endDate: 'End Date',
        instructions: 'Instructions',
        refill: 'Refill',
        refillReminder: 'Refill Reminder',
        setReminder: 'Set Reminder',
        takeMedication: 'Take Medication',
        medicationTaken: 'Medication Taken',
        missedDose: 'Missed Dose'
      },
      treatmentPlans: {
        title: 'Treatment Plans',
        active: 'Active Plans',
        completed: 'Completed Plans',
        viewPlan: 'View Plan',
        tasks: 'Tasks',
        progress: 'Progress',
        startDate: 'Start Date',
        endDate: 'End Date',
        provider: 'Provider',
        notes: 'Notes',
        completeTask: 'Complete Task',
        taskCompleted: 'Task Completed'
      }
    },
    plan: {
      title: 'My Plan & Benefits',
      dashboard: 'Plan Dashboard',
      coverage: {
        title: 'Coverage Information',
        planDetails: 'Plan Details',
        planNumber: 'Plan Number',
        memberSince: 'Member Since',
        renewalDate: 'Renewal Date',
        coverageType: 'Coverage Type',
        network: 'Network',
        deductible: 'Deductible',
        outOfPocketMax: 'Out-of-Pocket Maximum',
        copay: 'Copay',
        coinsurance: 'Coinsurance',
        covered: 'Covered',
        notCovered: 'Not Covered',
        inNetwork: 'In-Network',
        outOfNetwork: 'Out-of-Network'
      },
      digitalCard: {
        title: 'Digital Insurance Card',
        front: 'Front',
        back: 'Back',
        memberName: 'Member Name',
        memberId: 'Member ID',
        groupNumber: 'Group Number',
        planType: 'Plan Type',
        issueDate: 'Issue Date',
        customerService: 'Customer Service',
        share: 'Share Card',
        download: 'Download Card'
      },
      claims: {
        title: 'Claims',
        submit: 'Submit Claim',
        history: 'Claim History',
        details: 'Claim Details',
        claimNumber: 'Claim Number',
        serviceDate: 'Service Date',
        provider: 'Provider',
        serviceType: 'Service Type',
        amount: 'Amount',
        status: {
          submitted: 'Submitted',
          inReview: 'In Review',
          approved: 'Approved',
          denied: 'Denied',
          moreinfoNeeded: 'More Information Needed',
          paid: 'Paid',
          appealed: 'Appealed'
        },
        documents: 'Documents',
        uploadDocuments: 'Upload Documents',
        additionalInfo: 'Additional Information',
        processingTime: 'Estimated Processing Time',
        reimbursement: 'Estimated Reimbursement'
      },
      costSimulator: {
        title: 'Cost Simulator',
        selectProcedure: 'Select Procedure',
        selectProvider: 'Select Provider',
        estimatedCost: 'Estimated Cost',
        outOfPocket: 'Your Estimated Out-of-Pocket',
        coveredAmount: 'Covered Amount',
        disclaimer: 'This is an estimate only. Actual costs may vary.',
        calculate: 'Calculate',
        results: 'Results',
        breakdown: 'Cost Breakdown'
      },
      benefits: {
        title: 'Benefits',
        available: 'Available Benefits',
        used: 'Used Benefits',
        details: 'Benefit Details',
        eligibility: 'Eligibility',
        limitations: 'Limitations',
        howToUse: 'How to Use',
        expirationDate: 'Expiration Date',
        eligible: 'Eligible',
        notEligible: 'Not Eligible'
      }
    }
  },
  gamification: {
    level: 'Level {{level}}',
    xp: '{{value}} XP',
    nextLevel: 'Next Level: {{xp}} XP needed',
    achievements: {
      title: 'Achievements',
      unlocked: 'Achievement Unlocked!',
      progress: 'Progress: {{value}}/{{total}}',
      reward: 'Reward: {{reward}}',
      recent: 'Recent Achievements',
      all: 'All Achievements',
      locked: 'Locked Achievements',
      completed: 'Completed Achievements',
      shareAchievement: 'Share Achievement',
      achievementUnlocked: 'Congratulations! You unlocked a new achievement'
    },
    quests: {
      title: 'Quests',
      active: 'Active Quests',
      completed: 'Completed Quests',
      new: 'New Quest Available!',
      progress: 'Progress: {{value}}/{{total}}',
      reward: 'Reward: {{reward}}',
      timeRemaining: 'Time Remaining: {{time}}',
      startQuest: 'Start Quest',
      completeQuest: 'Complete Quest',
      questCompleted: 'Quest completed! Claim your reward',
      questExpiring: 'Quest expiring soon! Complete it before time runs out'
    },
    rewards: {
      title: 'Rewards',
      available: 'Available Rewards',
      redeemed: 'Redeemed Rewards',
      redeem: 'Redeem',
      pointsNeeded: '{{points}} points needed',
      expiresOn: 'Expires on {{date}}',
      redeemSuccess: 'Reward successfully redeemed!',
      rewardClaimed: 'Reward claimed successfully',
      rewardExpiring: 'Your reward is expiring soon'
    },
    leaderboard: {
      title: 'Leaderboard',
      weekly: 'Weekly',
      monthly: 'Monthly',
      allTime: 'All Time',
      rank: 'Rank',
      user: 'User',
      score: 'Score',
      yourRank: 'Your Rank',
      leaderboardUpdated: 'Leaderboard has been updated',
      newRanking: 'Congratulations! Your ranking has improved'
    },
    crossJourney: {
      healthQuestCompleted: 'Health journey quest completed',
      careQuestCompleted: 'Care journey quest completed',
      planQuestCompleted: 'Plan journey quest completed',
      multiJourneyAchievement: 'Multi-journey achievement unlocked!'
    }
  },
  profile: {
    title: 'Profile',
    personalInfo: 'Personal Information',
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    dateOfBirth: 'Date of Birth',
    gender: 'Gender',
    address: 'Address',
    emergencyContact: 'Emergency Contact',
    editProfile: 'Edit Profile',
    changePassword: 'Change Password',
    language: 'Language',
    theme: 'Theme',
    notifications: 'Notifications',
    privacy: 'Privacy',
    deleteAccount: 'Delete Account',
    logoutAllDevices: 'Logout from all devices'
  },
  notifications: {
    title: 'Notifications',
    all: 'All',
    unread: 'Unread',
    markAsRead: 'Mark as Read',
    markAllAsRead: 'Mark All as Read',
    delete: 'Delete',
    deleteAll: 'Delete All',
    noNotifications: 'No notifications',
    types: {
      achievement: 'Achievement',
      appointment: 'Appointment',
      medication: 'Medication',
      claim: 'Claim',
      system: 'System'
    },
    journeys: {
      health: {
        metricAlert: 'Health metric alert',
        goalCompleted: 'Health goal completed',
        deviceSynced: 'Device synced successfully'
      },
      care: {
        appointmentReminder: 'Appointment reminder',
        medicationReminder: 'Medication reminder',
        treatmentPlanUpdate: 'Treatment plan update'
      },
      plan: {
        claimStatusUpdate: 'Claim status update',
        benefitExpiring: 'Benefit expiring soon',
        coverageRenewal: 'Coverage renewal reminder'
      }
    }
  },
  settings: {
    title: 'Settings',
    account: 'Account',
    appearance: 'Appearance',
    notifications: 'Notifications',
    privacy: 'Privacy',
    language: 'Language',
    theme: {
      title: 'Theme',
      light: 'Light',
      dark: 'Dark',
      system: 'System Default'
    },
    notificationPreferences: {
      title: 'Notification Preferences',
      push: 'Push Notifications',
      email: 'Email Notifications',
      sms: 'SMS Notifications',
      inApp: 'In-App Notifications'
    },
    privacySettings: {
      title: 'Privacy Settings',
      dataSharing: 'Data Sharing',
      analytics: 'Analytics',
      marketing: 'Marketing Communications',
      locationServices: 'Location Services'
    },
    accessibility: {
      title: 'Accessibility',
      fontSize: 'Font Size',
      contrast: 'Contrast',
      reduceMotion: 'Reduce Motion',
      screenReader: 'Screen Reader Support'
    },
    about: {
      title: 'About',
      version: 'Version',
      termsOfService: 'Terms of Service',
      privacyPolicy: 'Privacy Policy',
      licenses: 'Licenses',
      contact: 'Contact Us'
    }
  }
};

/**
 * Export the translations object for use with i18next
 */
export default {
  translation: translations
};