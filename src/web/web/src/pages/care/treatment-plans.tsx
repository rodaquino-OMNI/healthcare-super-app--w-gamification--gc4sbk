import React from 'react'; // React v18.0+
import { useQuery } from '@apollo/client'; // @apollo/client v3.0+
import { useRouter } from 'next/router'; // next/router v13.0+
import { useAuth } from '@austa/journey-context'; // Import from journey-context package
import { CareLayout } from '@austa/design-system'; // Import from design-system package
import { Card } from '@design-system/primitives'; // Import from primitives package
import { Button } from '@design-system/primitives'; // Import from primitives package
import { GET_USER_TREATMENT_PLANS } from '@austa/shared/graphql/queries/care.queries'; // Standardized import path
import { TreatmentPlan } from '@austa/interfaces/care'; // Import from interfaces package
import { formatDate } from '@austa/shared/utils/format'; // Standardized import path

/**
 * Renders the Treatment Plans screen, fetching and displaying a list of treatment plans for the user.
 * @returns {JSX.Element} The rendered Treatment Plans screen.
 */
const TreatmentPlans: React.FC = () => {
  // Access the user ID using the useAuth hook from journey-context.
  const { session } = useAuth();
  const userId = session?.user.id;

  // Execute the GET_USER_TREATMENT_PLANS GraphQL query using the useQuery hook, passing the user ID as a variable.
  const { loading, error, data } = useQuery(GET_USER_TREATMENT_PLANS, {
    variables: { userId, active: true }, // Default to active treatment plans
    skip: !userId, // Skip the query if the user ID is not available.
    onError: (error) => {
      // Enhanced error handling
      console.error('Error fetching treatment plans:', error.message);
      // Could integrate with error reporting service here
    },
    fetchPolicy: 'cache-and-network', // Improved caching strategy
  });

  // Access the Next.js router for navigation.
  const router = useRouter();

  // Handle loading state: display a loading indicator while the data is being fetched.
  if (loading && !data) { // Only show loading if we don't have cached data
    return <CareLayout><div>Loading treatment plans...</div></CareLayout>;
  }

  // Handle error state: display a more informative error message with potential retry option
  if (error) {
    return (
      <CareLayout>
        <div>
          <h3>Unable to load treatment plans</h3>
          <p>{error.message || 'An unexpected error occurred'}</p>
          <Button onPress={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </CareLayout>
    );
  }

  // If the data is successfully fetched, map over the treatmentPlans array and render a Card component for each treatment plan.
  const treatmentPlans: TreatmentPlan[] = data?.userTreatmentPlans || [];

  // Display a message if no treatment plans are found
  if (treatmentPlans.length === 0) {
    return (
      <CareLayout>
        <div>
          <h3>No treatment plans found</h3>
          <p>You don't have any active treatment plans at this time.</p>
        </div>
      </CareLayout>
    );
  }

  return (
    <CareLayout>
      <div>
        <h2>Your Treatment Plans</h2>
        {treatmentPlans.map((plan) => (
          <Card key={plan.id} elevation="sm" margin="sm">
            <div>
              {/* Each Card component displays the treatment plan name, description, start date, end date, and progress. */}
              <h3>{plan.name}</h3>
              <p>{plan.description}</p>
              <p>Start Date: {formatDate(plan.startDate)}</p>
              <p>End Date: {formatDate(plan.endDate)}</p>
              <p>Progress: {plan.progress}%</p>
              {/* A Button component is included to allow the user to view the treatment plan details. */}
              <Button onPress={() => router.push(`/care/treatment-plans/${plan.id}`)}>
                View Details
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </CareLayout>
  );
};

// Export the TreatmentPlans component for use in the application.
export default TreatmentPlans;