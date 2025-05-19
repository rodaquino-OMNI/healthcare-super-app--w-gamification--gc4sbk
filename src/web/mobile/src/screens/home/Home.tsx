import React from 'react';
import { ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Box } from '@design-system/primitives/src/components/Box';
import { Text } from '@design-system/primitives/src/components/Text';
import { Stack } from '@design-system/primitives/src/components/Stack';
import { Button } from '@austa/design-system/src/components/Button';
import { Card } from '@austa/design-system/src/components/Card';
import { AchievementBadge } from '@austa/design-system/src/gamification/AchievementBadge';
import { LevelIndicator } from '@austa/design-system/src/gamification/LevelIndicator';
import { XPCounter } from '@austa/design-system/src/gamification/XPCounter';
import { useAuth } from '@austa/journey-context/src/hooks/useAuth';
import { useJourney } from '@austa/journey-context/src/hooks/useJourney';
import { useGamification } from '@austa/journey-context/src/hooks/useGamification';
import { useNotification } from '@austa/journey-context/src/hooks/useNotification';
import { formatRelativeDate } from '@austa/shared/utils/date';
import { formatCurrency } from '@austa/shared/utils/format';
import { HomeScreenProps } from '@austa/interfaces/components';
import { JOURNEY_NAMES } from '../../constants/journeys';

/**
 * Renders the Home screen, displaying key information and navigation options for each journey.
 * This is the main dashboard screen of the mobile application that serves as the entry point for users.
 *
 * @returns {JSX.Element} The rendered Home screen component.
 */
const HomeScreen: React.FC<HomeScreenProps> = () => {
  // Access navigation for screen transitions
  const navigation = useNavigation();
  
  // Access authentication context for user information
  const { user, isAuthenticated } = useAuth();
  
  // Access journey context for journey-specific theming and navigation
  const { currentJourney, setJourney } = useJourney();
  
  // Access gamification context for achievements and XP
  const { gameProfile, achievements, quests } = useGamification();
  
  // Access notification context for unread count
  const { unreadCount, notifications } = useNotification();
  
  // Get recent notifications
  const recentNotifications = notifications?.slice(0, 3) || [];
  
  // Get recent achievements
  const recentAchievements = achievements?.slice(0, 3) || [];
  
  // Handle journey selection
  const handleJourneySelect = (journey: string) => {
    setJourney(journey);
    navigation.navigate(journey);
  };

  // Navigate to notifications screen
  const handleNotificationsPress = () => {
    navigation.navigate('Notifications');
  };

  // Navigate to profile screen
  const handleProfilePress = () => {
    navigation.navigate('Profile');
  };

  return (
    <Box flex={1} backgroundColor="background">
      {/* App header with user info and navigation */}
      <Box 
        padding="md" 
        backgroundColor="primary" 
        flexDirection="row" 
        justifyContent="space-between"
        alignItems="center"
      >
        <Box flexDirection="row" alignItems="center">
          <Text 
            color="white" 
            fontSize="xl" 
            fontWeight="bold"
            accessibilityRole="header"
          >
            AUSTA SuperApp
          </Text>
        </Box>
        <Box flexDirection="row">
          <Button 
            variant="tertiary" 
            size="sm" 
            onPress={handleNotificationsPress}
            accessibilityLabel={`Notifications, ${unreadCount} unread`}
            accessibilityHint="Double tap to view all notifications"
            icon="bell"
          >
            {unreadCount > 0 && <Text color="white">{unreadCount}</Text>}
          </Button>
          <Box width={8} />
          <Button 
            variant="tertiary" 
            size="sm" 
            onPress={handleProfilePress}
            accessibilityLabel="Profile and settings"
            accessibilityHint="Double tap to view your profile"
            icon="user"
          />
        </Box>
      </Box>

      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        accessibilityLabel="Home screen content"
      >
        {/* User profile and gamification section */}
        <Box padding="md">
          <Card 
            elevation="md" 
            journey={currentJourney.toLowerCase()}
            accessibilityLabel="Your profile summary"
          >
            <Stack direction="row" spacing="md" alignItems="center">
              <Box 
                width={60} 
                height={60} 
                borderRadius="full" 
                backgroundColor="primaryLight"
                justifyContent="center"
                alignItems="center"
              >
                <Text fontSize="xl" fontWeight="bold">
                  {user?.name?.charAt(0) || 'U'}
                </Text>
              </Box>
              <Box flex={1}>
                <Text fontSize="lg" fontWeight="bold">
                  {user?.name || 'User'}
                </Text>
                <Text fontSize="sm" color="textSecondary">
                  {user?.email || 'user@example.com'}
                </Text>
              </Box>
              <Stack direction="column" spacing="xs" alignItems="flex-end">
                <LevelIndicator 
                  level={gameProfile?.level || 1} 
                  journey={currentJourney.toLowerCase()}
                />
                <XPCounter 
                  currentXP={gameProfile?.xp || 0} 
                  nextLevelXP={gameProfile?.nextLevelXP || 100}
                  journey={currentJourney.toLowerCase()}
                />
              </Stack>
            </Stack>
          </Card>
        </Box>

        {/* Journey cards section */}
        <Box padding="md">
          <Text 
            fontSize="lg" 
            fontWeight="bold" 
            marginBottom="sm"
            accessibilityRole="header"
          >
            Your Journeys
          </Text>
          <Stack direction="column" spacing="md">
            {/* Health Journey Card */}
            <Card 
              elevation="md" 
              journey="health"
              onPress={() => handleJourneySelect(JOURNEY_NAMES.HEALTH)}
              accessibilityLabel="Health Journey"
              accessibilityHint="Double tap to navigate to your health dashboard"
            >
              <Stack direction="row" spacing="md" alignItems="center">
                <Box 
                  width={50} 
                  height={50} 
                  borderRadius="md" 
                  backgroundColor="healthPrimary"
                  justifyContent="center"
                  alignItems="center"
                >
                  <Text color="white" fontSize="xl">H</Text>
                </Box>
                <Box flex={1}>
                  <Text fontSize="md" fontWeight="bold" color="healthPrimary">
                    My Health
                  </Text>
                  <Text fontSize="sm" color="textSecondary">
                    Track your health metrics and goals
                  </Text>
                </Box>
              </Stack>
            </Card>

            {/* Care Journey Card */}
            <Card 
              elevation="md" 
              journey="care"
              onPress={() => handleJourneySelect(JOURNEY_NAMES.CARE)}
              accessibilityLabel="Care Journey"
              accessibilityHint="Double tap to navigate to your care dashboard"
            >
              <Stack direction="row" spacing="md" alignItems="center">
                <Box 
                  width={50} 
                  height={50} 
                  borderRadius="md" 
                  backgroundColor="carePrimary"
                  justifyContent="center"
                  alignItems="center"
                >
                  <Text color="white" fontSize="xl">C</Text>
                </Box>
                <Box flex={1}>
                  <Text fontSize="md" fontWeight="bold" color="carePrimary">
                    Care Now
                  </Text>
                  <Text fontSize="sm" color="textSecondary">
                    Appointments and healthcare access
                  </Text>
                </Box>
              </Stack>
            </Card>

            {/* Plan Journey Card */}
            <Card 
              elevation="md" 
              journey="plan"
              onPress={() => handleJourneySelect(JOURNEY_NAMES.PLAN)}
              accessibilityLabel="Plan Journey"
              accessibilityHint="Double tap to navigate to your plan dashboard"
            >
              <Stack direction="row" spacing="md" alignItems="center">
                <Box 
                  width={50} 
                  height={50} 
                  borderRadius="md" 
                  backgroundColor="planPrimary"
                  justifyContent="center"
                  alignItems="center"
                >
                  <Text color="white" fontSize="xl">P</Text>
                </Box>
                <Box flex={1}>
                  <Text fontSize="md" fontWeight="bold" color="planPrimary">
                    My Plan & Benefits
                  </Text>
                  <Text fontSize="sm" color="textSecondary">
                    Insurance coverage and claims
                  </Text>
                </Box>
              </Stack>
            </Card>
          </Stack>
        </Box>

        {/* Recent activity section */}
        <Box padding="md">
          <Text 
            fontSize="lg" 
            fontWeight="bold" 
            marginBottom="sm"
            accessibilityRole="header"
          >
            Recent Activity
          </Text>
          <Card elevation="sm">
            <Stack direction="column" spacing="md">
              {recentNotifications.length > 0 ? (
                recentNotifications.map((notification, index) => (
                  <Box 
                    key={notification.id || index}
                    paddingVertical="sm"
                    borderBottomWidth={index < recentNotifications.length - 1 ? 1 : 0}
                    borderBottomColor="borderLight"
                  >
                    <Text fontSize="sm" fontWeight="bold">
                      {notification.title}
                    </Text>
                    <Text fontSize="xs" color="textSecondary">
                      {formatRelativeDate(notification.createdAt)}
                    </Text>
                  </Box>
                ))
              ) : (
                <Box padding="md" alignItems="center">
                  <Text color="textSecondary">No recent activity</Text>
                </Box>
              )}
            </Stack>
          </Card>
        </Box>

        {/* Achievements section */}
        <Box padding="md">
          <Text 
            fontSize="lg" 
            fontWeight="bold" 
            marginBottom="sm"
            accessibilityRole="header"
          >
            Your Achievements
          </Text>
          <Card elevation="sm">
            <Stack direction="row" spacing="md" justifyContent="space-around" padding="sm">
              {recentAchievements.length > 0 ? (
                recentAchievements.map((achievement, index) => (
                  <AchievementBadge
                    key={achievement.id || index}
                    achievement={achievement}
                    size="md"
                    journey={achievement.journeyType?.toLowerCase() || currentJourney.toLowerCase()}
                  />
                ))
              ) : (
                <Box padding="md" alignItems="center" width="100%">
                  <Text color="textSecondary">Complete activities to earn achievements</Text>
                </Box>
              )}
            </Stack>
          </Card>
        </Box>

        {/* Bottom spacing */}
        <Box height={20} />
      </ScrollView>
    </Box>
  );
};

export default HomeScreen;