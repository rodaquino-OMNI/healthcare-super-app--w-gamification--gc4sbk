import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useParams } from 'react-router-native';
import { useNavigation } from '@react-navigation/native';

// Import from @austa/interfaces instead of local types
import { Claim } from '@austa/interfaces/plan';

// Import from @austa/design-system instead of direct imports
import { Card } from '@austa/design-system/components/Card';
import { Button } from '@austa/design-system/components/Button';
import { Text } from '@design-system/primitives/src/components/Text';

// Import journey context for state management
import { useJourney } from '@austa/journey-context/src/providers';

// Import API functions and hooks
import { useClaims } from 'src/web/mobile/src/hooks/useClaims';
import { MOBILE_PLAN_ROUTES } from 'src/web/shared/constants/routes';

// Import shared components
import { JourneyHeader } from 'src/web/mobile/src/components/shared/JourneyHeader';
import LoadingIndicator from 'src/web/mobile/src/components/shared/LoadingIndicator';
import ErrorState from 'src/web/mobile/src/components/shared/ErrorState';

// Import utility functions
import { formatDate } from 'src/web/shared/utils/format';

/**
 * Renders the Claim Detail screen, displaying information about a specific claim.
 * Uses journey-specific theming and standardized error handling.
 *
 * @returns The rendered ClaimDetail screen.
 */
export const ClaimDetail: React.FC = () => {
  // Get the current journey context
  const { currentJourney } = useJourney();

  // Retrieve the claim ID from the route parameters
  const { claimId } = useParams<{ claimId: string }>();

  // Get navigation object for screen transitions
  const navigation = useNavigation();

  // Fetch claims data using the standardized hook with error handling
  // TODO: Replace 'somePlanId' with actual planId from journey context or route params
  const { claims, isLoading, error, refetch } = useClaims('somePlanId');
  
  // Find the specific claim from the claims array
  const claim = claims?.find((c: Claim) => c.id === claimId);

  // Display loading state while fetching data
  if (isLoading) {
    return <LoadingIndicator label="Carregando detalhes da solicitação..." />;
  }

  // Display error state if there was an error fetching data
  if (error) {
    return (
      <ErrorState 
        message="Erro ao carregar detalhes da solicitação." 
        onRetry={refetch}
      />
    );
  }

  // Display not found state if claim doesn't exist
  if (!claim) {
    return (
      <ErrorState 
        message="Solicitação não encontrada." 
        onRetry={() => navigation.navigate(MOBILE_PLAN_ROUTES.CLAIMS as never)}
      />
    );
  }

  // Format the claim submission date
  const formattedDate = formatDate(claim.submittedAt, 'dd/MM/yyyy');

  return (
    <View style={styles.container}>
      {/* Journey-specific header with back button */}
      <JourneyHeader 
        title="Detalhes da Solicitação" 
        showBackButton 
        journey="plan"
      />

      {/* Claim details card with journey-specific styling */}
      <Card 
        journey="plan"
        elevation="md"
        testID="claim-detail-card"
        style={styles.card}
      >
        <View style={styles.row}>
          <Text fontWeight="bold">Tipo:</Text>
          <Text>{getClaimTypeLabel(claim.type)}</Text>
        </View>
        
        <View style={styles.row}>
          <Text fontWeight="bold">Valor:</Text>
          <Text>R$ {claim.amount.toFixed(2)}</Text>
        </View>
        
        <View style={styles.row}>
          <Text fontWeight="bold">Status:</Text>
          <Text>{getClaimStatusLabel(claim.status)}</Text>
        </View>
        
        <View style={styles.row}>
          <Text fontWeight="bold">Data de Envio:</Text>
          <Text>{formattedDate}</Text>
        </View>

        {claim.documents && claim.documents.length > 0 && (
          <View style={styles.documentsSection}>
            <Text fontWeight="bold" style={styles.sectionTitle}>Documentos Anexados</Text>
            {claim.documents.map((doc, index) => (
              <Text key={doc.id || index} style={styles.documentItem}>
                {doc.type}: {doc.filePath.split('/').pop()}
              </Text>
            ))}
          </View>
        )}
      </Card>

      {/* Navigation button with journey-specific styling */}
      <Button 
        onPress={() => navigation.navigate(MOBILE_PLAN_ROUTES.CLAIMS as never)}
        journey="plan"
        variant="primary"
        testID="back-to-claims-button"
        style={styles.button}
      >
        Voltar para o Histórico de Solicitações
      </Button>
    </View>
  );
};

/**
 * Helper function to get a user-friendly label for claim types
 * 
 * @param type - The claim type from the API
 * @returns A user-friendly label for the claim type
 */
const getClaimTypeLabel = (type: string): string => {
  const typeLabels: Record<string, string> = {
    medical: 'Médico',
    dental: 'Odontológico',
    vision: 'Oftalmológico',
    prescription: 'Medicamentos',
    other: 'Outro'
  };
  
  return typeLabels[type] || type;
};

/**
 * Helper function to get a user-friendly label for claim statuses
 * 
 * @param status - The claim status from the API
 * @returns A user-friendly label for the claim status
 */
const getClaimStatusLabel = (status: string): string => {
  const statusLabels: Record<string, string> = {
    pending: 'Pendente',
    approved: 'Aprovado',
    denied: 'Negado',
    additional_info_required: 'Informações Adicionais Necessárias'
  };
  
  return statusLabels[status] || status;
};

// Styles for the component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  card: {
    margin: 16,
    padding: 16
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef'
  },
  documentsSection: {
    marginTop: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef'
  },
  sectionTitle: {
    marginBottom: 8
  },
  documentItem: {
    paddingVertical: 4
  },
  button: {
    margin: 16
  }
});