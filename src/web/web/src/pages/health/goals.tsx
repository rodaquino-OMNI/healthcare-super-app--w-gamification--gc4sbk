import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';

// Updated imports using the new package structure
import { GoalCard } from '@austa/design-system/health';
import { Button } from '@austa/design-system/components/Button';
import { Modal } from '@austa/design-system/components/Modal';
import { HealthGoal, HealthGoalSchema } from '@austa/interfaces/health';
import { useJourneyContext } from '@austa/journey-context';
import { GET_HEALTH_GOALS } from '@app/shared/graphql/queries/health.queries';
import { CREATE_HEALTH_GOAL } from '@app/shared/graphql/mutations/health.mutations';
import { JourneyHeader } from '@app/components/shared/JourneyHeader';
import { HealthGoalForm } from '@app/components/forms/HealthGoalForm';

// Constants
const JOURNEY_ID = 'health';

/**
 * Renders the Health Goals page, displaying a list of current goals and providing functionality to add new goals or modify existing ones.
 * This component is part of the Health Journey and integrates with the gamification system for achievement tracking.
 * @returns {JSX.Element} The rendered Health Goals page.
 */
const HealthGoalsPage: React.FC = () => {
  // Use the journey context to access auth and health-specific state
  const { auth, health, gamification } = useJourneyContext();
  const userId = auth.session?.user.id;

  // Fetch health goals using the GET_HEALTH_GOALS GraphQL query
  const { loading, error, data, refetch } = useQuery(GET_HEALTH_GOALS, {
    variables: { userId },
    skip: !userId,
  });

  // Mutation for creating a new health goal
  const [createHealthGoal, { loading: createLoading }] = useMutation(CREATE_HEALTH_GOAL, {
    onCompleted: (data) => {
      // Trigger gamification event when a goal is created
      if (data?.createHealthGoal) {
        gamification.triggerEvent({
          type: 'GOAL_CREATED',
          journeyId: JOURNEY_ID,
          metadata: {
            goalId: data.createHealthGoal.id,
            goalType: data.createHealthGoal.type
          }
        });
        refetch();
        setShowAddGoalForm(false);
      }
    }
  });

  // State for displaying the goal creation form
  const [showAddGoalForm, setShowAddGoalForm] = useState(false);

  // Handle form submission
  const handleSubmitGoal = (goalData: Omit<HealthGoal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (userId) {
      createHealthGoal({
        variables: {
          input: {
            userId,
            ...goalData
          }
        }
      });
    }
  };

  return (
    <div className="health-goals-container">
      <JourneyHeader title="Minhas Metas" />

      {/* Display loading state */}
      {loading && <p className="loading-message">Carregando metas...</p>}

      {/* Display error state */}
      {error && <p className="error-message">Erro ao carregar metas: {error.message}</p>}

      {/* Display goals as cards */}
      <div className="goals-grid">
        {data?.getHealthGoals?.map((goal: HealthGoal) => (
          <GoalCard
            key={goal.id}
            title={goal.type}
            description={`Meta: ${goal.target} ${goal.unit || ''}`}
            progress={goal.progress || 0}
            completed={goal.status === 'COMPLETED'}
            journey={JOURNEY_ID}
          />
        ))}
      </div>

      {/* Button to add a new goal */}
      <Button 
        onPress={() => setShowAddGoalForm(true)}
        variant="primary"
        journey={JOURNEY_ID}
      >
        Adicionar Meta
      </Button>

      {/* Goal form modal */}
      <Modal 
        isVisible={showAddGoalForm}
        onClose={() => setShowAddGoalForm(false)}
        title="Nova Meta de Saúde"
        journey={JOURNEY_ID}
      >
        <HealthGoalForm 
          onSubmit={handleSubmitGoal}
          isLoading={createLoading}
          onCancel={() => setShowAddGoalForm(false)}
        />
      </Modal>
    </div>
  );
};

export default HealthGoalsPage;