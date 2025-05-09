/**
 * @file claims.fixtures.ts
 * @description Test fixtures for insurance claims in the Plan journey.
 * Provides mock data for different claim types and processing states.
 */

import { ClaimStatus, IClaim, IClaimEvent } from '@austa/interfaces/journey/plan';

/**
 * Base claim object with default values that can be overridden
 */
export const baseClaim: Partial<IClaim> = {
  userId: '550e8400-e29b-41d4-a716-446655440000', // Default test user ID
  planId: 'a631a0d2-d2ac-4b3b-8a37-7cefc3d35cc1', // Default test plan ID
  amount: 150.0,
  status: ClaimStatus.SUBMITTED,
  submittedAt: new Date('2023-06-15T10:30:00Z'),
  processedAt: new Date('2023-06-16T14:45:00Z'),
  documents: [],
  metadata: {}
};

/**
 * Medical consultation claim fixtures
 */
export const medicalConsultationClaims = {
  /**
   * Draft medical consultation claim
   */
  draft: {
    id: '7f9c5d3a-8c1e-4b5a-9d7f-1e3c5b9a8d7f',
    ...baseClaim,
    type: 'Consulta Médica',
    amount: 200.0,
    status: ClaimStatus.DRAFT,
    submittedAt: new Date('2023-06-10T09:15:00Z'),
    processedAt: new Date('2023-06-10T09:15:00Z'),
    metadata: {
      providerName: 'Dra. Ana Silva',
      providerSpecialty: 'Cardiologia',
      consultationDate: '2023-06-05T14:30:00Z',
      location: 'Clínica Cardio Saúde',
      notes: 'Consulta de rotina'
    }
  },

  /**
   * Submitted medical consultation claim
   */
  submitted: {
    id: '8a7b6c5d-4e3f-2a1b-0c9d-8e7f6a5b4c3d',
    ...baseClaim,
    type: 'Consulta Médica',
    amount: 250.0,
    status: ClaimStatus.SUBMITTED,
    submittedAt: new Date('2023-06-15T10:30:00Z'),
    processedAt: new Date('2023-06-15T10:30:00Z'),
    metadata: {
      providerName: 'Dr. Carlos Mendes',
      providerSpecialty: 'Ortopedia',
      consultationDate: '2023-06-12T11:00:00Z',
      location: 'Hospital São Lucas',
      notes: 'Consulta para avaliação de dor no joelho'
    }
  },

  /**
   * Under review medical consultation claim
   */
  underReview: {
    id: '9b8a7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d',
    ...baseClaim,
    type: 'Consulta Médica',
    amount: 180.0,
    status: ClaimStatus.UNDER_REVIEW,
    submittedAt: new Date('2023-06-18T14:20:00Z'),
    processedAt: new Date('2023-06-19T09:45:00Z'),
    metadata: {
      providerName: 'Dra. Mariana Costa',
      providerSpecialty: 'Dermatologia',
      consultationDate: '2023-06-15T16:30:00Z',
      location: 'Clínica Derma Plus',
      notes: 'Consulta para avaliação de lesão na pele',
      reviewNotes: 'Verificando documentação adicional'
    }
  },

  /**
   * Approved medical consultation claim
   */
  approved: {
    id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    ...baseClaim,
    type: 'Consulta Médica',
    amount: 220.0,
    status: ClaimStatus.APPROVED,
    submittedAt: new Date('2023-06-05T11:30:00Z'),
    processedAt: new Date('2023-06-08T15:20:00Z'),
    metadata: {
      providerName: 'Dr. Roberto Almeida',
      providerSpecialty: 'Psiquiatria',
      consultationDate: '2023-06-01T10:00:00Z',
      location: 'Centro Médico Saúde Mental',
      notes: 'Consulta de acompanhamento',
      approvedAmount: 220.0,
      approvedDate: '2023-06-08T15:20:00Z',
      approvedBy: 'Sistema Automático'
    }
  },

  /**
   * Denied medical consultation claim
   */
  denied: {
    id: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
    ...baseClaim,
    type: 'Consulta Médica',
    amount: 300.0,
    status: ClaimStatus.DENIED,
    submittedAt: new Date('2023-06-02T16:45:00Z'),
    processedAt: new Date('2023-06-07T11:10:00Z'),
    metadata: {
      providerName: 'Dra. Juliana Ferreira',
      providerSpecialty: 'Endocrinologia',
      consultationDate: '2023-05-30T09:15:00Z',
      location: 'Clínica Endocrino',
      notes: 'Consulta para avaliação de tireoide',
      denialReason: 'Consulta realizada fora do período de cobertura',
      deniedDate: '2023-06-07T11:10:00Z',
      deniedBy: 'Analista de Reembolso'
    }
  },

  /**
   * Additional info required medical consultation claim
   */
  additionalInfoRequired: {
    id: 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
    ...baseClaim,
    type: 'Consulta Médica',
    amount: 190.0,
    status: ClaimStatus.ADDITIONAL_INFO_REQUIRED,
    submittedAt: new Date('2023-06-20T13:25:00Z'),
    processedAt: new Date('2023-06-22T10:15:00Z'),
    metadata: {
      providerName: 'Dr. Fernando Santos',
      providerSpecialty: 'Oftalmologia',
      consultationDate: '2023-06-18T14:30:00Z',
      location: 'Clínica Visão Clara',
      notes: 'Consulta para avaliação de miopia',
      missingInfo: 'Receita médica com CRM legível',
      requestDate: '2023-06-22T10:15:00Z',
      requestedBy: 'Analista de Reembolso'
    }
  }
};

/**
 * Medical exam claim fixtures
 */
export const medicalExamClaims = {
  /**
   * Draft medical exam claim
   */
  draft: {
    id: 'd4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a',
    ...baseClaim,
    type: 'Exame',
    amount: 350.0,
    status: ClaimStatus.DRAFT,
    submittedAt: new Date('2023-06-22T15:40:00Z'),
    processedAt: new Date('2023-06-22T15:40:00Z'),
    metadata: {
      providerName: 'Laboratório Diagnóstico',
      examType: 'Ressonância Magnética',
      examDate: '2023-06-20T09:00:00Z',
      bodyPart: 'Joelho direito',
      requestingDoctor: 'Dr. Carlos Mendes',
      notes: 'Exame para avaliação de lesão no menisco'
    }
  },

  /**
   * Submitted medical exam claim
   */
  submitted: {
    id: 'e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b',
    ...baseClaim,
    type: 'Exame',
    amount: 120.0,
    status: ClaimStatus.SUBMITTED,
    submittedAt: new Date('2023-06-25T11:20:00Z'),
    processedAt: new Date('2023-06-25T11:20:00Z'),
    metadata: {
      providerName: 'Laboratório Central',
      examType: 'Hemograma Completo',
      examDate: '2023-06-23T08:30:00Z',
      requestingDoctor: 'Dra. Ana Silva',
      notes: 'Exame de rotina anual'
    }
  },

  /**
   * Under review medical exam claim
   */
  underReview: {
    id: 'f6a7b8c9-d0e1-2f3a-4b5c-6d7e8f9a0b1c',
    ...baseClaim,
    type: 'Exame',
    amount: 450.0,
    status: ClaimStatus.UNDER_REVIEW,
    submittedAt: new Date('2023-06-18T09:15:00Z'),
    processedAt: new Date('2023-06-20T14:30:00Z'),
    metadata: {
      providerName: 'Centro de Imagem Avançada',
      examType: 'Tomografia Computadorizada',
      examDate: '2023-06-15T11:00:00Z',
      bodyPart: 'Tórax',
      requestingDoctor: 'Dr. Paulo Ribeiro',
      notes: 'Exame para investigação de nódulo pulmonar',
      reviewNotes: 'Verificando cobertura para este tipo de exame'
    }
  },

  /**
   * Approved medical exam claim
   */
  approved: {
    id: 'a7b8c9d0-e1f2-3a4b-5c6d-7e8f9a0b1c2d',
    ...baseClaim,
    type: 'Exame',
    amount: 280.0,
    status: ClaimStatus.APPROVED,
    submittedAt: new Date('2023-06-10T16:30:00Z'),
    processedAt: new Date('2023-06-14T11:45:00Z'),
    metadata: {
      providerName: 'Laboratório Cardio',
      examType: 'Ecocardiograma',
      examDate: '2023-06-08T14:00:00Z',
      requestingDoctor: 'Dra. Ana Silva',
      notes: 'Exame para avaliação cardíaca',
      approvedAmount: 250.0, // Partial approval
      approvedDate: '2023-06-14T11:45:00Z',
      approvedBy: 'Analista de Reembolso',
      partialApprovalReason: 'Valor excede tabela de referência'
    }
  },

  /**
   * Denied medical exam claim
   */
  denied: {
    id: 'b8c9d0e1-f2a3-4b5c-6d7e-8f9a0b1c2d3e',
    ...baseClaim,
    type: 'Exame',
    amount: 1200.0,
    status: ClaimStatus.DENIED,
    submittedAt: new Date('2023-06-05T10:20:00Z'),
    processedAt: new Date('2023-06-09T15:30:00Z'),
    metadata: {
      providerName: 'Centro de Diagnóstico Avançado',
      examType: 'PET-CT',
      examDate: '2023-06-02T09:00:00Z',
      bodyPart: 'Corpo inteiro',
      requestingDoctor: 'Dr. Ricardo Nunes',
      notes: 'Exame para estadiamento oncológico',
      denialReason: 'Exame não coberto pelo plano contratado',
      deniedDate: '2023-06-09T15:30:00Z',
      deniedBy: 'Analista de Reembolso'
    }
  }
};

/**
 * Therapy session claim fixtures
 */
export const therapyClaims = {
  /**
   * Draft therapy claim
   */
  draft: {
    id: 'c9d0e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
    ...baseClaim,
    type: 'Terapia',
    amount: 150.0,
    status: ClaimStatus.DRAFT,
    submittedAt: new Date('2023-06-28T17:30:00Z'),
    processedAt: new Date('2023-06-28T17:30:00Z'),
    metadata: {
      providerName: 'Clínica Fisio Saúde',
      therapyType: 'Fisioterapia',
      sessionDate: '2023-06-26T16:00:00Z',
      requestingDoctor: 'Dr. Carlos Mendes',
      sessionNumber: 1,
      totalSessions: 10,
      notes: 'Primeira sessão de fisioterapia para recuperação pós-cirúrgica'
    }
  },

  /**
   * Submitted therapy claim
   */
  submitted: {
    id: 'd0e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
    ...baseClaim,
    type: 'Terapia',
    amount: 150.0,
    status: ClaimStatus.SUBMITTED,
    submittedAt: new Date('2023-06-20T14:15:00Z'),
    processedAt: new Date('2023-06-20T14:15:00Z'),
    metadata: {
      providerName: 'Centro de Psicologia Integrada',
      therapyType: 'Psicoterapia',
      sessionDate: '2023-06-18T10:00:00Z',
      requestingDoctor: 'Dr. Roberto Almeida',
      sessionNumber: 5,
      totalSessions: 12,
      notes: 'Sessão de acompanhamento psicológico'
    }
  },

  /**
   * Under review therapy claim
   */
  underReview: {
    id: 'e1f2a3b4-c5d6-7e8f-9a0b-1c2d3e4f5a6b',
    ...baseClaim,
    type: 'Terapia',
    amount: 180.0,
    status: ClaimStatus.UNDER_REVIEW,
    submittedAt: new Date('2023-06-15T11:45:00Z'),
    processedAt: new Date('2023-06-17T09:30:00Z'),
    metadata: {
      providerName: 'Clínica Fono Bem',
      therapyType: 'Fonoaudiologia',
      sessionDate: '2023-06-12T15:30:00Z',
      requestingDoctor: 'Dra. Patrícia Lima',
      sessionNumber: 3,
      totalSessions: 8,
      notes: 'Sessão para tratamento de disfonia',
      reviewNotes: 'Verificando limite de sessões cobertas'
    }
  },

  /**
   * Approved therapy claim
   */
  approved: {
    id: 'f2a3b4c5-d6e7-8f9a-0b1c-2d3e4f5a6b7c',
    ...baseClaim,
    type: 'Terapia',
    amount: 150.0,
    status: ClaimStatus.APPROVED,
    submittedAt: new Date('2023-06-08T16:20:00Z'),
    processedAt: new Date('2023-06-12T10:15:00Z'),
    metadata: {
      providerName: 'Clínica Fisio Saúde',
      therapyType: 'Fisioterapia',
      sessionDate: '2023-06-05T14:00:00Z',
      requestingDoctor: 'Dr. Carlos Mendes',
      sessionNumber: 7,
      totalSessions: 10,
      notes: 'Sessão de fisioterapia para recuperação pós-cirúrgica',
      approvedAmount: 150.0,
      approvedDate: '2023-06-12T10:15:00Z',
      approvedBy: 'Analista de Reembolso'
    }
  },

  /**
   * Denied therapy claim
   */
  denied: {
    id: 'a3b4c5d6-e7f8-9a0b-1c2d-3e4f5a6b7c8d',
    ...baseClaim,
    type: 'Terapia',
    amount: 200.0,
    status: ClaimStatus.DENIED,
    submittedAt: new Date('2023-06-03T09:45:00Z'),
    processedAt: new Date('2023-06-07T14:30:00Z'),
    metadata: {
      providerName: 'Centro de Terapias Alternativas',
      therapyType: 'Acupuntura',
      sessionDate: '2023-06-01T11:00:00Z',
      requestingDoctor: 'Dr. Marcos Tanaka',
      sessionNumber: 1,
      totalSessions: 5,
      notes: 'Sessão para tratamento de dor lombar',
      denialReason: 'Terapia não coberta pelo plano contratado',
      deniedDate: '2023-06-07T14:30:00Z',
      deniedBy: 'Analista de Reembolso'
    }
  },

  /**
   * Appealed therapy claim
   */
  appealed: {
    id: 'b4c5d6e7-f8a9-0b1c-2d3e-4f5a6b7c8d9e',
    ...baseClaim,
    type: 'Terapia',
    amount: 200.0,
    status: ClaimStatus.APPEALED,
    submittedAt: new Date('2023-05-25T14:30:00Z'),
    processedAt: new Date('2023-06-10T11:20:00Z'),
    metadata: {
      providerName: 'Centro de Terapias Alternativas',
      therapyType: 'Acupuntura',
      sessionDate: '2023-05-22T11:00:00Z',
      requestingDoctor: 'Dr. Marcos Tanaka',
      sessionNumber: 1,
      totalSessions: 5,
      notes: 'Sessão para tratamento de dor lombar',
      denialReason: 'Terapia não coberta pelo plano contratado',
      deniedDate: '2023-05-30T14:30:00Z',
      deniedBy: 'Analista de Reembolso',
      appealDate: '2023-06-05T09:15:00Z',
      appealReason: 'Apresentação de laudo médico justificando necessidade terapêutica',
      appealDocuments: ['laudo_medico.pdf', 'artigo_cientifico.pdf']
    }
  }
};

/**
 * Hospitalization claim fixtures
 */
export const hospitalizationClaims = {
  /**
   * Draft hospitalization claim
   */
  draft: {
    id: 'c5d6e7f8-a9b0-1c2d-3e4f-5a6b7c8d9e0f',
    ...baseClaim,
    type: 'Internação',
    amount: 5000.0,
    status: ClaimStatus.DRAFT,
    submittedAt: new Date('2023-06-30T16:45:00Z'),
    processedAt: new Date('2023-06-30T16:45:00Z'),
    metadata: {
      providerName: 'Hospital São Lucas',
      admissionDate: '2023-06-25T08:00:00Z',
      dischargeDate: '2023-06-28T14:00:00Z',
      attendingPhysician: 'Dr. Ricardo Nunes',
      reason: 'Apendicectomia',
      roomType: 'Semi-privativo',
      notes: 'Internação para cirurgia de apendicite'
    }
  },

  /**
   * Submitted hospitalization claim
   */
  submitted: {
    id: 'd6e7f8a9-b0c1-2d3e-4f5a-6b7c8d9e0f1a',
    ...baseClaim,
    type: 'Internação',
    amount: 8500.0,
    status: ClaimStatus.SUBMITTED,
    submittedAt: new Date('2023-06-22T11:30:00Z'),
    processedAt: new Date('2023-06-22T11:30:00Z'),
    metadata: {
      providerName: 'Hospital Santa Maria',
      admissionDate: '2023-06-15T10:00:00Z',
      dischargeDate: '2023-06-20T16:00:00Z',
      attendingPhysician: 'Dra. Carla Rodrigues',
      reason: 'Pneumonia',
      roomType: 'Privativo',
      notes: 'Internação para tratamento de pneumonia grave'
    }
  },

  /**
   * Under review hospitalization claim
   */
  underReview: {
    id: 'e7f8a9b0-c1d2-3e4f-5a6b-7c8d9e0f1a2b',
    ...baseClaim,
    type: 'Internação',
    amount: 12000.0,
    status: ClaimStatus.UNDER_REVIEW,
    submittedAt: new Date('2023-06-18T15:20:00Z'),
    processedAt: new Date('2023-06-20T09:45:00Z'),
    metadata: {
      providerName: 'Hospital Central',
      admissionDate: '2023-06-10T14:30:00Z',
      dischargeDate: '2023-06-16T11:00:00Z',
      attendingPhysician: 'Dr. Paulo Ribeiro',
      reason: 'Fratura de fêmur',
      roomType: 'Privativo',
      notes: 'Internação para cirurgia ortopédica',
      reviewNotes: 'Verificando detalhamento de custos hospitalares'
    }
  },

  /**
   * Approved hospitalization claim
   */
  approved: {
    id: 'f8a9b0c1-d2e3-4f5a-6b7c-8d9e0f1a2b3c',
    ...baseClaim,
    type: 'Internação',
    amount: 7500.0,
    status: ClaimStatus.APPROVED,
    submittedAt: new Date('2023-06-05T10:15:00Z'),
    processedAt: new Date('2023-06-12T14:30:00Z'),
    metadata: {
      providerName: 'Hospital São Lucas',
      admissionDate: '2023-05-28T09:00:00Z',
      dischargeDate: '2023-06-02T16:00:00Z',
      attendingPhysician: 'Dra. Ana Silva',
      reason: 'Colecistectomia',
      roomType: 'Semi-privativo',
      notes: 'Internação para cirurgia de vesícula',
      approvedAmount: 7000.0, // Partial approval
      approvedDate: '2023-06-12T14:30:00Z',
      approvedBy: 'Analista de Reembolso',
      partialApprovalReason: 'Alguns itens não cobertos pelo plano'
    }
  },

  /**
   * Additional info required hospitalization claim
   */
  additionalInfoRequired: {
    id: 'a9b0c1d2-e3f4-5a6b-7c8d-9e0f1a2b3c4d',
    ...baseClaim,
    type: 'Internação',
    amount: 15000.0,
    status: ClaimStatus.ADDITIONAL_INFO_REQUIRED,
    submittedAt: new Date('2023-06-15T09:30:00Z'),
    processedAt: new Date('2023-06-19T11:45:00Z'),
    metadata: {
      providerName: 'Hospital Universitário',
      admissionDate: '2023-06-08T08:00:00Z',
      dischargeDate: '2023-06-14T10:00:00Z',
      attendingPhysician: 'Dr. Fernando Santos',
      reason: 'Cirurgia cardíaca',
      roomType: 'UTI / Apartamento',
      notes: 'Internação para cirurgia de revascularização do miocárdio',
      missingInfo: 'Relatório médico detalhado e notas fiscais discriminadas',
      requestDate: '2023-06-19T11:45:00Z',
      requestedBy: 'Analista de Reembolso'
    }
  }
};

/**
 * Medication claim fixtures
 */
export const medicationClaims = {
  /**
   * Draft medication claim
   */
  draft: {
    id: 'b0c1d2e3-f4a5-6b7c-8d9e-0f1a2b3c4d5e',
    ...baseClaim,
    type: 'Medicamento',
    amount: 120.0,
    status: ClaimStatus.DRAFT,
    submittedAt: new Date('2023-06-29T15:30:00Z'),
    processedAt: new Date('2023-06-29T15:30:00Z'),
    metadata: {
      pharmacy: 'Farmácia Popular',
      purchaseDate: '2023-06-27T10:45:00Z',
      prescribingDoctor: 'Dra. Ana Silva',
      medications: [
        { name: 'Losartana 50mg', quantity: 30, unitPrice: 2.0, totalPrice: 60.0 },
        { name: 'Atorvastatina 20mg', quantity: 30, unitPrice: 2.0, totalPrice: 60.0 }
      ],
      notes: 'Medicamentos para hipertensão e colesterol'
    }
  },

  /**
   * Submitted medication claim
   */
  submitted: {
    id: 'c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f',
    ...baseClaim,
    type: 'Medicamento',
    amount: 350.0,
    status: ClaimStatus.SUBMITTED,
    submittedAt: new Date('2023-06-25T14:20:00Z'),
    processedAt: new Date('2023-06-25T14:20:00Z'),
    metadata: {
      pharmacy: 'Drogaria São Paulo',
      purchaseDate: '2023-06-23T16:30:00Z',
      prescribingDoctor: 'Dr. Ricardo Nunes',
      medications: [
        { name: 'Insulina Lantus', quantity: 1, unitPrice: 250.0, totalPrice: 250.0 },
        { name: 'Agulhas para insulina', quantity: 100, unitPrice: 1.0, totalPrice: 100.0 }
      ],
      notes: 'Medicamentos para diabetes'
    }
  },

  /**
   * Under review medication claim
   */
  underReview: {
    id: 'd2e3f4a5-b6c7-8d9e-0f1a-2b3c4d5e6f7a',
    ...baseClaim,
    type: 'Medicamento',
    amount: 480.0,
    status: ClaimStatus.UNDER_REVIEW,
    submittedAt: new Date('2023-06-20T11:15:00Z'),
    processedAt: new Date('2023-06-22T09:30:00Z'),
    metadata: {
      pharmacy: 'Drogaria Moderna',
      purchaseDate: '2023-06-18T14:45:00Z',
      prescribingDoctor: 'Dra. Mariana Costa',
      medications: [
        { name: 'Humira 40mg', quantity: 2, unitPrice: 240.0, totalPrice: 480.0 }
      ],
      notes: 'Medicamento para artrite reumatoide',
      reviewNotes: 'Verificando cobertura para medicamento biológico'
    }
  },

  /**
   * Approved medication claim
   */
  approved: {
    id: 'e3f4a5b6-c7d8-9e0f-1a2b-3c4d5e6f7a8b',
    ...baseClaim,
    type: 'Medicamento',
    amount: 180.0,
    status: ClaimStatus.APPROVED,
    submittedAt: new Date('2023-06-10T16:45:00Z'),
    processedAt: new Date('2023-06-14T10:30:00Z'),
    metadata: {
      pharmacy: 'Farmácia São João',
      purchaseDate: '2023-06-08T15:20:00Z',
      prescribingDoctor: 'Dr. Carlos Mendes',
      medications: [
        { name: 'Pantoprazol 40mg', quantity: 30, unitPrice: 2.0, totalPrice: 60.0 },
        { name: 'Escitalopram 10mg', quantity: 30, unitPrice: 4.0, totalPrice: 120.0 }
      ],
      notes: 'Medicamentos para gastrite e ansiedade',
      approvedAmount: 180.0,
      approvedDate: '2023-06-14T10:30:00Z',
      approvedBy: 'Analista de Reembolso'
    }
  },

  /**
   * Denied medication claim
   */
  denied: {
    id: 'f4a5b6c7-d8e9-0f1a-2b3c-4d5e6f7a8b9c',
    ...baseClaim,
    type: 'Medicamento',
    amount: 95.0,
    status: ClaimStatus.DENIED,
    submittedAt: new Date('2023-06-05T09:30:00Z'),
    processedAt: new Date('2023-06-08T14:15:00Z'),
    metadata: {
      pharmacy: 'Drogaria Brasil',
      purchaseDate: '2023-06-03T11:45:00Z',
      prescribingDoctor: 'Dr. Roberto Almeida',
      medications: [
        { name: 'Minoxidil 5%', quantity: 1, unitPrice: 95.0, totalPrice: 95.0 }
      ],
      notes: 'Medicamento para queda de cabelo',
      denialReason: 'Medicamento cosmético não coberto pelo plano',
      deniedDate: '2023-06-08T14:15:00Z',
      deniedBy: 'Analista de Reembolso'
    }
  }
};

/**
 * Claim event fixtures for testing event processing
 */
export const claimEvents: Record<string, IClaimEvent> = {
  /**
   * Claim submitted event
   */
  claimSubmitted: {
    eventType: 'CLAIM_SUBMITTED',
    userId: '550e8400-e29b-41d4-a716-446655440000',
    claimId: '8a7b6c5d-4e3f-2a1b-0c9d-8e7f6a5b4c3d',
    claimType: 'Consulta Médica',
    amount: 250.0,
    timestamp: '2023-06-15T10:30:00Z',
    metadata: {
      providerName: 'Dr. Carlos Mendes',
      providerSpecialty: 'Ortopedia'
    }
  },

  /**
   * Claim approved event
   */
  claimApproved: {
    eventType: 'CLAIM_APPROVED',
    userId: '550e8400-e29b-41d4-a716-446655440000',
    claimId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    claimType: 'Consulta Médica',
    amount: 220.0,
    timestamp: '2023-06-08T15:20:00Z',
    metadata: {
      approvedAmount: 220.0,
      providerName: 'Dr. Roberto Almeida',
      providerSpecialty: 'Psiquiatria'
    }
  },

  /**
   * Claim denied event
   */
  claimDenied: {
    eventType: 'CLAIM_DENIED',
    userId: '550e8400-e29b-41d4-a716-446655440000',
    claimId: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
    claimType: 'Consulta Médica',
    amount: 300.0,
    timestamp: '2023-06-07T11:10:00Z',
    metadata: {
      denialReason: 'Consulta realizada fora do período de cobertura',
      providerName: 'Dra. Juliana Ferreira',
      providerSpecialty: 'Endocrinologia'
    }
  },

  /**
   * Claim additional info requested event
   */
  claimAdditionalInfoRequested: {
    eventType: 'CLAIM_ADDITIONAL_INFO_REQUESTED',
    userId: '550e8400-e29b-41d4-a716-446655440000',
    claimId: 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
    claimType: 'Consulta Médica',
    amount: 190.0,
    timestamp: '2023-06-22T10:15:00Z',
    metadata: {
      missingInfo: 'Receita médica com CRM legível',
      providerName: 'Dr. Fernando Santos',
      providerSpecialty: 'Oftalmologia'
    }
  },

  /**
   * Claim appealed event
   */
  claimAppealed: {
    eventType: 'CLAIM_APPEALED',
    userId: '550e8400-e29b-41d4-a716-446655440000',
    claimId: 'b4c5d6e7-f8a9-0b1c-2d3e-4f5a6b7c8d9e',
    claimType: 'Terapia',
    amount: 200.0,
    timestamp: '2023-06-05T09:15:00Z',
    metadata: {
      appealReason: 'Apresentação de laudo médico justificando necessidade terapêutica',
      providerName: 'Centro de Terapias Alternativas',
      therapyType: 'Acupuntura'
    }
  }
};

/**
 * Factory function to create a claim with custom properties
 * @param overrides - Properties to override in the base claim
 * @returns A claim object with the specified overrides
 */
export function createClaim(overrides: Partial<IClaim> = {}): IClaim {
  return {
    id: `claim-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    planId: 'a631a0d2-d2ac-4b3b-8a37-7cefc3d35cc1',
    type: 'Consulta Médica',
    amount: 150.0,
    status: ClaimStatus.SUBMITTED,
    submittedAt: new Date(),
    processedAt: new Date(),
    documents: [],
    metadata: {},
    ...overrides
  } as IClaim;
}

/**
 * Factory function to create a claim event with custom properties
 * @param overrides - Properties to override in the base claim event
 * @returns A claim event object with the specified overrides
 */
export function createClaimEvent(overrides: Partial<IClaimEvent> = {}): IClaimEvent {
  return {
    eventType: 'CLAIM_SUBMITTED',
    userId: '550e8400-e29b-41d4-a716-446655440000',
    claimId: `claim-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    claimType: 'Consulta Médica',
    amount: 150.0,
    timestamp: new Date().toISOString(),
    metadata: {},
    ...overrides
  };
}

/**
 * All claim fixtures grouped by type
 */
export const allClaims = {
  medicalConsultation: medicalConsultationClaims,
  medicalExam: medicalExamClaims,
  therapy: therapyClaims,
  hospitalization: hospitalizationClaims,
  medication: medicationClaims
};

/**
 * All claim fixtures grouped by status
 */
export const claimsByStatus = {
  [ClaimStatus.DRAFT]: [
    medicalConsultationClaims.draft,
    medicalExamClaims.draft,
    therapyClaims.draft,
    hospitalizationClaims.draft,
    medicationClaims.draft
  ],
  [ClaimStatus.SUBMITTED]: [
    medicalConsultationClaims.submitted,
    medicalExamClaims.submitted,
    therapyClaims.submitted,
    hospitalizationClaims.submitted,
    medicationClaims.submitted
  ],
  [ClaimStatus.UNDER_REVIEW]: [
    medicalConsultationClaims.underReview,
    medicalExamClaims.underReview,
    therapyClaims.underReview,
    hospitalizationClaims.underReview,
    medicationClaims.underReview
  ],
  [ClaimStatus.APPROVED]: [
    medicalConsultationClaims.approved,
    medicalExamClaims.approved,
    therapyClaims.approved,
    hospitalizationClaims.approved,
    medicationClaims.approved
  ],
  [ClaimStatus.DENIED]: [
    medicalConsultationClaims.denied,
    medicalExamClaims.denied,
    therapyClaims.denied,
    medicationClaims.denied
  ],
  [ClaimStatus.ADDITIONAL_INFO_REQUIRED]: [
    medicalConsultationClaims.additionalInfoRequired,
    hospitalizationClaims.additionalInfoRequired
  ],
  [ClaimStatus.APPEALED]: [
    therapyClaims.appealed
  ]
};

/**
 * Export default for easier importing
 */
export default {
  medicalConsultationClaims,
  medicalExamClaims,
  therapyClaims,
  hospitalizationClaims,
  medicationClaims,
  claimEvents,
  createClaim,
  createClaimEvent,
  allClaims,
  claimsByStatus
};