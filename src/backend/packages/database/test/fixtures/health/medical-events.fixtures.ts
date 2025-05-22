/**
 * @file Test fixtures for medical events and history with different types (diagnoses, procedures, medications, allergies) and sources.
 * 
 * These fixtures are used for testing medical history tracking, visualization, and integration with healthcare systems in the Health journey.
 */

/**
 * Interface for medical event test data
 */
export interface MedicalEventFixture {
  id: string;
  recordId: string;
  type: string;
  description: string;
  date: Date;
  provider?: string;
  documents?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Medical event types used in fixtures
 */
export enum MedicalEventType {
  DIAGNOSIS = 'diagnosis',
  PROCEDURE = 'procedure',
  MEDICATION = 'medication',
  ALLERGY = 'allergy',
  IMMUNIZATION = 'immunization',
  VISIT = 'visit',
  LAB_RESULT = 'lab_result',
}

/**
 * Factory function to create a medical event fixture with default values
 * 
 * @param overrides - Optional properties to override defaults
 * @returns A medical event fixture
 */
export const createMedicalEventFixture = (overrides?: Partial<MedicalEventFixture>): MedicalEventFixture => {
  const now = new Date();
  const defaultFixture: MedicalEventFixture = {
    id: '00000000-0000-0000-0000-000000000001',
    recordId: '00000000-0000-0000-0000-000000000001',
    type: MedicalEventType.DIAGNOSIS,
    description: 'Test medical event',
    date: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
    provider: 'Test Provider',
    documents: [],
    createdAt: now,
    updatedAt: now,
  };

  return { ...defaultFixture, ...overrides };
};

/**
 * Factory function to create a diagnosis event fixture
 * 
 * @param overrides - Optional properties to override defaults
 * @returns A diagnosis event fixture
 */
export const createDiagnosisFixture = (overrides?: Partial<MedicalEventFixture>): MedicalEventFixture => {
  return createMedicalEventFixture({
    type: MedicalEventType.DIAGNOSIS,
    description: 'Hypertension (I10)',
    provider: 'Dr. Maria Silva',
    ...overrides,
  });
};

/**
 * Factory function to create a procedure event fixture
 * 
 * @param overrides - Optional properties to override defaults
 * @returns A procedure event fixture
 */
export const createProcedureFixture = (overrides?: Partial<MedicalEventFixture>): MedicalEventFixture => {
  return createMedicalEventFixture({
    type: MedicalEventType.PROCEDURE,
    description: 'Electrocardiogram (ECG)',
    provider: 'Hospital São Paulo',
    ...overrides,
  });
};

/**
 * Factory function to create a medication event fixture
 * 
 * @param overrides - Optional properties to override defaults
 * @returns A medication event fixture
 */
export const createMedicationFixture = (overrides?: Partial<MedicalEventFixture>): MedicalEventFixture => {
  return createMedicalEventFixture({
    type: MedicalEventType.MEDICATION,
    description: 'Losartan 50mg - 1 tablet daily',
    provider: 'Dr. Carlos Mendes',
    ...overrides,
  });
};

/**
 * Factory function to create an allergy event fixture
 * 
 * @param overrides - Optional properties to override defaults
 * @returns An allergy event fixture
 */
export const createAllergyFixture = (overrides?: Partial<MedicalEventFixture>): MedicalEventFixture => {
  return createMedicalEventFixture({
    type: MedicalEventType.ALLERGY,
    description: 'Penicillin - Severe reaction',
    provider: 'Dr. Ana Costa',
    ...overrides,
  });
};

/**
 * Factory function to create an immunization event fixture
 * 
 * @param overrides - Optional properties to override defaults
 * @returns An immunization event fixture
 */
export const createImmunizationFixture = (overrides?: Partial<MedicalEventFixture>): MedicalEventFixture => {
  return createMedicalEventFixture({
    type: MedicalEventType.IMMUNIZATION,
    description: 'COVID-19 Vaccine - Dose 1',
    provider: 'UBS Vila Mariana',
    ...overrides,
  });
};

/**
 * Factory function to create a visit event fixture
 * 
 * @param overrides - Optional properties to override defaults
 * @returns A visit event fixture
 */
export const createVisitFixture = (overrides?: Partial<MedicalEventFixture>): MedicalEventFixture => {
  return createMedicalEventFixture({
    type: MedicalEventType.VISIT,
    description: 'Annual check-up',
    provider: 'Clínica Saúde Integral',
    ...overrides,
  });
};

/**
 * Factory function to create a lab result event fixture
 * 
 * @param overrides - Optional properties to override defaults
 * @returns A lab result event fixture
 */
export const createLabResultFixture = (overrides?: Partial<MedicalEventFixture>): MedicalEventFixture => {
  return createMedicalEventFixture({
    type: MedicalEventType.LAB_RESULT,
    description: 'Complete Blood Count (CBC)',
    provider: 'Laboratório Diagnósticos',
    documents: ['https://example.com/lab-results/cbc-123456.pdf'],
    ...overrides,
  });
};

/**
 * Standard medical event fixtures for common testing scenarios
 */
export const standardMedicalEvents = {
  diagnosis: createDiagnosisFixture({
    id: '00000000-0000-0000-0000-000000000101',
    recordId: '00000000-0000-0000-0000-000000000001',
    date: new Date(2023, 0, 15), // January 15, 2023
  }),
  procedure: createProcedureFixture({
    id: '00000000-0000-0000-0000-000000000102',
    recordId: '00000000-0000-0000-0000-000000000001',
    date: new Date(2023, 1, 10), // February 10, 2023
  }),
  medication: createMedicationFixture({
    id: '00000000-0000-0000-0000-000000000103',
    recordId: '00000000-0000-0000-0000-000000000001',
    date: new Date(2023, 0, 20), // January 20, 2023
  }),
  allergy: createAllergyFixture({
    id: '00000000-0000-0000-0000-000000000104',
    recordId: '00000000-0000-0000-0000-000000000001',
    date: new Date(2022, 5, 5), // June 5, 2022
  }),
  immunization: createImmunizationFixture({
    id: '00000000-0000-0000-0000-000000000105',
    recordId: '00000000-0000-0000-0000-000000000001',
    date: new Date(2022, 3, 10), // April 10, 2022
  }),
  visit: createVisitFixture({
    id: '00000000-0000-0000-0000-000000000106',
    recordId: '00000000-0000-0000-0000-000000000001',
    date: new Date(2023, 0, 5), // January 5, 2023
  }),
  labResult: createLabResultFixture({
    id: '00000000-0000-0000-0000-000000000107',
    recordId: '00000000-0000-0000-0000-000000000001',
    date: new Date(2023, 0, 7), // January 7, 2023
  }),
};

/**
 * Collection of all standard medical events as an array
 */
export const allStandardMedicalEvents = Object.values(standardMedicalEvents);

/**
 * Medical history scenarios for testing history retrieval and display
 */
export const medicalHistoryScenarios = {
  /**
   * Comprehensive medical history for a patient with chronic condition
   */
  chronicConditionPatient: [
    createDiagnosisFixture({
      id: '00000000-0000-0000-0000-000000000201',
      recordId: '00000000-0000-0000-0000-000000000002',
      description: 'Type 2 Diabetes Mellitus (E11)',
      date: new Date(2022, 2, 15), // March 15, 2022
      provider: 'Dr. Roberto Almeida',
    }),
    createVisitFixture({
      id: '00000000-0000-0000-0000-000000000202',
      recordId: '00000000-0000-0000-0000-000000000002',
      description: 'Diabetes follow-up appointment',
      date: new Date(2022, 5, 20), // June 20, 2022
      provider: 'Dr. Roberto Almeida',
    }),
    createLabResultFixture({
      id: '00000000-0000-0000-0000-000000000203',
      recordId: '00000000-0000-0000-0000-000000000002',
      description: 'HbA1c Test - Result: 7.2%',
      date: new Date(2022, 5, 18), // June 18, 2022
      provider: 'Laboratório Central',
      documents: ['https://example.com/lab-results/hba1c-789012.pdf'],
    }),
    createMedicationFixture({
      id: '00000000-0000-0000-0000-000000000204',
      recordId: '00000000-0000-0000-0000-000000000002',
      description: 'Metformin 500mg - 2 tablets daily',
      date: new Date(2022, 5, 20), // June 20, 2022
      provider: 'Dr. Roberto Almeida',
    }),
    createVisitFixture({
      id: '00000000-0000-0000-0000-000000000205',
      recordId: '00000000-0000-0000-0000-000000000002',
      description: 'Diabetes follow-up appointment',
      date: new Date(2022, 11, 10), // December 10, 2022
      provider: 'Dr. Roberto Almeida',
    }),
    createLabResultFixture({
      id: '00000000-0000-0000-0000-000000000206',
      recordId: '00000000-0000-0000-0000-000000000002',
      description: 'HbA1c Test - Result: 6.8%',
      date: new Date(2022, 11, 5), // December 5, 2022
      provider: 'Laboratório Central',
      documents: ['https://example.com/lab-results/hba1c-789013.pdf'],
    }),
    createProcedureFixture({
      id: '00000000-0000-0000-0000-000000000207',
      recordId: '00000000-0000-0000-0000-000000000002',
      description: 'Diabetic Retinopathy Screening',
      date: new Date(2023, 0, 15), // January 15, 2023
      provider: 'Centro Oftalmológico',
      documents: ['https://example.com/procedures/retina-scan-123.pdf'],
    }),
  ],

  /**
   * Medical history for a patient with recent surgery
   */
  recentSurgeryPatient: [
    createVisitFixture({
      id: '00000000-0000-0000-0000-000000000301',
      recordId: '00000000-0000-0000-0000-000000000003',
      description: 'Pre-surgical consultation',
      date: new Date(2023, 1, 5), // February 5, 2023
      provider: 'Dr. Juliana Santos',
    }),
    createLabResultFixture({
      id: '00000000-0000-0000-0000-000000000302',
      recordId: '00000000-0000-0000-0000-000000000003',
      description: 'Pre-surgical blood work',
      date: new Date(2023, 1, 10), // February 10, 2023
      provider: 'Hospital Santa Catarina',
      documents: ['https://example.com/lab-results/pre-op-456789.pdf'],
    }),
    createProcedureFixture({
      id: '00000000-0000-0000-0000-000000000303',
      recordId: '00000000-0000-0000-0000-000000000003',
      description: 'Laparoscopic Appendectomy',
      date: new Date(2023, 1, 20), // February 20, 2023
      provider: 'Dr. Juliana Santos',
      documents: [
        'https://example.com/procedures/surgery-report-456789.pdf',
        'https://example.com/procedures/discharge-summary-456789.pdf',
      ],
    }),
    createMedicationFixture({
      id: '00000000-0000-0000-0000-000000000304',
      recordId: '00000000-0000-0000-0000-000000000003',
      description: 'Tramadol 50mg - As needed for pain',
      date: new Date(2023, 1, 20), // February 20, 2023
      provider: 'Dr. Juliana Santos',
    }),
    createVisitFixture({
      id: '00000000-0000-0000-0000-000000000305',
      recordId: '00000000-0000-0000-0000-000000000003',
      description: 'Post-surgical follow-up',
      date: new Date(2023, 2, 5), // March 5, 2023
      provider: 'Dr. Juliana Santos',
    }),
  ],

  /**
   * Medical history for a patient with allergies and immunizations
   */
  allergyAndImmunizationPatient: [
    createAllergyFixture({
      id: '00000000-0000-0000-0000-000000000401',
      recordId: '00000000-0000-0000-0000-000000000004',
      description: 'Peanuts - Anaphylactic reaction',
      date: new Date(2020, 3, 10), // April 10, 2020
      provider: 'Dr. Marcos Oliveira',
    }),
    createAllergyFixture({
      id: '00000000-0000-0000-0000-000000000402',
      recordId: '00000000-0000-0000-0000-000000000004',
      description: 'Amoxicillin - Skin rash',
      date: new Date(2021, 7, 15), // August 15, 2021
      provider: 'Dr. Carla Ferreira',
    }),
    createImmunizationFixture({
      id: '00000000-0000-0000-0000-000000000403',
      recordId: '00000000-0000-0000-0000-000000000004',
      description: 'Influenza Vaccine',
      date: new Date(2022, 4, 5), // May 5, 2022
      provider: 'UBS Jardim Paulista',
    }),
    createImmunizationFixture({
      id: '00000000-0000-0000-0000-000000000404',
      recordId: '00000000-0000-0000-0000-000000000004',
      description: 'COVID-19 Vaccine - Dose 1',
      date: new Date(2022, 6, 10), // July 10, 2022
      provider: 'Centro de Vacinação Municipal',
    }),
    createImmunizationFixture({
      id: '00000000-0000-0000-0000-000000000405',
      recordId: '00000000-0000-0000-0000-000000000004',
      description: 'COVID-19 Vaccine - Dose 2',
      date: new Date(2022, 9, 5), // October 5, 2022
      provider: 'Centro de Vacinação Municipal',
    }),
    createImmunizationFixture({
      id: '00000000-0000-0000-0000-000000000406',
      recordId: '00000000-0000-0000-0000-000000000004',
      description: 'COVID-19 Vaccine - Booster',
      date: new Date(2023, 2, 15), // March 15, 2023
      provider: 'Centro de Vacinação Municipal',
    }),
  ],

  /**
   * Empty medical history for a new patient
   */
  emptyMedicalHistory: [],
};

/**
 * Medical events with FHIR integration test data
 */
export const fhirMedicalEvents = {
  /**
   * Medical event with FHIR document references
   */
  withFhirDocuments: createProcedureFixture({
    id: '00000000-0000-0000-0000-000000000501',
    recordId: '00000000-0000-0000-0000-000000000005',
    description: 'MRI Scan - Lumbar Spine',
    date: new Date(2023, 2, 10), // March 10, 2023
    provider: 'Centro de Diagnóstico por Imagem',
    documents: [
      JSON.stringify({
        resourceType: 'DocumentReference',
        id: 'mri-report-123',
        status: 'current',
        docStatus: 'final',
        type: {
          coding: [{
            system: 'http://loinc.org',
            code: '68604-8',
            display: 'MRI report Spine (lumbar)',
          }],
        },
        subject: {
          reference: 'Patient/00000000-0000-0000-0000-000000000005',
        },
        date: '2023-03-10T14:30:00-03:00',
        content: [{
          attachment: {
            contentType: 'application/pdf',
            url: 'https://example.com/fhir/Binary/mri-report-123.pdf',
            title: 'MRI Report - Lumbar Spine',
          },
        }],
      }),
      JSON.stringify({
        resourceType: 'ImagingStudy',
        id: 'mri-study-456',
        status: 'available',
        subject: {
          reference: 'Patient/00000000-0000-0000-0000-000000000005',
        },
        started: '2023-03-10T13:45:00-03:00',
        procedureCode: [{
          coding: [{
            system: 'http://www.ama-assn.org/go/cpt',
            code: '72148',
            display: 'MRI lumbar spine without contrast',
          }],
        }],
        series: [{
          uid: '2.16.124.113543.6003.1154777499.30246.19789.3503430045',
          number: 1,
          modality: {
            system: 'http://dicom.nema.org/resources/ontology/DCM',
            code: 'MR',
          },
          description: 'Lumbar Spine MRI without contrast',
          numberOfInstances: 36,
          instance: [
            {
              uid: '2.16.124.113543.6003.1154777499.30246.19789.3503430045.1',
              number: 1,
              sopClass: {
                system: 'urn:oid:1.2.840.10008.5.1.4.1.1.4',
                code: 'MR Image Storage',
              },
            },
          ],
        }],
      }),
    ],
  }),

  /**
   * Medical event with FHIR medication data
   */
  withFhirMedication: createMedicationFixture({
    id: '00000000-0000-0000-0000-000000000502',
    recordId: '00000000-0000-0000-0000-000000000005',
    description: 'Atorvastatin 20mg - 1 tablet daily',
    date: new Date(2023, 2, 15), // March 15, 2023
    provider: 'Dr. Paulo Ribeiro',
    documents: [
      JSON.stringify({
        resourceType: 'MedicationRequest',
        id: 'med-request-789',
        status: 'active',
        intent: 'order',
        medicationCodeableConcept: {
          coding: [{
            system: 'http://www.anvisa.gov.br/datavisa/fila_bula/index.asp',
            code: '1018807850037',
            display: 'ATORVASTATINA CÁLCICA',
          }],
          text: 'Atorvastatin 20mg',
        },
        subject: {
          reference: 'Patient/00000000-0000-0000-0000-000000000005',
        },
        authoredOn: '2023-03-15T10:15:00-03:00',
        requester: {
          reference: 'Practitioner/dr-paulo-ribeiro',
          display: 'Dr. Paulo Ribeiro',
        },
        dosageInstruction: [{
          text: '1 tablet daily at bedtime',
          timing: {
            repeat: {
              frequency: 1,
              period: 1,
              periodUnit: 'd',
            },
          },
          doseAndRate: [{
            doseQuantity: {
              value: 20,
              unit: 'mg',
              system: 'http://unitsofmeasure.org',
              code: 'mg',
            },
          }],
        }],
      }),
    ],
  }),
};

/**
 * Default export with all medical event fixtures
 */
export default {
  standardMedicalEvents,
  allStandardMedicalEvents,
  medicalHistoryScenarios,
  fhirMedicalEvents,
  createMedicalEventFixture,
  createDiagnosisFixture,
  createProcedureFixture,
  createMedicationFixture,
  createAllergyFixture,
  createImmunizationFixture,
  createVisitFixture,
  createLabResultFixture,
};