import React from 'react';
import { CareLayout } from '@austa/design-system/care';
import { AppointmentCard, ProviderCard } from '@austa/design-system/care';
import { Card, Text } from '@austa/design-system/components';
import { useJourney } from '@austa/journey-context';
import { CarePageProps } from '@austa/interfaces/care';

/**
 * This file defines the main entry point for the Care Now journey in the web application.
 * It renders the CareLayout component with journey-specific context and components.
 */
const CareNowPage: React.FC<CarePageProps> = () => {
  // Use the journey context from the shared journey-context package
  // This provides access to journey-specific state and navigation
  const { journey, setJourney } = useJourney();

  // Ensure the current journey is set to 'care'
  React.useEffect(() => {
    if (journey?.id !== 'care') {
      setJourney({ id: 'care', name: 'Cuidar-me Agora' });
    }
  }, [journey, setJourney]);

  return (
    <CareLayout>
      {/* Main content for the Care Now journey landing page */}
      <Card journey="care">
        <Text variant="h1">Bem-vindo ao Cuidar-me Agora</Text>
        <Text variant="body1">
          Agende consultas, acompanhe medicamentos e conecte-se com profissionais de saúde.
        </Text>
        
        {/* These components would typically receive real data from API calls */}
        {/* They are included here as examples of journey-specific components */}
        <Text variant="h2" marginTop="lg">Próximas Consultas</Text>
        <AppointmentCard 
          appointment={{
            id: 'example-id',
            providerId: 'provider-1',
            providerName: 'Dr. Ana Silva',
            providerSpecialty: 'Cardiologia',
            date: new Date(),
            type: 'in-person',
            status: 'scheduled',
            location: 'Clínica Central'
          }}
          onViewDetails={() => console.log('View appointment details')}
        />
        
        <Text variant="h2" marginTop="lg">Profissionais Recomendados</Text>
        <ProviderCard 
          provider={{
            id: 'provider-2',
            name: 'Dr. Carlos Mendes',
            specialty: 'Clínico Geral',
            rating: 4.8,
            reviewCount: 124,
            location: 'Hospital São Lucas',
            distance: '2.5 km',
            availableSlots: ['Hoje, 14:00', 'Amanhã, 10:30'],
            acceptsInsurance: true,
            offersTelemedicine: true
          }}
          onPress={() => console.log('Provider card pressed')}
        />
      </Card>
    </CareLayout>
  );
};

export default CareNowPage;