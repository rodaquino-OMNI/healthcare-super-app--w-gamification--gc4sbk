import React from 'react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

// Import primitives from @design-system/primitives package
import { Text } from '@design-system/primitives/components/Text';
import { Icon } from '@design-system/primitives/components/Icon';

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
    case 'partially_approved':
      return 'check-circle';
    case 'denied':
      return 'x-circle';
    case 'additional_info_required':
      return 'alert-circle';
    case 'appealed':
      return 'alert-triangle';
    case 'in_review':
      return 'search';
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
    case 'partially_approved':
      return 'success';
    case 'denied':
      return 'error';
    case 'additional_info_required':
    case 'appealed':
      return 'warning';
    case 'in_review':
      return 'info';
    case 'pending':
    default:
      return 'info';
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
 * Component for displaying insurance claim information in a card format
 * 
 * @example
 * ```tsx
 * <ClaimCard
 *   claim={claim}
 *   onPress={() => handleClaimPress(claim.id)}
 *   onViewDetails={() => navigateToClaimDetails(claim.id)}
 *   onTrackClaim={() => navigateToClaimTracking(claim.id)}
 * />
 * ```
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
  const formattedDate = format(
    typeof claim.submittedAt === 'string' ? new Date(claim.submittedAt) : claim.submittedAt, 
    'dd/MM/yyyy'
  );
  
  // Map the status to the ClaimStatusText component status prop
  const mappedStatus = claim.status === 'additional_info_required' ? 'moreInfo' : 
                       claim.status === 'in_review' ? 'inReview' :
                       claim.status === 'partially_approved' ? 'approved' :
                       claim.status as 'pending' | 'approved' | 'denied' | 'inReview' | 'moreInfo' | 'appealed';
  
  // Create a descriptive accessibility label if none provided
  const cardAccessibilityLabel = accessibilityLabel || 
    `${t(`claim.type.${claim.type}`)} ${formattedAmount}, ${t(`claim.status.${claim.status}`)}. ${t('claim.submittedOn')} ${formattedDate}`;
  
  return (
    <Card
      journey="plan"
      onPress={onPress}
      interactive={!!onPress}
      accessibilityLabel={cardAccessibilityLabel}
      role="article"
    >
      <ClaimCardHeader>
        <Text fontWeight="medium" fontSize={compact ? 'sm' : 'md'}>
          {t(`claim.type.${claim.type}`)}
        </Text>
        <Text fontSize="sm" color="neutral.gray600" aria-label={`${t('claim.submittedOn')} ${formattedDate}`}>
          {t('claim.submittedOn')} {formattedDate}
        </Text>
      </ClaimCardHeader>
      
      <ClaimCardBody>
        <Text fontWeight="bold" fontSize={compact ? 'lg' : 'xl'} aria-label={`${t('claim.amount')}: ${formattedAmount}`}>
          {formattedAmount}
        </Text>
        
        {!compact && claim.documents && claim.documents.length > 0 && (
          <Text fontSize="sm" aria-label={t('claim.documents', { count: claim.documents.length })}>
            {t('claim.documents', { count: claim.documents.length })}
          </Text>
        )}
      </ClaimCardBody>
      
      <ClaimCardFooter>
        <ClaimStatusText 
          status={mappedStatus}
          aria-label={t(`claim.status.${claim.status}`)}
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
          <div>
            {onViewDetails && (
              <Button 
                variant="tertiary" 
                size="sm" 
                onPress={onViewDetails} 
                journey="plan"
                aria-label={t('claim.viewDetails')}
                marginRight="xs"
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
                aria-label={t('claim.track')}
              >
                {t('claim.track')}
              </Button>
            )}
          </div>
        )}
      </ClaimCardFooter>
    </Card>
  );
};