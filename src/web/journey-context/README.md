# @austa/journey-context

A cross-platform context management library for the AUSTA SuperApp that provides journey-specific state management across web and mobile applications.

## Overview

The `@austa/journey-context` package centralizes state management for the three core user journeys in the AUSTA SuperApp:

- **Health Journey** ("Minha Saúde"): Health metrics, goals, and medical history
- **Care Journey** ("Cuidar-me Agora"): Appointments, telemedicine, and treatments
- **Plan Journey** ("Meu Plano & Benefícios"): Insurance coverage, claims, and benefits

This package provides React context providers, hooks, and utilities that work consistently across both web (Next.js) and mobile (React Native) platforms, eliminating the need for platform-specific implementations.

## Installation

```bash
# Using npm
npm install @austa/journey-context

# Using yarn
yarn add @austa/journey-context

# Using pnpm
pnpm add @austa/journey-context
```

## Key Features

- **Platform Agnostic**: Works seamlessly on both web and mobile through platform-specific adapters
- **Journey Management**: Centralized state for the three core user journeys
- **Authentication**: Cross-platform authentication with persistent sessions
- **Gamification**: Event tracking and achievement management
- **Notifications**: Unified notification handling across platforms
- **Persistent Storage**: Abstracted storage layer that works with both localStorage and AsyncStorage

## Usage

### Basic Setup

Wrap your application with the journey providers:

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

Access and update the current journey:

```tsx
import { useJourney } from '@austa/journey-context';
import { JOURNEY_IDS } from '@austa/journey-context/constants';

function JourneySelector() {
  const { currentJourney, setCurrentJourney } = useJourney();

  return (
    <div>
      <h2>Current Journey: {currentJourney.name}</h2>
      <button onClick={() => setCurrentJourney(JOURNEY_IDS.HEALTH)}>Health Journey</button>
      <button onClick={() => setCurrentJourney(JOURNEY_IDS.CARE)}>Care Journey</button>
      <button onClick={() => setCurrentJourney(JOURNEY_IDS.PLAN)}>Plan Journey</button>
    </div>
  );
}
```

### Authentication

Manage user authentication:

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
      {error && <div className="error">{error.message}</div>}
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

Track achievements and trigger gamification events:

```tsx
import { useGamification } from '@austa/journey-context';

function HealthMetricForm() {
  const { triggerEvent, gameProfile } = useGamification();

  const handleSubmitMetric = async (metricData) => {
    // Save metric data to API
    await saveMetricToAPI(metricData);
    
    // Trigger gamification event
    await triggerEvent({
      type: 'HEALTH_METRIC_RECORDED',
      journeyId: 'health',
      payload: {
        metricType: metricData.type,
        value: metricData.value
      }
    });
  };

  return (
    <div>
      <h2>Record Health Metric</h2>
      <form onSubmit={handleSubmitMetric}>
        {/* Form fields */}
      </form>
      
      <div className="gamification-status">
        <p>Current XP: {gameProfile?.xp || 0}</p>
        <p>Level: {gameProfile?.level || 1}</p>
      </div>
    </div>
  );
}
```

### Notifications

Access and manage notifications:

```tsx
import { useNotification } from '@austa/journey-context';

function NotificationCenter() {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    isLoading 
  } = useNotification();

  if (isLoading) {
    return <div>Loading notifications...</div>;
  }

  return (
    <div>
      <h2>Notifications ({unreadCount})</h2>
      <ul>
        {notifications.map(notification => (
          <li 
            key={notification.id} 
            className={notification.read ? 'read' : 'unread'}
            onClick={() => markAsRead(notification.id)}
          >
            <h3>{notification.title}</h3>
            <p>{notification.message}</p>
            <small>{new Date(notification.createdAt).toLocaleString()}</small>
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
      <JourneyProvider
        onJourneyChange={(journeyId) => {
          // Sync journey changes with routing
          const journeyPath = `/journey/${journeyId}`;
          if (!router.pathname.includes(journeyPath)) {
            router.push(journeyPath);
          }
        }}
      >
        <Component {...pageProps} />
      </JourneyProvider>
    </AuthProvider>
  );
}

export default MyApp;
```

### Mobile (React Native)

For mobile applications, the journey context integrates with React Navigation:

```tsx
// App.tsx
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { JourneyProvider, AuthProvider, useJourney } from '@austa/journey-context';
import { JOURNEY_IDS } from '@austa/journey-context/constants';

const Tab = createBottomTabNavigator();

function MainNavigator() {
  const { currentJourney, setCurrentJourney } = useJourney();

  return (
    <Tab.Navigator
      screenListeners={{
        state: (e) => {
          // Sync navigation state with journey context
          const routeName = e.data.state.routes[e.data.state.index].name;
          if (routeName === 'Health') {
            setCurrentJourney(JOURNEY_IDS.HEALTH);
          } else if (routeName === 'Care') {
            setCurrentJourney(JOURNEY_IDS.CARE);
          } else if (routeName === 'Plan') {
            setCurrentJourney(JOURNEY_IDS.PLAN);
          }
        },
      }}
    >
      <Tab.Screen name="Health" component={HealthScreen} />
      <Tab.Screen name="Care" component={CareScreen} />
      <Tab.Screen name="Plan" component={PlanScreen} />
    </Tab.Navigator>
  );
}

function App() {
  return (
    <AuthProvider>
      <JourneyProvider>
        <NavigationContainer>
          <MainNavigator />
        </NavigationContainer>
      </JourneyProvider>
    </AuthProvider>
  );
}

export default App;
```

## API Reference

### Providers

#### `<JourneyProvider>`

Manages the current journey state.

**Props:**

- `initialJourney?: JourneyId` - The initial journey to select (defaults to HEALTH)
- `onJourneyChange?: (journeyId: JourneyId) => void` - Callback when journey changes
- `children: React.ReactNode` - Child components

#### `<AuthProvider>`

Manages authentication state.

**Props:**

- `authConfig?: AuthConfig` - Optional authentication configuration
- `children: React.ReactNode` - Child components

#### `<GamificationProvider>`

Manages gamification state and events.

**Props:**

- `children: React.ReactNode` - Child components

#### `<NotificationProvider>`

Manages notifications.

**Props:**

- `children: React.ReactNode` - Child components

### Hooks

#### `useJourney()`

Access and update the current journey.

**Returns:**

- `currentJourney: Journey` - The currently selected journey
- `setCurrentJourney: (journeyId: JourneyId) => void` - Function to change the current journey
- `isJourneyLoading: boolean` - Whether journey data is loading
- `journeyError: Error | null` - Any error that occurred while loading journey data
- `availableJourneys: Journey[]` - List of all available journeys

#### `useAuth()`

Access authentication state and methods.

**Returns:**

- `isAuthenticated: boolean` - Whether the user is authenticated
- `isLoading: boolean` - Whether authentication is in progress
- `user: User | null` - The authenticated user or null
- `error: Error | null` - Any authentication error
- `login: (email: string, password: string) => Promise<void>` - Login function
- `logout: () => Promise<void>` - Logout function
- `register: (userData: RegisterData) => Promise<void>` - Registration function
- `getProfile: () => Promise<User>` - Get user profile function

#### `useGamification()`

Access gamification state and methods.

**Returns:**

- `gameProfile: GameProfile | null` - The user's game profile
- `isLoading: boolean` - Whether gamification data is loading
- `error: Error | null` - Any gamification error
- `triggerEvent: (event: GameEvent) => Promise<void>` - Function to trigger a gamification event
- `achievements: Achievement[]` - List of user achievements
- `quests: Quest[]` - List of available quests
- `rewards: Reward[]` - List of available rewards
- `hasAchievement: (achievementId: string) => boolean` - Check if user has an achievement
- `getQuestProgress: (questId: string) => number` - Get progress percentage for a quest

#### `useNotification()`

Access notification state and methods.

**Returns:**

- `notifications: Notification[]` - List of notifications
- `unreadCount: number` - Count of unread notifications
- `isLoading: boolean` - Whether notifications are loading
- `error: Error | null` - Any notification error
- `fetchNotifications: () => Promise<void>` - Function to fetch notifications
- `markAsRead: (notificationId: string) => Promise<void>` - Mark a notification as read
- `markAllAsRead: () => Promise<void>` - Mark all notifications as read
- `deleteNotification: (notificationId: string) => Promise<void>` - Delete a notification

### Constants

#### Journey IDs

```tsx
import { JOURNEY_IDS } from '@austa/journey-context/constants';

// Available journey IDs
JOURNEY_IDS.HEALTH // 'health'
JOURNEY_IDS.CARE   // 'care'
JOURNEY_IDS.PLAN   // 'plan'
```

#### Journey Data

```tsx
import { ALL_JOURNEYS } from '@austa/journey-context/constants';

// Array of all journey objects with metadata
// [{ id: 'health', name: 'Minha Saúde', ... }, ...]
console.log(ALL_JOURNEYS);
```

### Types

The package exports TypeScript types for all components and data structures:

```tsx
import { 
  JourneyId,
  Journey,
  JourneyContextType,
  AuthContextType,
  GamificationContextType,
  NotificationContextType,
  User,
  GameProfile,
  Achievement,
  Quest,
  Reward,
  GameEvent,
  Notification
} from '@austa/journey-context/types';
```

## Migrating from Previous Implementations

If you were previously using separate context implementations for web and mobile, follow these steps to migrate:

### 1. Update Imports

**Before:**

```tsx
// Web
import { JourneyContext, useJourney } from 'src/context/JourneyContext';

// Mobile
import { JourneyContext, useJourney } from 'src/context/JourneyContext';
```

**After:**

```tsx
// Both platforms
import { JourneyProvider, useJourney } from '@austa/journey-context';
```

### 2. Replace Context Providers

**Before:**

```tsx
// Web
import { JourneyProvider } from 'src/context/JourneyContext';
import { AuthProvider } from 'src/context/AuthContext';

// Mobile
import { JourneyProvider } from 'src/context/JourneyContext';
import { AuthProvider } from 'src/context/AuthContext';
```

**After:**

```tsx
// Both platforms
import { JourneyProvider, AuthProvider } from '@austa/journey-context';
```

### 3. Update Hook Usage

The hook APIs have been standardized across platforms, so you may need to update your usage:

**Before:**

```tsx
// Web might have had different properties
const { journey, setJourney } = useJourney();

// Mobile might have had different properties
const { currentJourney, changeJourney } = useJourney();
```

**After:**

```tsx
// Both platforms use the same API
const { currentJourney, setCurrentJourney } = useJourney();
```

## Integration with Other Packages

The `@austa/journey-context` package is designed to work seamlessly with other AUSTA SuperApp packages:

### Design System Integration

```tsx
import { useJourney } from '@austa/journey-context';
import { ThemeProvider } from '@austa/design-system';

function ThemedApp({ children }) {
  const { currentJourney } = useJourney();
  
  return (
    <ThemeProvider journeyId={currentJourney.id}>
      {children}
    </ThemeProvider>
  );
}
```

### Interface Integration

```tsx
import { useAuth } from '@austa/journey-context';
import { User } from '@austa/interfaces/auth';

function ProfileComponent() {
  const { user } = useAuth();
  
  // user is typed as User from @austa/interfaces/auth
  return <div>Welcome, {user?.name}</div>;
}
```

## Contributing

Please refer to the CONTRIBUTING.md file for information on how to contribute to this package.

## License

This package is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.