/**
 * Internationalization setup for the AUSTA SuperApp
 * 
 * This file configures and exports the i18next instance for internationalization 
 * in the web application, providing access to translation functions and managing locale settings.
 */

import React from 'react';
import i18n from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';

// Import translations
import ptBR from './pt-BR';
import enUS from './en-US';

// Import i18n configuration
import { defaultLocale, supportedLocales } from '@app/shared/config/i18nConfig';

// Import formatters
import { formatDate } from './formatters';

// Import design tokens for typography consistency
import { typography } from '@design-system/primitives';

// Define translation resources type
import { TranslationResources } from '@austa/interfaces';

// Initialize i18next
i18n
  // Initialize react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    resources: {
      'pt-BR': ptBR,
      'en-US': enUS
    } as TranslationResources,
    lng: defaultLocale,
    fallbackLng: defaultLocale,
    supportedLngs: supportedLocales,
    interpolation: {
      escapeValue: false, // React already escapes values
      format: (value, format, lng) => {
        // Handle date formatting with improved typography consistency
        if (value instanceof Date && format) {
          const dateFormat = format === 'short' 
            ? { day: '2-digit', month: '2-digit', year: 'numeric', fontFamily: typography.fontFamily.base }
            : format === 'long'
              ? { day: '2-digit', month: 'long', year: 'numeric', fontFamily: typography.fontFamily.base }
              : undefined;
          
          return formatDate(value, lng, dateFormat);
        }
        return value;
      }
    },
    // Enable debugging in development environment
    debug: process.env.NODE_ENV === 'development',
    // React i18next special options
    react: {
      useSuspense: true
    }
  });

// Export the configured i18n instance and useTranslation hook
export { i18n, useTranslation };