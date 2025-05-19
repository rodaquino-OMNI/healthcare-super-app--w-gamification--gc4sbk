/**
 * Internationalization (i18n) setup for the AUSTA SuperApp mobile application
 * 
 * This file configures i18next with translations and language detection, providing
 * localization capabilities throughout the mobile app. It supports Brazilian Portuguese
 * (primary) and US English (alternative) languages as specified in the technical requirements.
 *
 * @package i18next v23.8.2
 * @package react-i18next v13.0.0
 */

import i18n from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';
// Use standardized path aliases instead of direct relative paths
import ptBR from '@app/i18n/pt-BR'; // Brazilian Portuguese translations
import enUS from '@app/i18n/en-US'; // US English translations
import { supportedLocales, defaultLocale } from '@austa/interfaces/common';
import { JourneyId, ALL_JOURNEYS } from '@austa/journey-context/constants';
import { useJourney } from '@austa/journey-context';

// Create journey-specific namespaces for translations
const journeyNamespaces = ALL_JOURNEYS.map(journey => journey.id.toLowerCase());

// Initialize i18next with the available translations
i18n
  .use(initReactI18next) // Connects i18next with React
  .init({
    resources: {
      'pt-BR': {
        translation: ptBR, // Brazilian Portuguese translations
      },
      'en-US': {
        translation: enUS, // US English translations
      },
    },
    lng: defaultLocale, // Use Brazilian Portuguese as default
    fallbackLng: defaultLocale, // Fallback to Brazilian Portuguese if a translation is missing
    supportedLngs: supportedLocales, // Use the supported locales from the shared config
    ns: ['translation', ...journeyNamespaces], // Add journey-specific namespaces
    defaultNS: 'translation',
    
    interpolation: {
      escapeValue: false, // React already handles escaping for security
    },
    
    // React-specific configuration
    react: {
      useSuspense: true, // Use React Suspense for loading translations
    },
  });

/**
 * Custom hook that combines useTranslation with useJourney to provide
 * journey-specific translations
 * 
 * @param {string} [namespace] - Optional namespace to use for translations
 * @returns {object} Translation utilities with journey context
 */
export const useJourneyTranslation = (namespace?: string) => {
  const { t, i18n: i18nInstance } = useTranslation(namespace);
  const { activeJourney } = useJourney();
  
  // Get the current journey namespace
  const journeyNS = activeJourney?.id.toLowerCase() || 'health';
  
  // Function to translate with journey context
  const tJourney = (key: string, options?: any) => {
    // Try journey-specific namespace first, then fall back to default
    const journeyKey = `${journeyNS}:${key}`;
    const hasJourneyTranslation = i18nInstance.exists(journeyKey, options);
    
    return hasJourneyTranslation 
      ? t(journeyKey, options)
      : t(key, options);
  };
  
  return {
    t,
    tJourney,
    i18n: i18nInstance,
    activeJourneyId: activeJourney?.id as JourneyId,
  };
};

// Export the configured i18n instance and translation hooks
export { i18n, useTranslation };