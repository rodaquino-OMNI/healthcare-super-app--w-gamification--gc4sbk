/**
 * English (US) translations for the AUSTA SuperApp
 * @version 2.0.0
 */

import { TranslationSchema } from '@austa/interfaces/common';
import { GamificationEventType } from '@austa/interfaces/gamification/events';
import { HealthMetricType } from '@austa/interfaces/health/types';
import { AppointmentType, AppointmentStatus } from '@austa/interfaces/care/types';
import { ClaimStatus, ClaimType } from '@austa/interfaces/plan/claims.types';

/**
 * Complete English (US) translation schema for the AUSTA SuperApp
 */
const translations: TranslationSchema = {
  common: {
    buttons: {
      save: 'Save',
      cancel: 'Cancel',
      next: 'Next',
      back: 'Back',
      ok: 'OK',
      confirm: 'Confirm',
      edit: 'Edit',
      delete: 'Delete',
      add: 'Add',
      view_all: 'View all'
    },
    validation: {
      required: 'This field is required',
      email: 'Invalid email',
      minLength: 'Minimum {{count}} characters',
      maxLength: 'Maximum {{count}} characters',
      number: 'Must be a valid number',
      positive: 'Must be a positive number',
      date: 'Invalid date',
      cpf: 'Invalid CPF',
      phone: 'Invalid phone number'
    },
    errors: {
      default: 'An unexpected error occurred. Please try again.',
      network: 'No internet connection.',
      timeout: 'Request timeout exceeded.',
      unauthorized: 'You are not authorized to access this resource.',
      notFound: 'Resource not found.',
      server: 'Server error. Please try again later.'
    },
    success: {
      saved: 'Saved successfully!',
      deleted: 'Deleted successfully!',
      added: 'Added successfully!'
    },
    labels: {
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      date: 'Date',
      time: 'Time',
      amount: 'Amount',
      description: 'Description',
      notes: 'Notes',
      search: 'Search',
      select: 'Select',
      optional: '(Optional)'
    },
    placeholders: {
      search: 'Type to search...',
      select: 'Select an option'
    },
    tooltips: {
      required: 'This field is required'
    }
  },
  journeys: {
    health: {
      title: 'My Health',
      metrics: {
        [HealthMetricType.HEART_RATE]: 'Heart Rate',
        [HealthMetricType.BLOOD_PRESSURE]: 'Blood Pressure',
        [HealthMetricType.BLOOD_GLUCOSE]: 'Blood Glucose',
        [HealthMetricType.STEPS]: 'Steps',
        [HealthMetricType.SLEEP]: 'Sleep',
        [HealthMetricType.WEIGHT]: 'Weight',
        [HealthMetricType.TEMPERATURE]: 'Temperature',
        [HealthMetricType.OXYGEN_SATURATION]: 'Oxygen Saturation'
      },
      goals: {
        daily: 'Daily Goal',
        weekly: 'Weekly Goal',
        monthly: 'Monthly Goal',
        progress: 'Progress: {{value}}%',
        setGoal: 'Set Goal',
        steps: 'Daily Steps',
        sleep: 'Hours of Sleep',
        water: 'Water Intake (liters)',
        calories: 'Calories Burned'
      },
      history: {
        title: 'Medical History',
        empty: 'No medical events recorded.',
        filters: {
          all: 'All',
          appointments: 'Appointments',
          medications: 'Medications',
          labTests: 'Lab Tests',
          procedures: 'Procedures'
        }
      },
      devices: {
        title: 'Connected Devices',
        connectNew: 'Connect New Device',
        lastSync: 'Last sync: {{time}}',
        syncNow: 'Sync Now',
        disconnectDevice: 'Disconnect Device',
        connectionStatus: {
          connected: 'Connected',
          disconnected: 'Disconnected',
          syncing: 'Syncing...',
          error: 'Connection Error'
        }
      },
      insights: {
        title: 'Health Insights',
        empty: 'No insights available at the moment.',
        viewDetails: 'View Details',
        generatedOn: 'Generated on {{date}}'
      }
    },
    care: {
      title: 'Care Now',
      appointments: {
        book: 'Book Appointment',
        upcoming: 'Upcoming Appointments',
        past: 'Past Appointments',
        details: 'Appointment Details',
        empty: 'No appointments scheduled.',
        confirm: 'Confirm Appointment',
        cancel: 'Cancel Appointment',
        reschedule: 'Reschedule Appointment',
        reason: 'Reason for Appointment',
        type: 'Appointment Type',
        location: 'Location',
        provider: 'Provider',
        date: 'Date',
        time: 'Time',
        notes: 'Notes',
        types: {
          [AppointmentType.TELEMEDICINE]: 'Telemedicine',
          [AppointmentType.IN_PERSON]: 'In Person',
          [AppointmentType.ANY]: 'Any'
        },
        status: {
          [AppointmentStatus.SCHEDULED]: 'Scheduled',
          [AppointmentStatus.CONFIRMED]: 'Confirmed',
          [AppointmentStatus.COMPLETED]: 'Completed',
          [AppointmentStatus.CANCELLED]: 'Cancelled',
          [AppointmentStatus.NO_SHOW]: 'No Show'
        },
        noProviders: 'No providers available for the selected criteria.'
      },
      telemedicine: {
        start: 'Start Telemedicine',
        connecting: 'Connecting...',
        connected: 'Connected with Dr. {{name}}',
        end: 'End Telemedicine',
        waiting: 'Waiting for the provider...',
        error: 'Error connecting. Please try again.',
        noProviders: 'No providers available for telemedicine.',
        reconnecting: 'Reconnecting...',
        audioOnly: 'Audio Only Mode',
        videoEnabled: 'Video Enabled',
        micMuted: 'Microphone Muted',
        micActive: 'Microphone Active'
      },
      medications: {
        title: 'Medications',
        add: 'Add Medication',
        name: 'Medication Name',
        dosage: 'Dosage',
        frequency: 'Frequency',
        startDate: 'Start Date',
        endDate: 'End Date',
        instructions: 'Instructions',
        empty: 'No medications registered.',
        trackDose: 'Track Dose Taken',
        refill: 'Request Refill',
        reminder: 'Medication Reminder',
        adherence: {
          title: 'Adherence',
          excellent: 'Excellent',
          good: 'Good',
          fair: 'Fair',
          poor: 'Poor'
        },
        frequency_options: {
          once_daily: 'Once Daily',
          twice_daily: 'Twice Daily',
          three_times_daily: 'Three Times Daily',
          four_times_daily: 'Four Times Daily',
          as_needed: 'As Needed',
          weekly: 'Weekly',
          monthly: 'Monthly'
        }
      },
      symptomChecker: {
        title: 'Symptom Checker',
        start: 'Start Check',
        selectSymptoms: 'Select your symptoms',
        noSymptoms: 'No symptoms selected.',
        results: 'Results',
        recommendations: 'Recommendations',
        selfCare: 'Self-Care',
        bookAppointment: 'Book Appointment',
        emergency: 'Seek Emergency Help',
        disclaimer: 'This tool provides general guidance and is not a substitute for professional medical advice.'
      },
      treatmentPlans: {
        title: 'Treatment Plans',
        empty: 'No active treatment plans.',
        tasks: 'Tasks',
        progress: 'Progress',
        startDate: 'Start Date',
        endDate: 'End Date',
        description: 'Plan Description',
        provider: 'Care Provider',
        nextStep: 'Next Step',
        completeStep: 'Complete Step'
      },
      providers: {
        title: 'Healthcare Providers',
        search: 'Search Providers',
        specialty: 'Specialty',
        availability: 'Availability',
        rating: 'Rating',
        distance: 'Distance',
        noResults: 'No providers match your search criteria.'
      }
    },
    plan: {
      title: 'My Plan & Benefits',
      coverage: {
        title: 'Coverage',
        details: 'Coverage Details',
        limits: 'Limits and Deductibles',
        network: 'In-Network Providers',
        empty: 'No coverage information available.',
        deductible: 'Deductible',
        coPayment: 'Co-payment',
        coInsurance: 'Co-insurance',
        outOfPocketMax: 'Out-of-pocket Maximum',
        coveragePercent: '{{value}}% Covered'
      },
      digitalCard: {
        title: 'Digital Insurance Card',
        share: 'Share Insurance Card',
        download: 'Download Insurance Card',
        memberSince: 'Member Since',
        planType: 'Plan Type',
        memberId: 'Member ID',
        groupNumber: 'Group Number'
      },
      claims: {
        title: 'Reimbursements',
        submit: 'Submit Claim',
        history: 'Claim History',
        empty: 'No reimbursement requests found.',
        status: {
          [ClaimStatus.PENDING]: 'Pending',
          [ClaimStatus.APPROVED]: 'Approved',
          [ClaimStatus.DENIED]: 'Denied',
          [ClaimStatus.MORE_INFO_REQUIRED]: 'Additional Information Required',
          [ClaimStatus.PROCESSING]: 'Processing',
          [ClaimStatus.SUBMITTED]: 'Submitted'
        },
        type: {
          [ClaimType.MEDICAL]: 'Medical',
          [ClaimType.DENTAL]: 'Dental',
          [ClaimType.VISION]: 'Vision',
          [ClaimType.PHARMACY]: 'Pharmacy',
          [ClaimType.OTHER]: 'Other'
        },
        details: 'Claim Details',
        uploadDocument: 'Upload Document',
        claimType: 'Claim Type',
        dateOfService: 'Date of Service',
        providerName: 'Provider Name',
        amountPaid: 'Amount Paid',
        description: 'Service Description',
        trackingNumber: 'Tracking Number',
        estimatedDate: 'Estimated Date',
        paymentDetails: 'Payment Details',
        appeal: 'Appeal'
      },
      costSimulator: {
        title: 'Cost Simulator',
        procedure: 'Procedure',
        estimate: 'Estimated Cost',
        noResults: 'No procedures found.',
        yourCost: 'Your Estimated Cost',
        totalCost: 'Total Procedure Cost',
        coveredAmount: 'Covered Amount',
        disclaimer: 'This is an estimate only. Actual costs may vary.'
      },
      benefits: {
        title: 'Benefits',
        empty: 'No benefits available.',
        usage: 'Usage',
        limit: 'Limit',
        description: 'Benefit Description',
        available: 'Available',
        used: 'Used',
        remaining: 'Remaining',
        expiresOn: 'Expires on {{date}}'
      }
    },
    gamification: {
      level: 'Level {{level}}',
      xp: '{{value}} XP',
      achievements: {
        unlocked: 'Achievement Unlocked!',
        progress: 'Progress: {{value}}/{{total}}',
        reward: 'Reward: {{reward}}',
        empty: 'No achievements unlocked.',
        categories: {
          health: 'Health Achievements',
          care: 'Care Achievements',
          plan: 'Plan Achievements',
          general: 'General Achievements'
        },
        share: 'Share Achievement'
      },
      quests: {
        active: 'Active Quests',
        completed: 'Completed Quests',
        new: 'New Quest Available!',
        empty: 'No active quests.',
        expires: 'Expires in {{time}}',
        daily: 'Daily Quest',
        weekly: 'Weekly Quest',
        special: 'Special Quest'
      },
      rewards: {
        empty: 'No rewards available.',
        redeem: 'Redeem Reward',
        redeemed: 'Redeemed',
        available: 'Available Rewards',
        history: 'Reward History',
        expires: 'Expires on {{date}}',
        categories: {
          virtual: 'Virtual Rewards',
          physical: 'Physical Rewards',
          discount: 'Discounts'
        }
      },
      leaderboard: {
        title: 'Ranking',
        rank: 'Rank',
        user: 'User',
        score: 'Score',
        weekly: 'Weekly Ranking',
        monthly: 'Monthly Ranking',
        allTime: 'All-Time Ranking',
        yourRank: 'Your Rank: #{{rank}}'
      },
      events: {
        [GamificationEventType.ACHIEVEMENT_UNLOCKED]: 'Achievement Unlocked',
        [GamificationEventType.QUEST_COMPLETED]: 'Quest Completed',
        [GamificationEventType.REWARD_EARNED]: 'Reward Earned',
        [GamificationEventType.LEVEL_UP]: 'Level Up',
        [GamificationEventType.XP_EARNED]: 'XP Earned',
        [GamificationEventType.STREAK_MILESTONE]: 'Streak Milestone Reached',
        [GamificationEventType.BADGE_UNLOCKED]: 'Badge Unlocked',
        [GamificationEventType.LEADERBOARD_POSITION]: 'Leaderboard Position Changed'
      },
      streaks: {
        current: 'Current Streak: {{days}} days',
        best: 'Best Streak: {{days}} days',
        broken: 'Streak Broken',
        continue: 'Continue your streak today!'
      }
    },
    auth: {
      login: {
        title: 'Login',
        email: 'Email',
        password: 'Password',
        forgotPassword: 'Forgot your password?',
        register: 'Create account',
        loginButton: 'Login',
        rememberMe: 'Remember me'
      },
      register: {
        title: 'Create Account',
        name: 'Full Name',
        email: 'Email',
        cpf: 'CPF',
        phone: 'Phone',
        password: 'Password',
        confirmPassword: 'Confirm Password',
        terms: 'I agree to the Terms of Service and Privacy Policy.',
        login: 'Already have an account?',
        registerButton: 'Create Account',
        passwordRequirements: 'Password must be at least 8 characters with letters and numbers.'
      },
      forgotPassword: {
        title: 'Recover Password',
        email: 'Email',
        sendCode: 'Send Verification Code',
        backToLogin: 'Back to Login',
        instructions: 'Enter your email address and we will send you a verification code to reset your password.'
      },
      mfa: {
        title: 'Security Verification',
        code: 'Verification Code',
        resendCode: 'Resend Code',
        verifyButton: 'Verify',
        instructions: 'Enter the verification code sent to your email or phone.'
      },
      resetPassword: {
        title: 'Reset Password',
        newPassword: 'New Password',
        confirmPassword: 'Confirm New Password',
        resetButton: 'Reset Password',
        success: 'Your password has been reset successfully.'
      }
    },
    profile: {
      title: 'Profile',
      edit: 'Edit Profile',
      settings: 'Settings',
      notifications: 'Notifications',
      security: 'Security',
      help: 'Help',
      logout: 'Logout',
      personalInfo: 'Personal Information',
      healthInfo: 'Health Information',
      preferences: 'Preferences',
      language: 'Language',
      theme: 'Theme',
      dataPrivacy: 'Data & Privacy'
    },
    settings: {
      title: 'Settings',
      language: 'Language',
      notifications: 'Notifications',
      privacy: 'Privacy',
      about: 'About',
      theme: {
        title: 'Theme',
        light: 'Light',
        dark: 'Dark',
        system: 'System Default'
      },
      dataUsage: {
        title: 'Data Usage',
        saveData: 'Save Data',
        downloadOverWifi: 'Download Over Wi-Fi Only'
      },
      version: 'Version {{version}}',
      termsOfService: 'Terms of Service',
      privacyPolicy: 'Privacy Policy'
    },
    notifications: {
      title: 'Notifications',
      empty: 'No notifications.',
      markAllRead: 'Mark All as Read',
      settings: 'Notification Settings',
      preferences: {
        title: 'Notification Preferences',
        push: 'Push Notifications',
        email: 'Email Notifications',
        sms: 'SMS Notifications',
        inApp: 'In-App Notifications'
      },
      categories: {
        health: 'Health Notifications',
        care: 'Care Notifications',
        plan: 'Plan Notifications',
        gamification: 'Gamification Notifications',
        system: 'System Notifications'
      }
    }
  }
};

export default translations;