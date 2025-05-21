import { ExternalResponseFormatError } from '@austa/errors/categories';

/**
 * Validates a FHIR resource to ensure it conforms to the expected structure.
 * 
 * @param resource - The FHIR resource to validate
 * @param expectedType - The expected resource type (e.g., 'Patient', 'Observation')
 * @throws {ExternalResponseFormatError} If validation fails
 */
export function validateFhirResource(resource: any, expectedType: string): void {
  // Check if resource exists
  if (!resource) {
    throw new ExternalResponseFormatError(
      `Missing FHIR resource of type ${expectedType}`,
      {
        errorCode: 'HEALTH_010',
        expectedType
      }
    );
  }

  // Check if resource has the correct type
  if (!resource.resourceType || resource.resourceType !== expectedType) {
    throw new ExternalResponseFormatError(
      `Invalid FHIR resource type: expected ${expectedType}, got ${resource.resourceType || 'undefined'}`,
      {
        errorCode: 'HEALTH_011',
        expectedType,
        actualType: resource.resourceType || 'undefined',
        resource
      }
    );
  }

  // Validate required fields based on resource type
  switch (expectedType) {
    case 'Patient':
      validatePatientResource(resource);
      break;
    case 'Observation':
      validateObservationResource(resource);
      break;
    case 'Condition':
      validateConditionResource(resource);
      break;
    default:
      // For other resource types, just validate that it has an ID
      if (!resource.id) {
        throw new ExternalResponseFormatError(
          `FHIR ${expectedType} resource is missing required 'id' field`,
          {
            errorCode: 'HEALTH_012',
            resourceType: expectedType,
            resource
          }
        );
      }
  }
}

/**
 * Validates a FHIR Patient resource.
 * 
 * @param patient - The Patient resource to validate
 * @throws {ExternalResponseFormatError} If validation fails
 */
function validatePatientResource(patient: any): void {
  // Check for required fields
  if (!patient.id) {
    throw new ExternalResponseFormatError(
      "FHIR Patient resource is missing required 'id' field",
      {
        errorCode: 'HEALTH_013',
        resource: patient
      }
    );
  }

  // Validate name if present
  if (patient.name && Array.isArray(patient.name) && patient.name.length > 0) {
    const name = patient.name[0];
    if (typeof name !== 'object') {
      throw new ExternalResponseFormatError(
        "FHIR Patient resource has invalid 'name' field format",
        {
          errorCode: 'HEALTH_014',
          name,
          resource: patient
        }
      );
    }
  }

  // Validate telecom if present
  if (patient.telecom && !Array.isArray(patient.telecom)) {
    throw new ExternalResponseFormatError(
      "FHIR Patient resource has invalid 'telecom' field format",
      {
        errorCode: 'HEALTH_015',
        telecom: patient.telecom,
        resource: patient
      }
    );
  }

  // Validate address if present
  if (patient.address && !Array.isArray(patient.address)) {
    throw new ExternalResponseFormatError(
      "FHIR Patient resource has invalid 'address' field format",
      {
        errorCode: 'HEALTH_016',
        address: patient.address,
        resource: patient
      }
    );
  }
}

/**
 * Validates a FHIR Observation resource.
 * 
 * @param observation - The Observation resource to validate
 * @throws {ExternalResponseFormatError} If validation fails
 */
function validateObservationResource(observation: any): void {
  // Check for required fields
  if (!observation.id) {
    throw new ExternalResponseFormatError(
      "FHIR Observation resource is missing required 'id' field",
      {
        errorCode: 'HEALTH_017',
        resource: observation
      }
    );
  }

  // Check for subject (patient reference)
  if (!observation.subject || !observation.subject.reference) {
    throw new ExternalResponseFormatError(
      "FHIR Observation resource is missing required 'subject' field with patient reference",
      {
        errorCode: 'HEALTH_018',
        resource: observation
      }
    );
  }

  // Check for code (what was measured)
  if (!observation.code || !observation.code.coding || !Array.isArray(observation.code.coding) || observation.code.coding.length === 0) {
    throw new ExternalResponseFormatError(
      "FHIR Observation resource is missing required 'code' field with coding",
      {
        errorCode: 'HEALTH_019',
        resource: observation
      }
    );
  }

  // Check for either valueQuantity, valueString, or component for vital signs panel
  if (!observation.valueQuantity && !observation.valueString && !observation.component) {
    throw new ExternalResponseFormatError(
      "FHIR Observation resource is missing value representation (valueQuantity, valueString, or component)",
      {
        errorCode: 'HEALTH_020',
        resource: observation
      }
    );
  }

  // If valueQuantity is present, validate its structure
  if (observation.valueQuantity && (typeof observation.valueQuantity !== 'object' || observation.valueQuantity.value === undefined)) {
    throw new ExternalResponseFormatError(
      "FHIR Observation resource has invalid 'valueQuantity' field format",
      {
        errorCode: 'HEALTH_021',
        valueQuantity: observation.valueQuantity,
        resource: observation
      }
    );
  }

  // If component is present (for blood pressure, etc.), validate its structure
  if (observation.component) {
    if (!Array.isArray(observation.component) || observation.component.length === 0) {
      throw new ExternalResponseFormatError(
        "FHIR Observation resource has invalid 'component' field format",
        {
          errorCode: 'HEALTH_022',
          component: observation.component,
          resource: observation
        }
      );
    }

    // Validate each component has code and value
    observation.component.forEach((component: any, index: number) => {
      if (!component.code || !component.code.coding || !Array.isArray(component.code.coding) || component.code.coding.length === 0) {
        throw new ExternalResponseFormatError(
          `FHIR Observation resource has invalid 'component[${index}].code' field format`,
          {
            errorCode: 'HEALTH_023',
            component,
            resource: observation
          }
        );
      }

      if (!component.valueQuantity && !component.valueString) {
        throw new ExternalResponseFormatError(
          `FHIR Observation resource has missing value in 'component[${index}]'`,
          {
            errorCode: 'HEALTH_024',
            component,
            resource: observation
          }
        );
      }
    });
  }
}

/**
 * Validates a FHIR Condition resource.
 * 
 * @param condition - The Condition resource to validate
 * @throws {ExternalResponseFormatError} If validation fails
 */
function validateConditionResource(condition: any): void {
  // Check for required fields
  if (!condition.id) {
    throw new ExternalResponseFormatError(
      "FHIR Condition resource is missing required 'id' field",
      {
        errorCode: 'HEALTH_025',
        resource: condition
      }
    );
  }

  // Check for subject (patient reference)
  if (!condition.subject || !condition.subject.reference) {
    throw new ExternalResponseFormatError(
      "FHIR Condition resource is missing required 'subject' field with patient reference",
      {
        errorCode: 'HEALTH_026',
        resource: condition
      }
    );
  }

  // Check for code (what condition)
  if (!condition.code || !condition.code.coding || !Array.isArray(condition.code.coding) || condition.code.coding.length === 0) {
    throw new ExternalResponseFormatError(
      "FHIR Condition resource is missing required 'code' field with coding",
      {
        errorCode: 'HEALTH_027',
        resource: condition
      }
    );
  }

  // Check for clinicalStatus or verificationStatus
  if ((!condition.clinicalStatus || !condition.clinicalStatus.coding) && 
      (!condition.verificationStatus || !condition.verificationStatus.coding)) {
    throw new ExternalResponseFormatError(
      "FHIR Condition resource is missing both 'clinicalStatus' and 'verificationStatus' fields",
      {
        errorCode: 'HEALTH_028',
        resource: condition
      }
    );
  }
}