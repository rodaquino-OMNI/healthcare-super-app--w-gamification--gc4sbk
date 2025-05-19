import type { AppProps } from '@austa/interfaces/next'; // Using shared interfaces for Next.js types
import { useRouter } from 'next/router'; // next/router 13.0+
import { ThemeProvider, GlobalStyle, theme } from '@design-system/primitives'; // Using design system primitives

import {
  I18nProvider,
  AuthProvider,
  GamificationProvider,
  NotificationProvider,
  JourneyProvider
} from '@austa/journey-context'; // Using journey context providers

/**
 * Custom App component that wraps all pages.
 * @param props - The props for the custom App component.
 * @returns The rendered App component.
 */
function _app({ Component, pageProps }: AppProps): JSX.Element {
  // LD1: Uses the useRouter hook to get the current route.
  const router = useRouter();

  // LD1: Returns a ThemeProvider component that wraps the entire application with the global theme.
  // LD1: Applies the I18nProvider for internationalization.
  // LD1: Applies the AuthProvider for authentication context.
  // LD1: Applies the GamificationProvider for gamification context.
  // LD1: Applies the NotificationProvider for notification context.
  // LD1: Applies the JourneyProvider to provide journey-specific theming and context.
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <I18nProvider>
        <AuthProvider>
          <GamificationProvider>
            <NotificationProvider>
              <JourneyProvider>
                <Component {...pageProps} key={router.asPath} />
              </JourneyProvider>
            </NotificationProvider>
          </GamificationProvider>
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}

export default _app;