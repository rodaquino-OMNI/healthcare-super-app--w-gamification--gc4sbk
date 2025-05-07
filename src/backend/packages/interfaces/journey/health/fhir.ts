/**
 * TypeScript interfaces for FHIR resources used in the Health Service.
 * These interfaces provide type safety for FHIR API interactions and data mapping.
 */

/**
 * Base interface for all FHIR resources
 */
export interface FHIRResource {
  resourceType: string;
  id: string;
  meta?: {
    versionId?: string;
    lastUpdated?: string;
  };
}

/**
 * Interface for FHIR Patient resource
 */
export interface FHIRPatientResource extends FHIRResource {
  resourceType: 'Patient';
  name?: Array<{
    use?: string;
    family?: string;
    given?: string[];
    prefix?: string[];
    suffix?: string[];
    text?: string;
  }>;
  telecom?: Array<{
    system?: 'phone' | 'email' | 'fax' | 'pager' | 'url' | 'sms' | 'other';
    value?: string;
    use?: 'home' | 'work' | 'temp' | 'old' | 'mobile';
    rank?: number;
    period?: {
      start?: string;
      end?: string;
    };
  }>;
  gender?: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: string;
  address?: Array<{
    use?: 'home' | 'work' | 'temp' | 'old' | 'billing';
    type?: 'postal' | 'physical' | 'both';
    text?: string;
    line?: string[];
    city?: string;
    district?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    period?: {
      start?: string;
      end?: string;
    };
  }>;
  maritalStatus?: {
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  };
  identifier?: Array<{
    use?: string;
    type?: {
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
      text?: string;
    };
    system?: string;
    value?: string;
    period?: {
      start?: string;
      end?: string;
    };
    assigner?: {
      reference?: string;
      display?: string;
    };
  }>;
  communication?: Array<{
    language?: {
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
      text?: string;
    };
    preferred?: boolean;
  }>;
  active?: boolean;
}

/**
 * Interface for FHIR Condition resource
 */
export interface FHIRConditionResource extends FHIRResource {
  resourceType: 'Condition';
  clinicalStatus?: {
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  };
  verificationStatus?: {
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  };
  category?: Array<{
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  }>;
  severity?: {
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  };
  code?: {
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  };
  bodySite?: Array<{
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  }>;
  subject: {
    reference: string;
    display?: string;
  };
  encounter?: {
    reference: string;
    display?: string;
  };
  onsetDateTime?: string;
  onsetAge?: {
    value: number;
    unit: string;
    system: string;
    code: string;
  };
  onsetPeriod?: {
    start?: string;
    end?: string;
  };
  onsetRange?: {
    low?: {
      value: number;
      unit: string;
      system: string;
      code: string;
    };
    high?: {
      value: number;
      unit: string;
      system: string;
      code: string;
    };
  };
  onsetString?: string;
  abatementDateTime?: string;
  abatementAge?: {
    value: number;
    unit: string;
    system: string;
    code: string;
  };
  abatementPeriod?: {
    start?: string;
    end?: string;
  };
  abatementRange?: {
    low?: {
      value: number;
      unit: string;
      system: string;
      code: string;
    };
    high?: {
      value: number;
      unit: string;
      system: string;
      code: string;
    };
  };
  abatementString?: string;
  recordedDate?: string;
  recorder?: {
    reference: string;
    display?: string;
  };
  asserter?: {
    reference: string;
    display?: string;
  };
  stage?: Array<{
    summary?: {
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
      text?: string;
    };
    assessment?: Array<{
      reference: string;
      display?: string;
    }>;
    type?: {
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
      text?: string;
    };
  }>;
  evidence?: Array<{
    code?: Array<{
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
      text?: string;
    }>;
    detail?: Array<{
      reference: string;
      display?: string;
    }>;
  }>;
  note?: Array<{
    authorString?: string;
    authorReference?: {
      reference: string;
      display?: string;
    };
    time?: string;
    text: string;
  }>;
  supportingInfo?: Array<{
    reference: string;
    display?: string;
  }>;
}

/**
 * Interface for FHIR search response
 */
export interface FHIRSearchResponse {
  resourceType: 'Bundle';
  type: 'searchset';
  total?: number;
  link?: Array<{
    relation: string;
    url: string;
  }>;
  entry?: Array<{
    fullUrl?: string;
    resource: FHIRResource;
    search?: {
      mode?: 'match' | 'include' | 'outcome';
      score?: number;
    };
  }>;
}

/**
 * Interface for FHIR error response
 */
export interface FHIRErrorResponse {
  resourceType: 'OperationOutcome';
  issue: Array<{
    severity: 'fatal' | 'error' | 'warning' | 'information';
    code: string;
    details?: {
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
      text?: string;
    };
    diagnostics?: string;
    location?: string[];
    expression?: string[];
  }>;
}

/**
 * Interface for FHIR API configuration
 */
export interface FHIRApiConfig {
  baseUrl: string;
  authType: 'oauth2' | 'basic' | 'none';
  username?: string;
  password?: string;
  accessToken?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}