import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';

// Import primitives from @design-system/primitives
import { Box } from '@design-system/primitives/components/Box';
import { Text } from '@design-system/primitives/components/Text';
import { Touchable } from '@design-system/primitives/components/Touchable';

// Import Avatar from design system
import { Avatar } from '@austa/design-system/components/Avatar';

// Import hooks
import { useAuth, useJourney } from '@austa/journey-context';

// Import types
import { User } from '@austa/interfaces/auth/user.types';

// Import constants
import { ROUTES } from '../../constants/routes';
import { ProfileForm } from '../../components/forms/ProfileForm';

/**
 * Displays the user profile screen, allowing users to view and edit their profile information.
 * It integrates with the authentication context to retrieve and update user data.
 */
export const ProfileScreen: React.FC = () => {
  const { session, getUserFromToken } = useAuth();
  const { currentJourney } = useJourney();
  const navigation = useNavigation();
  const [isEditing, setIsEditing] = useState(false);

  // Get user data from the JWT token
  const user = session?.accessToken ? getUserFromToken(session.accessToken) : null;

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const navigateToSettings = () => {
    navigation.navigate(ROUTES.SETTINGS);
  };

  if (!user) {
    return (
      <Box flex={1} padding={20} backgroundColor="#FFFFFF">
        <Box 
          padding={20} 
          borderRadius={8} 
          backgroundColor="#FFF3F2" 
          borderColor="#FFCDD2" 
          borderWidth={1} 
          marginTop={20}
          accessibilityRole="alert"
        >
          <Text 
            fontSize={16} 
            textAlign="center" 
            color="#FF3B30"
            accessibilityLabel="User information not available. Please login again."
          >
            User information not available. Please login again.
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flex={1} padding={20} backgroundColor="#FFFFFF">
      <Box alignItems="center" marginBottom={20}>
        <Avatar 
          src={user.avatar} 
          name={user.name || 'User'}
          size="80px"
          journey={currentJourney || 'health'}
          fallbackType={user.name ? 'initials' : 'icon'}
          aria-label={`Profile picture for ${user.name || 'User'}`}
          testID="profile-avatar"
        />
        
        {!isEditing && (
          <Box alignItems="center" marginTop={10}>
            <Text 
              fontSize={24} 
              fontWeight="bold" 
              marginBottom={5}
              accessibilityRole="header"
            >
              {user.name || 'User'}
            </Text>
            <Text 
              fontSize={16} 
              color="#757575"
              accessibilityLabel={`Email: ${user.email}`}
            >
              {user.email}
            </Text>
          </Box>
        )}
      </Box>

      {isEditing ? (
        <Box marginTop={20}>
          <ProfileForm />
          <Box marginTop={20}>
            <Touchable
              onPress={handleEditToggle}
              accessibilityLabel="Cancel editing profile"
              accessibilityRole="button"
              testID="cancel-edit-button"
            >
              <Box padding={15} alignItems="center">
                <Text color="#0066CC" fontSize={16}>
                  Cancel
                </Text>
              </Box>
            </Touchable>
          </Box>
        </Box>
      ) : (
        <Box marginTop={20}>
          <Touchable
            onPress={handleEditToggle}
            accessibilityLabel="Edit your profile"
            accessibilityRole="button"
            testID="edit-profile-button"
          >
            <Box 
              backgroundColor="#0066CC" 
              borderRadius={8} 
              padding={15} 
              alignItems="center" 
              marginBottom={10}
            >
              <Text color="#FFFFFF" fontSize={16} fontWeight="500">
                Edit Profile
              </Text>
            </Box>
          </Touchable>
          
          <Touchable
            onPress={navigateToSettings}
            accessibilityLabel="Go to settings"
            accessibilityRole="button"
            testID="settings-button"
          >
            <Box 
              backgroundColor="#0066CC" 
              borderRadius={8} 
              padding={15} 
              alignItems="center" 
              marginBottom={10}
            >
              <Text color="#FFFFFF" fontSize={16} fontWeight="500">
                Settings
              </Text>
            </Box>
          </Touchable>
        </Box>
      )}
    </Box>
  );
};