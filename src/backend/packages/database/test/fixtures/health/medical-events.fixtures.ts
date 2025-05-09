import { IMedicalEvent } from '@austa/interfaces/journey/health';

/**
 * Medical event types for test fixtures
 */
export enum MedicalEventType {
  DIAGNOSIS = 'diagnosis',
  PROCEDURE = 'procedure',
  MEDICATION = 'medication',
  ALLERGY = 'allergy',
  VISIT = 'visit',
  IMMUNIZATION = 'immunization',
  LAB_RESULT = 'lab_result',
}

/**
 * Medical event sources for test fixtures
 */
export enum MedicalEventSource {
  SELF_REPORTED = 'self_reported',
  PROVIDER = 'provider',
  FHIR = 'fhir',
  IMPORTED = 'imported',
}

/**
 * Extended interface for medical event test fixtures
 */
export interface IMedicalEventFixture extends IMedicalEvent {
  /**
   * Source of the medical event data
   */
  source?: MedicalEventSource;
}

/**
 * Options for creating a medical event fixture
 */
export interface MedicalEventFixtureOptions {
  id?: string;
  recordId: string;
  type: MedicalEventType | string;
  description?: string;
  date?: Date;
  provider?: string;
  documents?: string[];
  source?: MedicalEventSource;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Creates a medical event fixture with the given options
 * 
 * @param options Options for creating the medical event
 * @returns A medical event fixture
 */
export function createMedicalEventFixture(options: MedicalEventFixtureOptions): IMedicalEventFixture {
  const now = new Date();
  const defaultDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
  
  return {
    id: options.id || `med-event-${Math.random().toString(36).substring(2, 10)}`,
    recordId: options.recordId,
    type: options.type,
    description: options.description,
    date: options.date || defaultDate,
    provider: options.provider,
    documents: options.documents,
    source: options.source || MedicalEventSource.SELF_REPORTED,
    createdAt: options.createdAt || now,
    updatedAt: options.updatedAt || now,
  };
}

/**
 * Creates a batch of medical events for a specific health record
 * 
 * @param recordId The health record ID to associate with the events
 * @param count Number of events to create
 * @param baseOptions Base options to apply to all events
 * @returns Array of medical event fixtures
 */
export function createMedicalEventBatch(
  recordId: string,
  count: number,
  baseOptions?: Partial<MedicalEventFixtureOptions>
): IMedicalEventFixture[] {
  const events: IMedicalEventFixture[] = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    // Create events with dates spread over the last year
    const daysAgo = Math.floor(Math.random() * 365);
    const eventDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo);
    
    // Randomly select an event type
    const eventTypes = Object.values(MedicalEventType);
    const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    
    events.push(createMedicalEventFixture({
      recordId,
      type: randomType,
      date: eventDate,
      ...baseOptions,
    }));
  }
  
  // Sort by date, most recent first
  return events.sort((a, b) => b.date.getTime() - a.date.getTime());
}

// ===== DIAGNOSIS FIXTURES =====

/**
 * Creates a diagnosis medical event fixture
 * 
 * @param recordId The health record ID
 * @param diagnosis The diagnosis description
 * @param options Additional options
 * @returns A diagnosis medical event fixture
 */
export function createDiagnosisFixture(
  recordId: string,
  diagnosis: string,
  options?: Partial<MedicalEventFixtureOptions>
): IMedicalEventFixture {
  return createMedicalEventFixture({
    recordId,
    type: MedicalEventType.DIAGNOSIS,
    description: diagnosis,
    ...options,
  });
}

/**
 * Standard diagnosis fixtures for testing
 */
export const diagnosisFixtures = {
  hypertension: createDiagnosisFixture(
    'record-123',
    'Hipertensão Essencial (primária)',
    {
      id: 'diag-001',
      provider: 'Dr. Carlos Mendes',
      date: new Date(2023, 1, 15),
      source: MedicalEventSource.PROVIDER,
    }
  ),
  diabetes: createDiagnosisFixture(
    'record-123',
    'Diabetes Mellitus Tipo 2',
    {
      id: 'diag-002',
      provider: 'Dra. Ana Silva',
      date: new Date(2022, 5, 10),
      source: MedicalEventSource.PROVIDER,
    }
  ),
  asthma: createDiagnosisFixture(
    'record-123',
    'Asma',
    {
      id: 'diag-003',
      provider: 'Dr. Paulo Ribeiro',
      date: new Date(2020, 3, 22),
      source: MedicalEventSource.PROVIDER,
    }
  ),
  migraine: createDiagnosisFixture(
    'record-123',
    'Enxaqueca sem aura',
    {
      id: 'diag-004',
      provider: 'Dra. Mariana Costa',
      date: new Date(2021, 8, 5),
      source: MedicalEventSource.SELF_REPORTED,
    }
  ),
};

// ===== PROCEDURE FIXTURES =====

/**
 * Creates a procedure medical event fixture
 * 
 * @param recordId The health record ID
 * @param procedure The procedure description
 * @param options Additional options
 * @returns A procedure medical event fixture
 */
export function createProcedureFixture(
  recordId: string,
  procedure: string,
  options?: Partial<MedicalEventFixtureOptions>
): IMedicalEventFixture {
  return createMedicalEventFixture({
    recordId,
    type: MedicalEventType.PROCEDURE,
    description: procedure,
    ...options,
  });
}

/**
 * Standard procedure fixtures for testing
 */
export const procedureFixtures = {
  appendectomy: createProcedureFixture(
    'record-123',
    'Apendicectomia',
    {
      id: 'proc-001',
      provider: 'Dr. Roberto Almeida',
      date: new Date(2019, 2, 18),
      documents: ['report-123.pdf', 'discharge-123.pdf'],
      source: MedicalEventSource.PROVIDER,
    }
  ),
  colonoscopy: createProcedureFixture(
    'record-123',
    'Colonoscopia',
    {
      id: 'proc-002',
      provider: 'Dra. Juliana Santos',
      date: new Date(2022, 7, 12),
      documents: ['colonoscopy-report.pdf'],
      source: MedicalEventSource.PROVIDER,
    }
  ),
  mri: createProcedureFixture(
    'record-123',
    'Ressonância Magnética - Coluna Lombar',
    {
      id: 'proc-003',
      provider: 'Centro de Imagem São Paulo',
      date: new Date(2023, 0, 5),
      documents: ['mri-images.zip', 'mri-report.pdf'],
      source: MedicalEventSource.PROVIDER,
    }
  ),
};

// ===== MEDICATION FIXTURES =====

/**
 * Creates a medication medical event fixture
 * 
 * @param recordId The health record ID
 * @param medication The medication description
 * @param options Additional options
 * @returns A medication medical event fixture
 */
export function createMedicationFixture(
  recordId: string,
  medication: string,
  options?: Partial<MedicalEventFixtureOptions>
): IMedicalEventFixture {
  return createMedicalEventFixture({
    recordId,
    type: MedicalEventType.MEDICATION,
    description: medication,
    ...options,
  });
}

/**
 * Standard medication fixtures for testing
 */
export const medicationFixtures = {
  losartan: createMedicationFixture(
    'record-123',
    'Losartana 50mg - 1 comprimido por dia',
    {
      id: 'med-001',
      provider: 'Dr. Carlos Mendes',
      date: new Date(2023, 1, 15),
      source: MedicalEventSource.PROVIDER,
    }
  ),
  metformin: createMedicationFixture(
    'record-123',
    'Metformina 850mg - 2 comprimidos por dia',
    {
      id: 'med-002',
      provider: 'Dra. Ana Silva',
      date: new Date(2022, 5, 10),
      source: MedicalEventSource.PROVIDER,
    }
  ),
  albuterol: createMedicationFixture(
    'record-123',
    'Salbutamol - Inalador de resgate conforme necessário',
    {
      id: 'med-003',
      provider: 'Dr. Paulo Ribeiro',
      date: new Date(2020, 3, 22),
      source: MedicalEventSource.PROVIDER,
    }
  ),
  ibuprofen: createMedicationFixture(
    'record-123',
    'Ibuprofeno 400mg - Conforme necessário para dor',
    {
      id: 'med-004',
      provider: null,
      date: new Date(2023, 3, 10),
      source: MedicalEventSource.SELF_REPORTED,
    }
  ),
};

// ===== ALLERGY FIXTURES =====

/**
 * Creates an allergy medical event fixture
 * 
 * @param recordId The health record ID
 * @param allergy The allergy description
 * @param options Additional options
 * @returns An allergy medical event fixture
 */
export function createAllergyFixture(
  recordId: string,
  allergy: string,
  options?: Partial<MedicalEventFixtureOptions>
): IMedicalEventFixture {
  return createMedicalEventFixture({
    recordId,
    type: MedicalEventType.ALLERGY,
    description: allergy,
    ...options,
  });
}

/**
 * Standard allergy fixtures for testing
 */
export const allergyFixtures = {
  penicillin: createAllergyFixture(
    'record-123',
    'Alergia à Penicilina - Reação cutânea grave',
    {
      id: 'alg-001',
      provider: 'Dr. Roberto Almeida',
      date: new Date(2018, 5, 12),
      source: MedicalEventSource.PROVIDER,
    }
  ),
  lactose: createAllergyFixture(
    'record-123',
    'Intolerância à Lactose',
    {
      id: 'alg-002',
      provider: null,
      date: new Date(2020, 1, 3),
      source: MedicalEventSource.SELF_REPORTED,
    }
  ),
  pollen: createAllergyFixture(
    'record-123',
    'Alergia a Pólen - Rinite alérgica sazonal',
    {
      id: 'alg-003',
      provider: 'Dra. Mariana Costa',
      date: new Date(2021, 8, 5),
      source: MedicalEventSource.PROVIDER,
    }
  ),
};

// ===== VISIT FIXTURES =====

/**
 * Creates a visit medical event fixture
 * 
 * @param recordId The health record ID
 * @param visit The visit description
 * @param options Additional options
 * @returns A visit medical event fixture
 */
export function createVisitFixture(
  recordId: string,
  visit: string,
  options?: Partial<MedicalEventFixtureOptions>
): IMedicalEventFixture {
  return createMedicalEventFixture({
    recordId,
    type: MedicalEventType.VISIT,
    description: visit,
    ...options,
  });
}

/**
 * Standard visit fixtures for testing
 */
export const visitFixtures = {
  annualCheckup: createVisitFixture(
    'record-123',
    'Consulta de rotina anual',
    {
      id: 'visit-001',
      provider: 'Dr. Carlos Mendes',
      date: new Date(2023, 1, 15),
      source: MedicalEventSource.PROVIDER,
    }
  ),
  cardiologyConsult: createVisitFixture(
    'record-123',
    'Consulta com cardiologista',
    {
      id: 'visit-002',
      provider: 'Dr. Ricardo Ferreira',
      date: new Date(2023, 2, 20),
      source: MedicalEventSource.PROVIDER,
    }
  ),
  emergencyVisit: createVisitFixture(
    'record-123',
    'Visita ao pronto-socorro - Dor abdominal aguda',
    {
      id: 'visit-003',
      provider: 'Hospital Santa Maria',
      date: new Date(2022, 11, 5),
      source: MedicalEventSource.PROVIDER,
    }
  ),
};

// ===== IMMUNIZATION FIXTURES =====

/**
 * Creates an immunization medical event fixture
 * 
 * @param recordId The health record ID
 * @param immunization The immunization description
 * @param options Additional options
 * @returns An immunization medical event fixture
 */
export function createImmunizationFixture(
  recordId: string,
  immunization: string,
  options?: Partial<MedicalEventFixtureOptions>
): IMedicalEventFixture {
  return createMedicalEventFixture({
    recordId,
    type: MedicalEventType.IMMUNIZATION,
    description: immunization,
    ...options,
  });
}

/**
 * Standard immunization fixtures for testing
 */
export const immunizationFixtures = {
  covidVaccine: createImmunizationFixture(
    'record-123',
    'Vacina COVID-19 - Dose 1',
    {
      id: 'imm-001',
      provider: 'UBS Vila Nova',
      date: new Date(2021, 5, 10),
      source: MedicalEventSource.PROVIDER,
    }
  ),
  covidBooster: createImmunizationFixture(
    'record-123',
    'Vacina COVID-19 - Reforço',
    {
      id: 'imm-002',
      provider: 'UBS Vila Nova',
      date: new Date(2022, 0, 15),
      source: MedicalEventSource.PROVIDER,
    }
  ),
  fluVaccine: createImmunizationFixture(
    'record-123',
    'Vacina contra Influenza - 2023',
    {
      id: 'imm-003',
      provider: 'Clínica Vacinas Mais',
      date: new Date(2023, 3, 5),
      source: MedicalEventSource.PROVIDER,
    }
  ),
};

// ===== LAB RESULT FIXTURES =====

/**
 * Creates a lab result medical event fixture
 * 
 * @param recordId The health record ID
 * @param labResult The lab result description
 * @param options Additional options
 * @returns A lab result medical event fixture
 */
export function createLabResultFixture(
  recordId: string,
  labResult: string,
  options?: Partial<MedicalEventFixtureOptions>
): IMedicalEventFixture {
  return createMedicalEventFixture({
    recordId,
    type: MedicalEventType.LAB_RESULT,
    description: labResult,
    ...options,
  });
}

/**
 * Standard lab result fixtures for testing
 */
export const labResultFixtures = {
  bloodPanel: createLabResultFixture(
    'record-123',
    'Hemograma Completo',
    {
      id: 'lab-001',
      provider: 'Laboratório Diagnósticos',
      date: new Date(2023, 1, 10),
      documents: ['blood-panel-results.pdf'],
      source: MedicalEventSource.PROVIDER,
    }
  ),
  lipidProfile: createLabResultFixture(
    'record-123',
    'Perfil Lipídico',
    {
      id: 'lab-002',
      provider: 'Laboratório Diagnósticos',
      date: new Date(2023, 1, 10),
      documents: ['lipid-profile-results.pdf'],
      source: MedicalEventSource.PROVIDER,
    }
  ),
  urinalysis: createLabResultFixture(
    'record-123',
    'Exame de Urina',
    {
      id: 'lab-003',
      provider: 'Laboratório Central',
      date: new Date(2022, 10, 15),
      documents: ['urinalysis-results.pdf'],
      source: MedicalEventSource.PROVIDER,
    }
  ),
};

// ===== MEDICAL HISTORY SCENARIOS =====

/**
 * Comprehensive medical history for a patient with chronic conditions
 */
export const chronicConditionsHistory: IMedicalEventFixture[] = [
  // Initial diagnosis and visits
  diagnosisFixtures.hypertension,
  diagnosisFixtures.diabetes,
  visitFixtures.annualCheckup,
  
  // Medications
  medicationFixtures.losartan,
  medicationFixtures.metformin,
  
  // Follow-up visits and lab tests
  visitFixtures.cardiologyConsult,
  labResultFixtures.bloodPanel,
  labResultFixtures.lipidProfile,
  
  // Procedures
  procedureFixtures.colonoscopy,
];

/**
 * Medical history for a patient with allergies and respiratory issues
 */
export const respiratoryConditionsHistory: IMedicalEventFixture[] = [
  // Diagnoses
  diagnosisFixtures.asthma,
  allergyFixtures.pollen,
  
  // Medications
  medicationFixtures.albuterol,
  
  // Immunizations
  immunizationFixtures.fluVaccine,
  immunizationFixtures.covidVaccine,
  immunizationFixtures.covidBooster,
];

/**
 * Medical history for a patient with acute conditions and procedures
 */
export const acuteConditionsHistory: IMedicalEventFixture[] = [
  // Emergency visit
  visitFixtures.emergencyVisit,
  
  // Procedure
  procedureFixtures.appendectomy,
  
  // Follow-up
  labResultFixtures.bloodPanel,
  medicationFixtures.ibuprofen,
];

/**
 * Generates a complete medical history with a mix of different event types
 * 
 * @param recordId The health record ID
 * @param count Number of events to generate (default: 20)
 * @returns Array of medical event fixtures representing a complete history
 */
export function generateCompleteMedicalHistory(recordId: string, count = 20): IMedicalEventFixture[] {
  // Start with some predefined events
  const history: IMedicalEventFixture[] = [
    // Modify some fixtures to use the provided recordId
    createDiagnosisFixture(recordId, 'Hipertensão Essencial (primária)', {
      provider: 'Dr. Carlos Mendes',
      date: new Date(2023, 1, 15),
      source: MedicalEventSource.PROVIDER,
    }),
    createVisitFixture(recordId, 'Consulta de rotina anual', {
      provider: 'Dr. Carlos Mendes',
      date: new Date(2023, 1, 15),
      source: MedicalEventSource.PROVIDER,
    }),
    createMedicationFixture(recordId, 'Losartana 50mg - 1 comprimido por dia', {
      provider: 'Dr. Carlos Mendes',
      date: new Date(2023, 1, 15),
      source: MedicalEventSource.PROVIDER,
    }),
  ];
  
  // Add randomly generated events to reach the desired count
  const remainingCount = count - history.length;
  if (remainingCount > 0) {
    history.push(...createMedicalEventBatch(recordId, remainingCount));
  }
  
  // Sort by date, most recent first
  return history.sort((a, b) => b.date.getTime() - a.date.getTime());
}

/**
 * All medical event fixtures grouped by type
 */
export const allMedicalEventFixtures = {
  diagnoses: diagnosisFixtures,
  procedures: procedureFixtures,
  medications: medicationFixtures,
  allergies: allergyFixtures,
  visits: visitFixtures,
  immunizations: immunizationFixtures,
  labResults: labResultFixtures,
};

/**
 * All medical history scenarios
 */
export const medicalHistoryScenarios = {
  chronicConditions: chronicConditionsHistory,
  respiratoryConditions: respiratoryConditionsHistory,
  acuteConditions: acuteConditionsHistory,
  generateComplete: generateCompleteMedicalHistory,
};