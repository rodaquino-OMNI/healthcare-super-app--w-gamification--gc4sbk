import React from 'react';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';

// Updated imports using standardized path aliases and new packages
import { ClaimCard } from '@austa/design-system/plan/ClaimCard';
import { useClaims } from '@app/hooks/useClaims';
import { useJourneyContext } from '@austa/journey-context';

// Import type definitions from the interfaces package
import type { Claim } from '@austa/interfaces/plan';

/**
 * Claims component: Displays a list of claims for the user.
 */
const Claims: NextPage = () => {
  // Fetch claims data using the useClaims hook
  const { claims, loading, error } = useClaims();

  // Access journey-specific theming and translations using the new context hook
  const { journey, t } = useJourneyContext();

  // Get the router instance for navigation
  const router = useRouter();

  // Handle navigation to claim details page
  const handleViewClaimDetails = (claimId: string) => {
    router.push(`/plan/claims/${claimId}`);
  };

  // Handle navigation to claim submission page
  const handleAddClaim = () => {
    router.push('/plan/claims/submit');
  };

  // Render loading state
  if (loading) {
    return <div>{t('loading')}...</div>;
  }

  // Render error state
  if (error) {
    return <div>{t('error.claims')}</div>;
  }

  // Render claims list
  return (
    <div>
      <h1>{t('plan.claims.title')}</h1>
      {claims && claims.length > 0 ? (
        <ul>
          {claims.map((claim: Claim) => (
            <li key={claim.id}>
              <ClaimCard
                claim={claim}
                onViewDetails={() => handleViewClaimDetails(claim.id)}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p>{t('plan.claims.noClaims')}</p>
      )}
      <button onClick={handleAddClaim}>{t('plan.claims.addClaim')}</button>
    </div>
  );
};

export default Claims;