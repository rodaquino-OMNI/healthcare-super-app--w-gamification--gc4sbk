import React from 'react';
import { useNavigation } from '@react-navigation/native';

// Import primitives from @design-system/primitives
import { Box } from '@design-system/primitives/components/Box';
import { Text } from '@design-system/primitives/components/Text';
import { Touchable } from '@design-system/primitives/components/Touchable';

// Import from @austa/design-system
import { Divider } from '@austa/design-system/components/Divider';
import { Icon } from '@austa/design-system/components/Icon';

// Import from @austa/journey-context instead of local hook
import { useJourney } from '@austa/journey-context/hooks';
import { useAuth } from '../../hooks/useAuth';

// Import types from @austa/interfaces
import { JourneyType } from '@austa/interfaces/common/types';

// Define SettingsOptionType interface if not available in interfaces package
interface SettingsOptionType {
  id: string;
  label: string;
  onPress: () => void;
  accessibilityHint: string;
  journey?: JourneyType;
}

// Import constants
import { ROUTES } from '../../constants/routes';

/**
 * Displays the settings screen with options to manage profile and app settings.
 * Implements the "Preferences & Settings" requirement from User Management Features.
 */
export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { signOut } = useAuth();
  const { journey } = useJourney();

  // Function to handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
      // Navigation to login screen is handled by the auth state change
    } catch (error) {
      console.error('Error signing out:', error);
      // Show error message to user
    }
  };

  // Settings sections with options
  const settingsSections = [
    {
      title: 'Conta',
      options: [
        {
          id: 'profile',
          label: 'Perfil Pessoal',
          onPress: () => navigation.navigate(ROUTES.PROFILE),
          accessibilityHint: 'Navega para a tela de perfil pessoal',
        },
        {
          id: 'mfa',
          label: 'Autenticação de Dois Fatores',
          onPress: () => navigation.navigate(ROUTES.AUTH_MFA),
          accessibilityHint: 'Navega para a tela de autenticação de dois fatores',
        },
      ],
    },
    {
      title: 'Preferências',
      options: [
        {
          id: 'notifications',
          label: 'Notificações',
          onPress: () => navigation.navigate(ROUTES.NOTIFICATIONS),
          accessibilityHint: 'Navega para a tela de configurações de notificações',
        },
        {
          id: 'language',
          label: 'Idioma',
          onPress: () => {/* Will navigate to language settings */},
          accessibilityHint: 'Navega para a tela de configurações de idioma',
        },
        {
          id: 'privacy',
          label: 'Privacidade',
          onPress: () => {/* Will navigate to privacy settings */},
          accessibilityHint: 'Navega para a tela de configurações de privacidade',
        },
      ],
    },
    {
      title: 'Jornadas',
      options: [
        {
          id: 'health',
          label: 'Minha Saúde',
          onPress: () => navigation.navigate(ROUTES.HEALTH_DASHBOARD),
          accessibilityHint: 'Navega para o painel da jornada de saúde',
          journey: 'health' as JourneyType,
        },
        {
          id: 'care',
          label: 'Cuidar-me Agora',
          onPress: () => navigation.navigate(ROUTES.CARE_DASHBOARD),
          accessibilityHint: 'Navega para o painel da jornada de cuidados',
          journey: 'care' as JourneyType,
        },
        {
          id: 'plan',
          label: 'Meu Plano & Benefícios',
          onPress: () => navigation.navigate(ROUTES.PLAN_DASHBOARD),
          accessibilityHint: 'Navega para o painel da jornada de plano',
          journey: 'plan' as JourneyType,
        },
      ],
    },
    {
      title: 'Suporte',
      options: [
        {
          id: 'help',
          label: 'Central de Ajuda',
          onPress: () => {/* Will navigate to help center */},
          accessibilityHint: 'Navega para a central de ajuda',
        },
        {
          id: 'terms',
          label: 'Termos e Condições',
          onPress: () => {/* Will navigate to terms and conditions */},
          accessibilityHint: 'Navega para os termos e condições',
        },
        {
          id: 'about',
          label: 'Sobre o App',
          onPress: () => {/* Will navigate to about app */},
          accessibilityHint: 'Navega para informações sobre o aplicativo',
        },
      ],
    },
  ];

  // Get journey-specific color for theming
  const getJourneyColor = (optionJourney?: JourneyType) => {
    // If the option has a specific journey, use that journey's color
    const journeyToUse = optionJourney || journey;
    
    switch(journeyToUse) {
      case 'health':
        return '#0ACF83'; // Green for Health journey
      case 'care':
        return '#FF8C42'; // Orange for Care journey
      case 'plan':
        return '#3A86FF'; // Blue for Plan journey
      default:
        return '#0066CC'; // Default brand color
    }
  };

  return (
    <Box 
      flex={1} 
      padding={20} 
      backgroundColor="#FFFFFF"
      accessibilityRole="region"
      accessibilityLabel="Configurações do aplicativo"
    >
      {settingsSections.map((section, sectionIndex) => (
        <Box key={`section-${sectionIndex}`} marginBottom={sectionIndex === settingsSections.length - 1 ? 0 : 10}>
          <Text 
            fontSize={18} 
            fontWeight="bold" 
            marginTop={sectionIndex === 0 ? 0 : 20} 
            marginBottom={10} 
            color={getJourneyColor()}
            accessibilityRole="header"
          >
            {section.title}
          </Text>
          
          {section.options.map((option: SettingsOptionType, optionIndex) => (
            <Touchable 
              key={option.id}
              flexDirection="row" 
              alignItems="center" 
              justifyContent="space-between" 
              paddingVertical={15}
              borderBottomWidth={1} 
              borderBottomColor="#eee"
              onPress={option.onPress}
              accessibilityLabel={option.label}
              accessibilityHint={option.accessibilityHint}
              accessibilityRole="button"
            >
              <Text 
                fontSize={16}
                color={option.journey ? getJourneyColor(option.journey) : '#000000'}
              >
                {option.label}
              </Text>
              <Icon 
                name="chevron-right" 
                size={16} 
                color="#757575" 
                accessibilityLabel="Navegar"
              />
            </Touchable>
          ))}
        </Box>
      ))}
      
      <Box marginTop={30}>
        <Divider color="#eee" />
        <Touchable 
          paddingVertical={15}
          onPress={handleSignOut}
          accessibilityLabel="Sair do aplicativo"
          accessibilityRole="button"
        >
          <Text fontSize={16} color="#FF3B30" textAlign="center">
            Sair
          </Text>
        </Touchable>
      </Box>
    </Box>
  );
};