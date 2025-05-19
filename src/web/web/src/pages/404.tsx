import React from 'react';
import { Box, Text, Heading } from '@austa/design-system';
import { useTranslation } from 'src/web/web/src/i18n';

/**
 * 404 Not Found page component
 * Displays a localized error message when users navigate to non-existent routes
 * Uses journey-neutral theme styling
 */
const NotFoundPage: React.FC = () => {
  // Get translation function for localized text
  const { t } = useTranslation();

  return (
    <Box 
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      padding="xl"
      minHeight="100vh"
    >
      <Heading 
        level={1} 
        marginBottom="lg"
        textAlign="center"
      >
        404 - {t('errors.pageNotFound', 'Página Não Encontrada')}
      </Heading>
      
      <Text 
        size="lg" 
        textAlign="center"
        marginBottom="xl"
      >
        {t('errors.pageNotFoundMessage', 'Desculpe, a página que você está procurando não existe.')}
      </Text>
      
      <Box marginTop="md">
        <Text 
          as="a" 
          href="/"
          color="brand.primary"
          textDecoration="underline"
          size="md"
        >
          {t('common.back')} {t('navigation.home')}
        </Text>
      </Box>
    </Box>
  );
};

export default NotFoundPage;