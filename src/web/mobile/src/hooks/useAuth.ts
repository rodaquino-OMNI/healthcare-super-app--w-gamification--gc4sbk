import { useContext } from 'react'; // v18.2.0
import { AuthContext } from '../context/AuthContext';
import { AuthContextType } from '@austa/interfaces/auth';
import { JourneyError } from '@austa/journey-context/utils/error';

/**
 * Custom hook that provides access to the authentication context.
 * 
 * This hook simplifies access to authentication-related state and methods
 * throughout the application. It abstracts the context consumption logic and
 * provides type-safe access to authentication functionality.
 * 
 * @returns The authentication context object containing user state and auth methods
 * @throws JourneyError if used outside of AuthProvider with standardized error reporting
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (!context) {
    // Use standardized JourneyError from journey-context for consistent error handling
    throw new JourneyError({
      code: 'AUTH_CONTEXT_MISSING',
      message: 'useAuth must be used within an AuthProvider',
      severity: 'error',
      source: 'auth-hook'
    });
  }
  
  return context;
}