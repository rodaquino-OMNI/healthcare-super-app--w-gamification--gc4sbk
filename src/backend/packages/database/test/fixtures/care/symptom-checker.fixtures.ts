/**
 * @file Symptom Checker Test Fixtures
 * 
 * This file provides test fixtures for symptom checker queries and responses with varying
 * severity levels, recommended actions, and emergency flags. These fixtures enable testing
 * of symptom evaluation logic, emergency detection, and recommendation generation in the
 * Care journey.
 */

/**
 * Interface for symptom checker query fixtures
 */
export interface SymptomCheckerQuery {
  id: string;
  userId: string;
  symptoms: string[];
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
  recommendation?: string;
  emergencyDetected?: boolean;
  recommendedAction?: 'SELF_CARE' | 'SCHEDULE_APPOINTMENT' | 'URGENT_CARE' | 'EMERGENCY_SERVICES';
  createdAt: Date;
}

/**
 * Interface for symptom checker response fixtures
 */
export interface SymptomCheckerResponse {
  queryId: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
  recommendation: string;
  emergencyDetected: boolean;
  recommendedAction: 'SELF_CARE' | 'SCHEDULE_APPOINTMENT' | 'URGENT_CARE' | 'EMERGENCY_SERVICES';
  possibleConditions?: string[];
  createdAt: Date;
}

/**
 * Common symptom groups for different medical categories
 */
export const symptomGroups = {
  respiratory: [
    'tosse', 'falta de ar', 'congestão nasal', 'dor de garganta', 'respiração rápida',
    'chiado no peito', 'tosse com sangue', 'dificuldade para respirar'
  ],
  cardiac: [
    'dor no peito', 'palpitações', 'falta de ar', 'tontura', 'desmaio',
    'dor irradiando para o braço', 'sudorese excessiva', 'náusea com dor no peito'
  ],
  gastrointestinal: [
    'náusea', 'vômito', 'diarreia', 'dor abdominal', 'constipação',
    'sangue nas fezes', 'azia', 'inchaço abdominal', 'perda de apetite'
  ],
  neurological: [
    'dor de cabeça', 'tontura', 'confusão', 'fraqueza', 'dormência',
    'dificuldade para falar', 'visão turva', 'convulsões', 'perda de consciência'
  ],
  musculoskeletal: [
    'dor nas articulações', 'dor muscular', 'inchaço', 'rigidez', 'limitação de movimento',
    'fraqueza muscular', 'cãibras', 'dor nas costas', 'dor no pescoço'
  ],
  dermatological: [
    'erupção cutânea', 'coceira', 'vermelhidão', 'inchaço', 'bolhas',
    'descamação', 'mudanças na cor da pele', 'feridas que não cicatrizam'
  ],
  general: [
    'febre', 'fadiga', 'perda de peso', 'suores noturnos', 'mal-estar',
    'fraqueza generalizada', 'calafrios', 'perda de apetite'
  ],
  emergency: [
    'dificuldade respiratória severa', 'dor intensa no peito', 'convulsões',
    'sangramento descontrolado', 'perda de consciência', 'paralisia súbita',
    'confusão mental severa', 'febre muito alta (acima de 39.5°C)'
  ]
};

/**
 * Predefined recommendations based on severity
 */
export const recommendations = {
  LOW: [
    'Descanse e mantenha-se hidratado. Monitore seus sintomas e procure atendimento médico se piorarem.',
    'Seus sintomas parecem leves. Recomendamos repouso e medicamentos de venda livre conforme necessário.',
    'Baseado nos sintomas informados, não há necessidade de atendimento médico imediato. Monitore sua condição.',
    'Recomendamos medidas de autocuidado como repouso, hidratação e medicamentos de venda livre para alívio dos sintomas.'
  ],
  MEDIUM: [
    'Recomendamos que você agende uma consulta com um médico nos próximos dias para avaliar seus sintomas.',
    'Seus sintomas merecem atenção médica. Agende uma consulta para avaliação profissional.',
    'Embora não seja uma emergência, seus sintomas indicam a necessidade de avaliação médica. Agende uma consulta.',
    'Recomendamos que você consulte um médico dentro de 2-3 dias para avaliar sua condição.'
  ],
  HIGH: [
    'Seus sintomas indicam uma condição que requer atenção médica urgente. Procure um pronto atendimento hoje.',
    'Recomendamos que você procure atendimento médico urgente nas próximas horas.',
    'Seus sintomas são preocupantes e requerem avaliação médica imediata. Dirija-se a um pronto atendimento.',
    'Baseado nos sintomas informados, você deve procurar atendimento médico urgente hoje.'
  ],
  EMERGENCY: [
    'ATENÇÃO: Seus sintomas indicam uma possível emergência médica. Procure atendimento de emergência imediatamente ou ligue para 192 (SAMU).',
    'EMERGÊNCIA DETECTADA: Procure o pronto-socorro mais próximo imediatamente ou ligue para 192 (SAMU).',
    'ALERTA: Seus sintomas sugerem uma condição que requer atendimento de emergência imediato. Não espere, procure ajuda agora.',
    'EMERGÊNCIA MÉDICA: Seus sintomas indicam uma condição potencialmente grave que requer atenção médica imediata. Ligue para 192 ou vá ao pronto-socorro agora.'
  ]
};

/**
 * Predefined possible conditions based on symptom groups
 */
export const possibleConditions = {
  respiratory: [
    'Resfriado comum', 'Gripe', 'Bronquite', 'Pneumonia', 'Asma',
    'DPOC', 'COVID-19', 'Sinusite', 'Rinite alérgica'
  ],
  cardiac: [
    'Angina', 'Infarto do miocárdio', 'Arritmia cardíaca', 'Insuficiência cardíaca',
    'Miocardite', 'Pericardite', 'Hipertensão', 'Síndrome coronariana aguda'
  ],
  gastrointestinal: [
    'Gastroenterite', 'Síndrome do intestino irritável', 'Úlcera péptica',
    'Doença inflamatória intestinal', 'Apendicite', 'Cálculos biliares',
    'Refluxo gastroesofágico', 'Intolerância alimentar', 'Gastrite'
  ],
  neurological: [
    'Enxaqueca', 'Acidente vascular cerebral', 'Ataque isquêmico transitório',
    'Concussão', 'Meningite', 'Epilepsia', 'Neuralgia', 'Esclerose múltipla'
  ],
  musculoskeletal: [
    'Artrite', 'Tendinite', 'Bursite', 'Hérnia de disco', 'Fibromialgia',
    'Lesão muscular', 'Osteoartrite', 'Gota', 'Osteoporose'
  ],
  dermatological: [
    'Dermatite', 'Eczema', 'Psoríase', 'Urticária', 'Infecção fúngica',
    'Celulite', 'Herpes zoster', 'Acne', 'Rosácea'
  ],
  general: [
    'Infecção viral', 'Infecção bacteriana', 'Anemia', 'Desidratação',
    'Mononucleose', 'Hipotireoidismo', 'Diabetes', 'Deficiência vitamínica'
  ]
};

// Base user IDs for test fixtures
const userIds = [
  '550e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440003'
];

/**
 * Generate a fixed set of symptom checker queries with LOW severity
 */
const lowSeverityQueries: SymptomCheckerQuery[] = [
  {
    id: '6d2946b7-0a94-4395-8f42-0571cef6c3a0',
    userId: userIds[0],
    symptoms: ['tosse', 'congestão nasal', 'dor de garganta'],
    severity: 'LOW',
    recommendation: recommendations.LOW[0],
    emergencyDetected: false,
    recommendedAction: 'SELF_CARE',
    createdAt: new Date('2023-06-15T10:30:00Z')
  },
  {
    id: '6d2946b7-0a94-4395-8f42-0571cef6c3a1',
    userId: userIds[1],
    symptoms: ['dor nas articulações', 'rigidez', 'fadiga leve'],
    severity: 'LOW',
    recommendation: recommendations.LOW[1],
    emergencyDetected: false,
    recommendedAction: 'SELF_CARE',
    createdAt: new Date('2023-06-16T14:45:00Z')
  },
  {
    id: '6d2946b7-0a94-4395-8f42-0571cef6c3a2',
    userId: userIds[2],
    symptoms: ['náusea leve', 'azia', 'inchaço abdominal'],
    severity: 'LOW',
    recommendation: recommendations.LOW[2],
    emergencyDetected: false,
    recommendedAction: 'SELF_CARE',
    createdAt: new Date('2023-06-17T09:15:00Z')
  }
];

/**
 * Generate a fixed set of symptom checker queries with MEDIUM severity
 */
const mediumSeverityQueries: SymptomCheckerQuery[] = [
  {
    id: '7e3a57c8-1b95-4496-9f53-1682def7c4b0',
    userId: userIds[0],
    symptoms: ['febre', 'tosse persistente', 'fadiga', 'dor de cabeça'],
    severity: 'MEDIUM',
    recommendation: recommendations.MEDIUM[0],
    emergencyDetected: false,
    recommendedAction: 'SCHEDULE_APPOINTMENT',
    createdAt: new Date('2023-06-18T11:20:00Z')
  },
  {
    id: '7e3a57c8-1b95-4496-9f53-1682def7c4b1',
    userId: userIds[1],
    symptoms: ['dor abdominal moderada', 'náusea', 'perda de apetite', 'fadiga'],
    severity: 'MEDIUM',
    recommendation: recommendations.MEDIUM[1],
    emergencyDetected: false,
    recommendedAction: 'SCHEDULE_APPOINTMENT',
    createdAt: new Date('2023-06-19T16:30:00Z')
  },
  {
    id: '7e3a57c8-1b95-4496-9f53-1682def7c4b2',
    userId: userIds[2],
    symptoms: ['dor nas costas persistente', 'dificuldade para dormir', 'desconforto ao sentar'],
    severity: 'MEDIUM',
    recommendation: recommendations.MEDIUM[2],
    emergencyDetected: false,
    recommendedAction: 'SCHEDULE_APPOINTMENT',
    createdAt: new Date('2023-06-20T08:45:00Z')
  }
];

/**
 * Generate a fixed set of symptom checker queries with HIGH severity
 */
const highSeverityQueries: SymptomCheckerQuery[] = [
  {
    id: '8f4b68d9-2c96-45a7-a064-2793efe8d5c0',
    userId: userIds[0],
    symptoms: ['febre alta', 'tosse com sangue', 'falta de ar', 'dor no peito'],
    severity: 'HIGH',
    recommendation: recommendations.HIGH[0],
    emergencyDetected: false,
    recommendedAction: 'URGENT_CARE',
    createdAt: new Date('2023-06-21T13:10:00Z')
  },
  {
    id: '8f4b68d9-2c96-45a7-a064-2793efe8d5c1',
    userId: userIds[1],
    symptoms: ['dor abdominal intensa', 'vômito persistente', 'febre', 'desidratação'],
    severity: 'HIGH',
    recommendation: recommendations.HIGH[1],
    emergencyDetected: false,
    recommendedAction: 'URGENT_CARE',
    createdAt: new Date('2023-06-22T17:25:00Z')
  },
  {
    id: '8f4b68d9-2c96-45a7-a064-2793efe8d5c2',
    userId: userIds[2],
    symptoms: ['dor de cabeça intensa', 'sensibilidade à luz', 'rigidez no pescoço', 'febre'],
    severity: 'HIGH',
    recommendation: recommendations.HIGH[2],
    emergencyDetected: false,
    recommendedAction: 'URGENT_CARE',
    createdAt: new Date('2023-06-23T10:50:00Z')
  }
];

/**
 * Generate a fixed set of symptom checker queries with EMERGENCY severity
 */
const emergencySeverityQueries: SymptomCheckerQuery[] = [
  {
    id: '9g5c79e0-3d07-46b8-b175-38a4efe9e6d0',
    userId: userIds[0],
    symptoms: ['dor intensa no peito', 'falta de ar severa', 'sudorese excessiva', 'náusea'],
    severity: 'EMERGENCY',
    recommendation: recommendations.EMERGENCY[0],
    emergencyDetected: true,
    recommendedAction: 'EMERGENCY_SERVICES',
    createdAt: new Date('2023-06-24T14:05:00Z')
  },
  {
    id: '9g5c79e0-3d07-46b8-b175-38a4efe9e6d1',
    userId: userIds[1],
    symptoms: ['dificuldade para falar', 'paralisia facial', 'fraqueza em um lado do corpo', 'confusão mental'],
    severity: 'EMERGENCY',
    recommendation: recommendations.EMERGENCY[1],
    emergencyDetected: true,
    recommendedAction: 'EMERGENCY_SERVICES',
    createdAt: new Date('2023-06-25T19:40:00Z')
  },
  {
    id: '9g5c79e0-3d07-46b8-b175-38a4efe9e6d2',
    userId: userIds[2],
    symptoms: ['convulsões', 'perda de consciência', 'febre muito alta', 'rigidez no pescoço'],
    severity: 'EMERGENCY',
    recommendation: recommendations.EMERGENCY[2],
    emergencyDetected: true,
    recommendedAction: 'EMERGENCY_SERVICES',
    createdAt: new Date('2023-06-26T12:15:00Z')
  },
  {
    id: '9g5c79e0-3d07-46b8-b175-38a4efe9e6d3',
    userId: userIds[3],
    symptoms: ['sangramento descontrolado', 'palidez extrema', 'tontura severa', 'fraqueza'],
    severity: 'EMERGENCY',
    recommendation: recommendations.EMERGENCY[3],
    emergencyDetected: true,
    recommendedAction: 'EMERGENCY_SERVICES',
    createdAt: new Date('2023-06-27T08:30:00Z')
  }
];

/**
 * All symptom checker queries combined
 */
const allQueries: SymptomCheckerQuery[] = [
  ...lowSeverityQueries,
  ...mediumSeverityQueries,
  ...highSeverityQueries,
  ...emergencySeverityQueries
];

/**
 * Get all symptom checker queries
 * 
 * @returns All symptom checker queries
 */
export function getAllQueries(): SymptomCheckerQuery[] {
  return [...allQueries];
}

/**
 * Get symptom checker queries by severity
 * 
 * @param severity The severity level to filter by
 * @returns Symptom checker queries with the specified severity
 */
export function getQueriesBySeverity(severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY'): SymptomCheckerQuery[] {
  switch (severity) {
    case 'LOW':
      return [...lowSeverityQueries];
    case 'MEDIUM':
      return [...mediumSeverityQueries];
    case 'HIGH':
      return [...highSeverityQueries];
    case 'EMERGENCY':
      return [...emergencySeverityQueries];
    default:
      return [];
  }
}

/**
 * Get symptom checker queries by recommended action
 * 
 * @param action The recommended action to filter by
 * @returns Symptom checker queries with the specified recommended action
 */
export function getQueriesByRecommendedAction(
  action: 'SELF_CARE' | 'SCHEDULE_APPOINTMENT' | 'URGENT_CARE' | 'EMERGENCY_SERVICES'
): SymptomCheckerQuery[] {
  return allQueries.filter(query => query.recommendedAction === action);
}

/**
 * Get symptom checker queries by emergency detection status
 * 
 * @param emergencyDetected Whether to get queries with emergency detected or not
 * @returns Symptom checker queries filtered by emergency detection status
 */
export function getQueriesByEmergencyStatus(emergencyDetected: boolean): SymptomCheckerQuery[] {
  return allQueries.filter(query => query.emergencyDetected === emergencyDetected);
}

/**
 * Get a symptom checker query by ID
 * 
 * @param id The ID of the query to retrieve
 * @returns The symptom checker query with the specified ID, or undefined if not found
 */
export function getQueryById(id: string): SymptomCheckerQuery | undefined {
  return allQueries.find(query => query.id === id);
}

/**
 * Get symptom checker queries by user ID
 * 
 * @param userId The user ID to filter by
 * @returns Symptom checker queries for the specified user
 */
export function getQueriesByUserId(userId: string): SymptomCheckerQuery[] {
  return allQueries.filter(query => query.userId === userId);
}

/**
 * Create a custom symptom checker query with specified properties
 * 
 * @param props Properties to override in the created query
 * @returns A new symptom checker query with the specified properties
 */
export function createCustomQuery(props: Partial<SymptomCheckerQuery>): SymptomCheckerQuery {
  // Generate a random ID if not provided
  const id = props.id || `custom-${Math.random().toString(36).substring(2, 11)}`;
  
  // Default to the first user ID if not provided
  const userId = props.userId || userIds[0];
  
  // Default to low severity symptoms if not provided
  const symptoms = props.symptoms || symptomGroups.respiratory.slice(0, 3);
  
  // Default to LOW severity if not provided
  const severity = props.severity || 'LOW';
  
  // Default recommendation based on severity if not provided
  const recommendation = props.recommendation || 
    recommendations[severity][Math.floor(Math.random() * recommendations[severity].length)];
  
  // Default emergency detection based on severity if not provided
  const emergencyDetected = props.emergencyDetected !== undefined ? 
    props.emergencyDetected : (severity === 'EMERGENCY');
  
  // Default recommended action based on severity if not provided
  let recommendedAction = props.recommendedAction;
  if (!recommendedAction) {
    switch (severity) {
      case 'LOW':
        recommendedAction = 'SELF_CARE';
        break;
      case 'MEDIUM':
        recommendedAction = 'SCHEDULE_APPOINTMENT';
        break;
      case 'HIGH':
        recommendedAction = 'URGENT_CARE';
        break;
      case 'EMERGENCY':
        recommendedAction = 'EMERGENCY_SERVICES';
        break;
    }
  }
  
  // Default to current date if not provided
  const createdAt = props.createdAt || new Date();
  
  return {
    id,
    userId,
    symptoms,
    severity,
    recommendation,
    emergencyDetected,
    recommendedAction,
    createdAt
  };
}

/**
 * Create a symptom checker response for a given query
 * 
 * @param query The symptom checker query to create a response for
 * @param overrideProps Optional properties to override in the created response
 * @returns A new symptom checker response for the specified query
 */
export function createResponseForQuery(
  query: SymptomCheckerQuery,
  overrideProps?: Partial<SymptomCheckerResponse>
): SymptomCheckerResponse {
  // Determine possible conditions based on symptoms
  let possibleConditionsList: string[] = [];
  
  // Check which symptom groups are represented in the query
  const matchingGroups: string[] = [];
  
  Object.entries(symptomGroups).forEach(([group, groupSymptoms]) => {
    const hasSymptomFromGroup = query.symptoms.some(symptom => 
      groupSymptoms.some(groupSymptom => groupSymptom.includes(symptom) || symptom.includes(groupSymptom))
    );
    
    if (hasSymptomFromGroup) {
      matchingGroups.push(group);
    }
  });
  
  // Get possible conditions from matching groups
  matchingGroups.forEach(group => {
    if (group in possibleConditions) {
      // Get 1-3 random conditions from this group
      const groupConditions = possibleConditions[group as keyof typeof possibleConditions];
      const numConditions = Math.floor(Math.random() * 3) + 1;
      const selectedConditions = [];
      
      for (let i = 0; i < numConditions; i++) {
        const randomIndex = Math.floor(Math.random() * groupConditions.length);
        if (!selectedConditions.includes(groupConditions[randomIndex])) {
          selectedConditions.push(groupConditions[randomIndex]);
        }
      }
      
      possibleConditionsList = [...possibleConditionsList, ...selectedConditions];
    }
  });
  
  // Create the response
  return {
    queryId: query.id,
    severity: overrideProps?.severity || query.severity,
    recommendation: overrideProps?.recommendation || query.recommendation || 
      recommendations[query.severity][Math.floor(Math.random() * recommendations[query.severity].length)],
    emergencyDetected: overrideProps?.emergencyDetected !== undefined ? 
      overrideProps.emergencyDetected : (query.emergencyDetected || query.severity === 'EMERGENCY'),
    recommendedAction: overrideProps?.recommendedAction || query.recommendedAction || 'SELF_CARE',
    possibleConditions: overrideProps?.possibleConditions || possibleConditionsList,
    createdAt: overrideProps?.createdAt || new Date()
  };
}

/**
 * Create a batch of symptom checker queries with specified properties
 * 
 * @param count Number of queries to create
 * @param baseProps Base properties to apply to all created queries
 * @returns An array of new symptom checker queries
 */
export function createQueryBatch(
  count: number,
  baseProps?: Partial<SymptomCheckerQuery>
): SymptomCheckerQuery[] {
  const queries: SymptomCheckerQuery[] = [];
  
  for (let i = 0; i < count; i++) {
    // Create a unique ID for each query
    const id = `batch-${Math.random().toString(36).substring(2, 9)}-${i}`;
    
    // Randomly select a user ID
    const userId = userIds[Math.floor(Math.random() * userIds.length)];
    
    // Randomly select a symptom group
    const groupKeys = Object.keys(symptomGroups);
    const randomGroup = groupKeys[Math.floor(Math.random() * groupKeys.length)] as keyof typeof symptomGroups;
    
    // Randomly select 2-5 symptoms from the group
    const groupSymptoms = symptomGroups[randomGroup];
    const numSymptoms = Math.floor(Math.random() * 4) + 2; // 2-5 symptoms
    const selectedSymptoms: string[] = [];
    
    for (let j = 0; j < numSymptoms; j++) {
      const randomIndex = Math.floor(Math.random() * groupSymptoms.length);
      if (!selectedSymptoms.includes(groupSymptoms[randomIndex])) {
        selectedSymptoms.push(groupSymptoms[randomIndex]);
      }
    }
    
    // Randomly select a severity
    const severities: Array<'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY'> = ['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'];
    const randomSeverity = severities[Math.floor(Math.random() * severities.length)];
    
    // Create a date within the last 30 days
    const daysAgo = Math.floor(Math.random() * 30);
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - daysAgo);
    
    // Create the query with base properties and random values
    queries.push(createCustomQuery({
      id,
      userId,
      symptoms: selectedSymptoms,
      severity: randomSeverity,
      createdAt,
      ...baseProps
    }));
  }
  
  return queries;
}

/**
 * Get a set of emergency symptom patterns for testing emergency detection
 * 
 * @returns An array of symptom patterns that should trigger emergency detection
 */
export function getEmergencySymptomPatterns(): { symptoms: string[], description: string }[] {
  return [
    {
      symptoms: ['dor intensa no peito', 'falta de ar', 'sudorese'],
      description: 'Possível ataque cardíaco'
    },
    {
      symptoms: ['dificuldade para falar', 'paralisia facial', 'fraqueza em um lado'],
      description: 'Possível AVC (derrame)'
    },
    {
      symptoms: ['convulsões', 'perda de consciência'],
      description: 'Emergência neurológica'
    },
    {
      symptoms: ['sangramento descontrolado', 'palidez extrema'],
      description: 'Hemorragia grave'
    },
    {
      symptoms: ['febre muito alta', 'rigidez no pescoço', 'confusão mental'],
      description: 'Possível meningite'
    },
    {
      symptoms: ['dificuldade respiratória severa', 'lábios azulados'],
      description: 'Insuficiência respiratória'
    },
    {
      symptoms: ['dor abdominal intensa e súbita', 'abdômen rígido'],
      description: 'Possível apendicite ou perfuração intestinal'
    },
    {
      symptoms: ['reação alérgica grave', 'inchaço na garganta', 'dificuldade para respirar'],
      description: 'Anafilaxia'
    }
  ];
}

/**
 * Get a set of symptom checker test scenarios for comprehensive testing
 * 
 * @returns An object containing various test scenarios for the symptom checker
 */
export function getSymptomCheckerTestScenarios() {
  return {
    // Basic severity scenarios
    severityScenarios: {
      low: lowSeverityQueries[0],
      medium: mediumSeverityQueries[0],
      high: highSeverityQueries[0],
      emergency: emergencySeverityQueries[0]
    },
    
    // Emergency detection scenarios
    emergencyScenarios: {
      cardiacEmergency: emergencySeverityQueries[0],
      strokeEmergency: emergencySeverityQueries[1],
      neurologicalEmergency: emergencySeverityQueries[2],
      bleedingEmergency: emergencySeverityQueries[3]
    },
    
    // Edge cases
    edgeCases: {
      // Borderline case between medium and high severity
      borderlineMediumHigh: createCustomQuery({
        symptoms: ['febre alta', 'tosse persistente', 'falta de ar leve'],
        severity: 'MEDIUM',
        recommendedAction: 'SCHEDULE_APPOINTMENT'
      }),
      
      // Borderline case between high and emergency
      borderlineHighEmergency: createCustomQuery({
        symptoms: ['dor no peito', 'falta de ar', 'tontura'],
        severity: 'HIGH',
        recommendedAction: 'URGENT_CARE'
      }),
      
      // Minimal symptoms case
      minimalSymptoms: createCustomQuery({
        symptoms: ['fadiga leve'],
        severity: 'LOW',
        recommendedAction: 'SELF_CARE'
      }),
      
      // Many symptoms case
      manySymptoms: createCustomQuery({
        symptoms: [
          'febre', 'tosse', 'dor de cabeça', 'fadiga', 'dor muscular',
          'dor de garganta', 'congestão nasal', 'perda de apetite'
        ],
        severity: 'MEDIUM',
        recommendedAction: 'SCHEDULE_APPOINTMENT'
      })
    },
    
    // Symptom progression scenarios (for testing symptom tracking over time)
    progressionScenarios: {
      // Worsening condition
      worsening: [
        createCustomQuery({
          id: 'progression-worse-1',
          userId: userIds[0],
          symptoms: ['tosse leve', 'congestão nasal'],
          severity: 'LOW',
          createdAt: new Date('2023-06-01T10:00:00Z')
        }),
        createCustomQuery({
          id: 'progression-worse-2',
          userId: userIds[0],
          symptoms: ['tosse persistente', 'congestão nasal', 'febre baixa'],
          severity: 'MEDIUM',
          createdAt: new Date('2023-06-03T14:00:00Z')
        }),
        createCustomQuery({
          id: 'progression-worse-3',
          userId: userIds[0],
          symptoms: ['tosse com catarro', 'febre alta', 'falta de ar', 'dor no peito'],
          severity: 'HIGH',
          createdAt: new Date('2023-06-05T09:00:00Z')
        })
      ],
      
      // Improving condition
      improving: [
        createCustomQuery({
          id: 'progression-better-1',
          userId: userIds[1],
          symptoms: ['dor de cabeça intensa', 'sensibilidade à luz', 'náusea'],
          severity: 'HIGH',
          createdAt: new Date('2023-06-10T08:00:00Z')
        }),
        createCustomQuery({
          id: 'progression-better-2',
          userId: userIds[1],
          symptoms: ['dor de cabeça moderada', 'sensibilidade à luz leve'],
          severity: 'MEDIUM',
          createdAt: new Date('2023-06-11T16:00:00Z')
        }),
        createCustomQuery({
          id: 'progression-better-3',
          userId: userIds[1],
          symptoms: ['dor de cabeça leve'],
          severity: 'LOW',
          createdAt: new Date('2023-06-12T10:00:00Z')
        })
      ]
    }
  };
}

// Default export for easier importing
export default {
  getAllQueries,
  getQueriesBySeverity,
  getQueriesByRecommendedAction,
  getQueriesByEmergencyStatus,
  getQueryById,
  getQueriesByUserId,
  createCustomQuery,
  createResponseForQuery,
  createQueryBatch,
  getEmergencySymptomPatterns,
  getSymptomCheckerTestScenarios,
  symptomGroups,
  recommendations,
  possibleConditions
};