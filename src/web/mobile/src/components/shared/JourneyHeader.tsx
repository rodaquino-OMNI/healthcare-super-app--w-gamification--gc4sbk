import React from 'react';
import { StatusBar, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import primitives from the new package structure
import { Box } from '@design-system/primitives';
import { Text } from '@design-system/primitives';
import { Icon } from '@design-system/primitives';
import { Touchable } from '@design-system/primitives';

// Import journey context from the new package
import { useJourney } from '@austa/journey-context';

// Import journey constants and types from interfaces package
import { JOURNEY_NAMES, JOURNEY_COLORS, JOURNEY_ICONS } from '@austa/interfaces/common';
import { JourneyHeaderProps } from '@austa/interfaces/components';

/**
 * A component that renders a journey-specific header with appropriate styling,
 * title, and navigation options.
 */
export const JourneyHeader: React.FC<JourneyHeaderProps> = ({
  title,
  showBackButton = false,
  onBackPress,
  rightActions,
  transparent = false,
}) => {
  const { journey } = useJourney();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  // Determine the journey-specific color, name, and icon
  const journeyColor = JOURNEY_COLORS[journey.toUpperCase()];
  const journeyName = title || JOURNEY_NAMES[journey.toUpperCase()];
  const journeyIcon = JOURNEY_ICONS[journey.toUpperCase()];
  
  // Set status bar style based on platform
  if (Platform.OS === 'ios') {
    StatusBar.setBarStyle('dark-content', true);
  } else if (Platform.OS === 'android') {
    StatusBar.setBackgroundColor(transparent ? 'transparent' : journeyColor);
    StatusBar.setBarStyle('light-content');
  }
  
  // Handle back button press
  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };
  
  return (
    <Box 
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      paddingHorizontal={16}
      paddingTop={insets.top + 10}
      paddingBottom={10}
      backgroundColor={transparent ? 'transparent' : journeyColor}
      shadowColor="#000"
      shadowOpacity={transparent ? 0 : 0.1}
      shadowOffset={{ width: 0, height: 2 }}
      shadowRadius={4}
      elevation={transparent ? 0 : 3}
    >
      <Box flexDirection="row" alignItems="center">
        {showBackButton && (
          <Touchable 
            onPress={handleBackPress}
            accessibilityLabel="Go back"
            padding={8}
            marginRight={8}
          >
            <Icon 
              name="arrow-back" 
              size="24px" 
              color={transparent ? journeyColor : '#FFFFFF'}
            />
          </Touchable>
        )}
        <Icon 
          name={journeyIcon} 
          size="24px" 
          color={transparent ? journeyColor : '#FFFFFF'} 
          aria-hidden="true"
          style={{ marginRight: 8 }}
        />
        <Text 
          fontSize="xl" 
          fontWeight="medium" 
          color={transparent ? journeyColor : '#FFFFFF'}
        >
          {journeyName}
        </Text>
      </Box>
      
      {rightActions && (
        <Box flexDirection="row" alignItems="center">
          {rightActions}
        </Box>
      )}
    </Box>
  );
};