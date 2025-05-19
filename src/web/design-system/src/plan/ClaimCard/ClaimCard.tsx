import React from 'react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

// Import primitives from @design-system/primitives package
import { Text } from '@design-system/primitives/components/Text';
import { Icon } from '@design-system/primitives/components/Icon';
import { Box } from '@design-system/primitives/components/Box';

// Import theme tokens from primitives package
import { tokens } from '@design-system/primitives/tokens';

// Import from @austa/interfaces for type safety
import { Claim, ClaimStatus } from '@austa/interfaces/plan';

// Import components from design system
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';

// Import styled components
import {
  ClaimCardContainer,
  ClaimCardHeader,
  ClaimCardBody,
  ClaimCardFooter,
  ClaimStatusText,
} from './ClaimCard.styles';

export interface ClaimCardProps {
  /**
   * The claim data to display
   */
  claim: Claim;
  
  /**
   * Function to call when the card is pressed
   */
  onPress?: () => void;
  
  /**
   * Function to call when the View Details button is pressed
   */
  onViewDetails?: () => void;
  
  /**
   * Function to call when the Track Claim button is pressed
   */
  onTrackClaim?: () => void;
  
  /**
   * Whether to show action buttons
   * @default true
   */
  showActions?: boolean;
  
  /**
   * Whether to show a compact version of the card
   * @default false
   */
  compact?: boolean;
  
  /**
   * Accessibility label for the card
   */
  accessibilityLabel?: string;
}

/**
 * Helper function to determine the appropriate icon based on claim status
 */
const getStatusIcon = (status: ClaimStatus): string => {
  switch (status) {
    case 'approved':
      return 'check-circle';
    case 'denied':
      return 'x-circle';
    case 'additional_info_required':
      return 'alert-circle';
    case 'pending':
    default:
      return 'clock';
  }
};

/**
 * Helper function to determine the appropriate color based on claim status
 */
const getStatusColor = (status: ClaimStatus): string => {
  switch (status) {
    case 'approved':
      return tokens.colors.semantic.success;
    case 'denied':
      return tokens.colors.semantic.error;
    case 'additional_info_required':
      return tokens.colors.semantic.warning;
    case 'pending':
    default:
      return tokens.colors.semantic.info;
  }
};

/**
 * Helper function to format currency values
 */
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(amount);
};

/**
 * Maps ClaimStatus to the status prop expected by ClaimStatusText component
 */
type StatusTextType = 'pending' | 'approved' | 'denied' | 'inReview' | 'moreInfo';

const mapClaimStatusToStatusText = (status: ClaimStatus): StatusTextType => {
  switch (status) {
    case 'additional_info_required':
      return 'moreInfo';
    case 'approved':
      return 'approved';
    case 'denied':
      return 'denied';
    case 'pending':
      return 'pending';
    default:
      return 'pending';
  }
};

/**
 * Component for displaying insurance claim information in a card format
 * 
 * @example
 * <ClaimCard 
 *   claim={claimData} 
 *   onViewDetails={() => handleViewDetails(claimData.id)} 
 *   onTrackClaim={() => handleTrackClaim(claimData.id)} 
 * />
 */
export const ClaimCard: React.FC<ClaimCardProps> = ({
  claim,
  onPress,
  onViewDetails,
  onTrackClaim,
  showActions = true,
  compact = false,
  accessibilityLabel,
}) => {
  const { t } = useTranslation();
  const statusIcon = getStatusIcon(claim.status);
  const statusColor = getStatusColor(claim.status);
  
  const formattedAmount = formatCurrency(claim.amount);
  const formattedDate = format(new Date(claim.submittedAt), 'dd/MM/yyyy');
  
  // Map the status to the ClaimStatusText component status prop
  const mappedStatus = mapClaimStatusToStatusText(claim.status);
  
  // Generate descriptive accessibility label if not provided
  const generatedAccessibilityLabel = `${t(`claim.type.${claim.type}`)}, ${formattedAmount}, ${t(`claim.status.${claim.status}`)}${claim.documents.length > 0 ? `, ${t('claim.documents', { count: claim.documents.length })}` : ''}`;
  
  return (
    <Card
      journey="plan"
      onPress={onPress}
      interactive={!!onPress}
      accessibilityLabel={accessibilityLabel || generatedAccessibilityLabel}
      role="article"
      aria-labelledby={`claim-${claim.id}-title claim-${claim.id}-amount claim-${claim.id}-status`}
    >
      <ClaimCardHeader>
        <Text 
          fontWeight="medium" 
          fontSize={compact ? 'sm' : 'md'}
          id={`claim-${claim.id}-title`}
        >
          {t(`claim.type.${claim.type}`)}
        </Text>
        <Text 
          fontSize="sm" 
          color="neutral.gray600"
          aria-label={t('claim.submittedOnAriaLabel', { date: formattedDate })}
        >
          {t('claim.submittedOn')} {formattedDate}
        </Text>
      </ClaimCardHeader>
      
      <ClaimCardBody>
        <Text 
          fontWeight="bold" 
          fontSize={compact ? 'lg' : 'xl'}
          id={`claim-${claim.id}-amount`}
        >
          {formattedAmount}
        </Text>
        
        {!compact && claim.documents.length > 0 && (
          <Text 
            fontSize="sm"
            aria-label={t('claim.documentsAriaLabel', { count: claim.documents.length })}
          >
            {t('claim.documents', { count: claim.documents.length })}
          </Text>
        )}
      </ClaimCardBody>
      
      <ClaimCardFooter>
        <ClaimStatusText 
          status={mappedStatus}
          id={`claim-${claim.id}-status`}
          aria-live="polite"
        >
          <Icon 
            name={statusIcon} 
            size="16px" 
            aria-hidden="true"
            color={statusColor}
          />
          <Text marginLeft="xs">
            {t(`claim.status.${claim.status}`)}
          </Text>
        </ClaimStatusText>
        
        {showActions && !compact && (
          <Box display="flex" flexDirection="row" gap="sm">
            {onViewDetails && (
              <Button 
                variant="tertiary" 
                size="sm" 
                onPress={onViewDetails} 
                journey="plan"
                aria-label={t('claim.viewDetailsAriaLabel', { type: t(`claim.type.${claim.type}`) })}
              >
                {t('claim.viewDetails')}
              </Button>
            )}
            
            {onTrackClaim && (
              <Button 
                variant="secondary" 
                size="sm" 
                onPress={onTrackClaim} 
                journey="plan"
                aria-label={t('claim.trackAriaLabel', { type: t(`claim.type.${claim.type}`) })}
              >
                {t('claim.track')}
              </Button>
            )}
          </Box>
        )}
      </ClaimCardFooter>
    </Card>
  );
};