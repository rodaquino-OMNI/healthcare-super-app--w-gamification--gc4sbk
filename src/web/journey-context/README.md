# AUSTA Journey Context

This package provides context providers and hooks for managing journey state across the AUSTA SuperApp. It abstracts platform-specific implementations to provide a consistent API for both web and mobile applications.

## Installation

```bash
yarn add @austa/journey-context
```

## Features

- Cross-platform authentication with `useAuth` hook
- Platform-agnostic storage with `useStorage` hook
- Automatic platform detection and adapter initialization
- TypeScript support with comprehensive type definitions

## Usage

### Authentication

```tsx
import { useAuth } from '@austa/journey-context';

function LoginScreen() {
  const { login, status, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleLogin = async () => {
    try {
      await login(email, password);
      // Navigate to home screen
    } catch (error) {
      console.error('Login failed:', error);
    }
  };
  
  return (
    <div>
      <input 
        type="email" 
        value={email} 
        onChange={(e) => setEmail(e.target.value)} 
        placeholder="Email"
      />
      <input 
        type="password" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)} 
        placeholder="Password"
      />
      <button onClick={handleLogin} disabled={status === 'loading'}>
        {status === 'loading' ? 'Logging in...' : 'Login'}
      </button>
    </div>
  );
}
```

### Storage

```tsx
import { useStorage } from '@austa/journey-context';

function UserPreferences() {
  const { value: preferences, setValue: setPreferences } = useStorage('user_preferences', {});
  
  const updateTheme = (theme) => {
    setPreferences({ ...preferences, theme });
  };
  
  return (
    <div>
      <h2>User Preferences</h2>
      <div>
        <label>Theme:</label>
        <select 
          value={preferences?.theme || 'light'} 
          onChange={(e) => updateTheme(e.target.value)}
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System</option>
        </select>
      </div>
    </div>
  );
}
```

## API Reference

### useAuth

A hook for authentication operations.

```tsx
const { 
  // State
  session,          // Current auth session or null
  status,           // 'authenticated' | 'loading' | 'unauthenticated'
  user,             // User profile or null
  isAuthenticated,  // Boolean indicating if user is authenticated
  isLoading,        // Boolean indicating if auth state is loading
  
  // Methods
  login,            // (email, password, rememberMe?) => Promise<void>
  logout,           // () => Promise<void>
  register,         // (userData) => Promise<void>
  refreshToken,     // () => Promise<void>
  getProfile,       // () => Promise<AuthUser>
  verifyMfa,        // (code, mfaToken) => Promise<void>
  socialLogin,      // (provider, tokenData) => Promise<void>
  getUserFromToken  // (token) => JwtPayload | null
} = useAuth();
```

### useStorage

A hook for cross-platform storage operations.

```tsx
const { 
  value,       // Current stored value or null
  setValue,    // (newValue) => Promise<void>
  removeValue, // () => Promise<void>
  error,       // Error object or null
  isLoading    // Boolean indicating if storage is loading
} = useStorage(key, initialValue);
```

## License

This package is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.