import React from 'react'; // react@^18.0.0
import { CareLayout } from '@austa/design-system';
import { MedicationList } from '@austa/design-system/care';
import { useAuth } from '@austa/journey-context';
import { MedicationPageProps } from '@austa/interfaces/care';

/**
 * Renders the medication tracking page for the Care Now journey.
 *
 * @returns {JSX.Element} The medication tracking page.
 */
const MedicationsPage: React.FC<MedicationPageProps> = () => {
  // LD1: Uses the CareLayout component to provide the standard Care Now journey layout.
  // IE1: CareLayout provides the basic layout for the Care Now journey.
  return (
    <CareLayout>
      {/* LD1: Uses the MedicationList component to display the user's medications. */}
      {/* IE1: MedicationList displays the list of medications. */}
      <MedicationList />
    </CareLayout>
  );
};

// IE3: Exports the MedicationsPage component.
// LD2: Exports the MedicationsPage component for use in the application.
export default MedicationsPage;