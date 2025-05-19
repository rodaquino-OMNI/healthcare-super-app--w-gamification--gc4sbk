import React from 'react'; // v18.2.0
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'; // v6.5.8
import { useNavigation } from '@react-navigation/native'; // v6.1.7

// Import from @austa/journey-context for journey-based state management
import { useJourney, useAuth } from '@austa/journey-context/providers';

// Import from @austa/design-system for consistent UI components
import { Icon } from '@design-system/primitives/components';

// Import from @austa/interfaces for shared TypeScript models
import { JourneyType } from '@austa/interfaces/common';
import { RouteNames } from '@austa/interfaces/navigation';

// Import local navigators
import { AuthNavigator } from './AuthNavigator';
import HealthNavigator from './HealthNavigator';
import CareNavigator from './CareNavigator';
import PlanNavigator from './PlanNavigator';

// Import screens
import { Home } from '../screens/home/Home';
import { NotificationsScreen } from '../screens/home/Notifications';
import { ProfileScreen } from '../screens/home/Profile';
import Achievements from '../screens/home/Achievements';

// Create a Bottom Tab Navigator using createBottomTabNavigator from React Navigation
const Tab = createBottomTabNavigator();

/**
 * MainNavigator component that handles the main tab navigation for authenticated users.
 * Integrates with @austa/journey-context for journey-based state management and styling.
 * Uses @austa/design-system components for consistent UI across the application.
 */
export const MainNavigator: React.FC = () => {
  // Retrieve the authentication status using the useAuth hook from @austa/journey-context
  const { isAuthenticated } = useAuth();
  
  // Retrieve the current journey and journey-switching function from @austa/journey-context
  const { currentJourney, setCurrentJourney } = useJourney();
  
  // Retrieve the navigation object using the useNavigation hook
  const navigation = useNavigation();

  // If the user is not authenticated, render the AuthNavigator
  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  /**
   * Get the appropriate icon name based on the route name and whether it's focused
   * @param routeName - The name of the route
   * @param focused - Whether the tab is currently focused
   * @returns The name of the icon to display
   */
  const getIconName = (routeName: string, focused: boolean): string => {
    switch (routeName) {
      case RouteNames.HOME:
        return focused ? 'home-filled' : 'home-outline';
      case JourneyType.HEALTH:
        return focused ? 'health-filled' : 'health-outline';
      case JourneyType.CARE:
        return focused ? 'care-filled' : 'care-outline';
      case JourneyType.PLAN:
        return focused ? 'plan-filled' : 'plan-outline';
      case RouteNames.NOTIFICATIONS:
        return focused ? 'notification-filled' : 'notification-outline';
      case RouteNames.PROFILE:
        return focused ? 'profile-filled' : 'profile-outline';
      case RouteNames.ACHIEVEMENTS:
        return focused ? 'achievement-filled' : 'achievement-outline';
      default:
        return 'home-outline';
    }
  };

  /**
   * Get the appropriate color for the tab based on the route name and whether it's focused
   * @param routeName - The name of the route
   * @param focused - Whether the tab is currently focused
   * @returns The color to use for the tab
   */
  const getTabColor = (routeName: string, focused: boolean): string => {
    if (!focused) return 'neutral.gray500';
    
    // Use journey-specific colors for journey tabs
    switch (routeName) {
      case JourneyType.HEALTH:
        return 'journeys.health.primary';
      case JourneyType.CARE:
        return 'journeys.care.primary';
      case JourneyType.PLAN:
        return 'journeys.plan.primary';
      default:
        return 'brand.primary';
    }
  };

  /**
   * Handle tab press to update the current journey when a journey tab is pressed
   * @param routeName - The name of the route that was pressed
   */
  const handleTabPress = (routeName: string) => {
    // Update the current journey when a journey tab is pressed
    if (
      routeName === JourneyType.HEALTH ||
      routeName === JourneyType.CARE ||
      routeName === JourneyType.PLAN
    ) {
      setCurrentJourney(routeName as JourneyType);
    }
  };

  // Render the Tab Navigator with the defined screens
  return (
    <Tab.Navigator
      initialRouteName={RouteNames.HOME}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const iconName = getIconName(route.name, focused);
          return (
            <Icon 
              name={iconName} 
              size={size} 
              color={color}
              testID={`tab-icon-${route.name.toLowerCase()}`}
            />
          );
        },
        tabBarActiveTintColor: getTabColor(route.name, true),
        tabBarInactiveTintColor: getTabColor(route.name, false),
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'Roboto-Medium',
        },
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
      })}
    >
      {/* Define the screens within the main app flow */}
      <Tab.Screen 
        name={RouteNames.HOME} 
        component={Home} 
        listeners={{
          tabPress: () => handleTabPress(RouteNames.HOME)
        }}
      />
      <Tab.Screen 
        name={JourneyType.HEALTH} 
        component={HealthNavigator} 
        listeners={{
          tabPress: () => handleTabPress(JourneyType.HEALTH)
        }}
      />
      <Tab.Screen 
        name={JourneyType.CARE} 
        component={CareNavigator} 
        listeners={{
          tabPress: () => handleTabPress(JourneyType.CARE)
        }}
      />
      <Tab.Screen 
        name={JourneyType.PLAN} 
        component={PlanNavigator} 
        listeners={{
          tabPress: () => handleTabPress(JourneyType.PLAN)
        }}
      />
      <Tab.Screen 
        name={RouteNames.NOTIFICATIONS} 
        component={NotificationsScreen} 
        listeners={{
          tabPress: () => handleTabPress(RouteNames.NOTIFICATIONS)
        }}
      />
      <Tab.Screen 
        name={RouteNames.PROFILE} 
        component={ProfileScreen} 
        listeners={{
          tabPress: () => handleTabPress(RouteNames.PROFILE)
        }}
      />
      <Tab.Screen 
        name={RouteNames.ACHIEVEMENTS} 
        component={Achievements} 
        listeners={{
          tabPress: () => handleTabPress(RouteNames.ACHIEVEMENTS)
        }}
      />
    </Tab.Navigator>
  );
};