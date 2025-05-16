# @austa/journey-context

A cross-platform React context library for managing journey-specific state in the AUSTA SuperApp. This package provides context providers and hooks for journey-specific state management across both web (Next.js) and mobile (React Native) platforms.

## Overview

The AUSTA SuperApp is built around three distinct user journeys:

- **Health Journey** ("Minha Saúde"): Personal health monitoring and wellness tracking
- **Care Journey** ("Cuidar-me Agora"): Healthcare access and appointment management
- **Plan Journey** ("Meu Plano & Benefícios"): Insurance management and claims

This package provides the context providers and hooks necessary to manage journey-specific state across these journeys, enabling consistent user experiences and seamless transitions between journeys.

## Installation

```bash
# Using npm
npm install @austa/journey-context

# Using yarn
yarn add @austa/journey-context

# Using pnpm
pnpm add @austa/journey-context
```

## Features

- **Platform Agnostic**: Works seamlessly on both web (Next.js) and mobile (React Native)
- **Journey Management**: Provides context for the three primary user journeys
- **Authentication**: Unified authentication context across platforms
- **Gamification**: Cross-journey gamification state management
- **Notifications**: Centralized notification handling
- **Persistent Storage**: Platform-specific storage adapters for state persistence

## Usage

### Basic Setup

Wrap your application with the journey providers to enable journey context throughout your app:

```tsx
// App.tsx or _app.tsx
import { JourneyProvider, AuthProvider, GamificationProvider, NotificationProvider } from '@austa/journey-context';

function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <JourneyProvider>
        <GamificationProvider>
          <NotificationProvider>
            <Component {...pageProps} />
          </NotificationProvider>
        </GamificationProvider>
      </JourneyProvider>
    </AuthProvider>
  );
}

export default App;
```

### Using Journey Context

Access and update the current journey using the `useJourney` hook:

```tsx
import { useJourney } from '@austa/journey-context';
import { JOURNEY_IDS } from '@austa/journey-context/constants';

function JourneySwitcher() {
  const { currentJourney, setJourney } = useJourney();

  return (
    <div>
      <h2>Current Journey: {currentJourney.name}</h2>
      <button onClick={() => setJourney(JOURNEY_IDS.HEALTH)}>Health Journey</button>
      <button onClick={() => setJourney(JOURNEY_IDS.CARE)}>Care Journey</button>
      <button onClick={() => setJourney(JOURNEY_IDS.PLAN)}>Plan Journey</button>
    </div>
  );
}
```

### Authentication

Manage user authentication with the `useAuth` hook:

```tsx
import { useAuth } from '@austa/journey-context';

function LoginForm() {
  const { login, isAuthenticated, isLoading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(email, password);
  };

  if (isAuthenticated) {
    return <div>You are logged in!</div>;
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
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
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

### Gamification

Access gamification features with the `useGamification` hook:

```tsx
import { useGamification } from '@austa/journey-context';

function AchievementsList() {
  const { gameProfile, isLoading, triggerEvent } = useGamification();

  if (isLoading) {
    return <div>Loading achievements...</div>;
  }

  const handleCompleteTask = () => {
    triggerEvent('TASK_COMPLETED', { taskId: '123', journeyId: 'health' });
  };

  return (
    <div>
      <h2>Your Achievements</h2>
      <button onClick={handleCompleteTask}>Complete Task</button>
      <ul>
        {gameProfile?.achievements.map(achievement => (
          <li key={achievement.id}>
            {achievement.name} - {achievement.isUnlocked ? 'Unlocked' : 'Locked'}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Notifications

Manage notifications with the `useNotification` hook:

```tsx
import { useNotification } from '@austa/journey-context';

function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, fetchNotifications } = useNotification();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return (
    <div>
      <h2>Notifications ({unreadCount})</h2>
      <ul>
        {notifications.map(notification => (
          <li 
            key={notification.id} 
            onClick={() => markAsRead(notification.id)}
            style={{ fontWeight: notification.isRead ? 'normal' : 'bold' }}
          >
            {notification.title}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Platform-Specific Integration

### Web (Next.js)

For web applications, the journey context integrates with Next.js routing:

```tsx
// pages/_app.tsx
import { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { JourneyProvider, AuthProvider } from '@austa/journey-context';

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  return (
    <AuthProvider>
      <JourneyProvider>
        <Component {...pageProps} />
      </JourneyProvider>
    </AuthProvider>
  );
}

export default MyApp;
```

The journey context will automatically synchronize with URL paths, extracting the journey ID from the URL pattern.

### Mobile (React Native)

For mobile applications, integrate with React Navigation:

```tsx
// App.tsx
import { NavigationContainer } from '@react-navigation/native';
import { JourneyProvider, AuthProvider } from '@austa/journey-context';

function App() {
  return (
    <AuthProvider>
      <JourneyProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </JourneyProvider>
    </AuthProvider>
  );
}

export default App;
```

The journey context will work with React Navigation to manage journey-based navigation.

## API Reference

### Providers

#### `<JourneyProvider>`

Provides journey context to the application.

**Props:**

- `initialJourney` (optional): The initial journey ID to use
- `children`: React children

#### `<AuthProvider>`

Provides authentication context to the application.

**Props:**

- `children`: React children

#### `<GamificationProvider>`

Provides gamification context to the application.

**Props:**

- `children`: React children

#### `<NotificationProvider>`

Provides notification context to the application.

**Props:**

- `children`: React children

### Hooks

#### `useJourney()`

Access and update the current journey.

**Returns:**

- `currentJourney`: The current journey object
- `setJourney`: Function to change the current journey
- `isValidJourney`: Function to check if a journey ID is valid
- `journeyConfig`: Configuration for available journeys

#### `useAuth()`

Manage authentication state.

**Returns:**

- `isAuthenticated`: Boolean indicating if the user is authenticated
- `isLoading`: Boolean indicating if authentication is in progress
- `user`: The authenticated user object (if available)
- `login`: Function to log in a user
- `logout`: Function to log out the current user
- `register`: Function to register a new user
- `error`: Any authentication error that occurred

#### `useGamification()`

Access gamification features.

**Returns:**

- `gameProfile`: The user's game profile with achievements, quests, and rewards
- `isLoading`: Boolean indicating if gamification data is loading
- `triggerEvent`: Function to trigger a gamification event
- `checkAchievementStatus`: Function to check if an achievement is unlocked
- `calculateProgress`: Function to calculate progress percentage for a quest or achievement

#### `useNotification()`

Manage notifications.

**Returns:**

- `notifications`: Array of notification objects
- `unreadCount`: Number of unread notifications
- `isLoading`: Boolean indicating if notifications are loading
- `fetchNotifications`: Function to fetch notifications
- `markAsRead`: Function to mark a notification as read
- `deleteNotification`: Function to delete a notification

### Constants

#### Journey IDs

```tsx
import { JOURNEY_IDS } from '@austa/journey-context/constants';

// Available journey IDs
const { HEALTH, CARE, PLAN } = JOURNEY_IDS;
```

#### Journey Routes

```tsx
import { JOURNEY_ROUTES } from '@austa/journey-context/constants';

// Available journey routes
const { HEALTH_ROUTE, CARE_ROUTE, PLAN_ROUTE } = JOURNEY_ROUTES;
```

## Migrating from Previous Implementations

If you were previously using separate context implementations for web and mobile, follow these steps to migrate to `@austa/journey-context`:

### 1. Update Imports

Replace imports from local context files with imports from `@austa/journey-context`:

```diff
- import { useJourney } from '../context/JourneyContext';
- import { useAuth } from '../context/AuthContext';
+ import { useJourney, useAuth } from '@austa/journey-context';
```

### 2. Update Provider Usage

Replace local context providers with providers from `@austa/journey-context`:

```diff
- import { JourneyProvider } from '../context/JourneyContext';
- import { AuthProvider } from '../context/AuthContext';
+ import { JourneyProvider, AuthProvider } from '@austa/journey-context';
```

### 3. Update Constants

Replace local journey constants with constants from `@austa/journey-context/constants`:

```diff
- import { JOURNEY_IDS } from '../constants/journeys';
+ import { JOURNEY_IDS } from '@austa/journey-context/constants';
```

## Contributing

Contributions to the journey-context package are welcome. Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

This package is part of the AUSTA SuperApp and is subject to the company's internal licensing terms.