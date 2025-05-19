import React from 'react'; // React v18.0+
import { useRouter } from 'next/router'; // next/router latest

import { JourneyHeader } from '@app/components/shared/JourneyHeader';
import { AppointmentForm } from '@app/components/forms/AppointmentForm';
import { CareLayout } from '@app/layouts/CareLayout';

/**
 * Renders the appointment booking page with the JourneyHeader and AppointmentForm.
 * @returns {JSX.Element} The rendered appointment booking page.
 */
const AppointmentBookingPage: React.FC = () => {
  // Uses the useRouter hook to get the router object.
  const router = useRouter();

  // Renders the CareLayout component to provide the basic layout for the Care Now journey.
  return (
    <CareLayout>
      {/* Renders the JourneyHeader component with the title 'Agendar Consulta'. */}
      <JourneyHeader title="Agendar Consulta" />
      {/* Renders the AppointmentForm component to handle the appointment booking process. */}
      <AppointmentForm />
    </CareLayout>
  );
};

export default AppointmentBookingPage;