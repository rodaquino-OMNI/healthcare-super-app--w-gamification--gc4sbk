import { createHttpClient, createInternalServiceClient, createExternalApiClient } from '../http-client';

/**
 * Example of using the HTTP client in a health service
 */
async function healthServiceExample() {
  // Create a client for the FHIR API (external)
  const fhirClient = createExternalApiClient(
    'https://fhir.example.com/api/v1',
    { journey: 'health' }
  );

  // Create a client for internal service communication
  const gamificationClient = createInternalServiceClient(
    'gamification-engine',
    'http://gamification-engine:3000',
    { journey: 'health' }
  );

  try {
    // Fetch patient data from FHIR API
    const patientResponse = await fhirClient.get('/Patient/123');
    const patient = patientResponse.data;

    // Process health metrics
    const healthMetrics = {
      userId: patient.id,
      weight: 75,
      height: 180,
      bloodPressure: {
        systolic: 120,
        diastolic: 80,
      },
      timestamp: new Date().toISOString(),
    };

    // Save health metrics to internal database
    await fhirClient.post('/Observation', {
      resourceType: 'Observation',
      subject: {
        reference: `Patient/${patient.id}`,
      },
      code: {
        coding: [
          {
            system: 'http://loinc.org',
            code: '29463-7',
            display: 'Body weight',
          },
        ],
      },
      valueQuantity: {
        value: healthMetrics.weight,
        unit: 'kg',
        system: 'http://unitsofmeasure.org',
        code: 'kg',
      },
    });

    // Send event to gamification engine
    await gamificationClient.post('/events', {
      type: 'HEALTH_METRIC_RECORDED',
      userId: patient.id,
      data: {
        metricType: 'weight',
        value: healthMetrics.weight,
      },
      timestamp: healthMetrics.timestamp,
    });

    console.log('Health metrics recorded successfully');
  } catch (error) {
    console.error('Failed to process health metrics:', error.message);
    
    // The circuit breaker will automatically prevent further calls if the service is failing
    // The retry mechanism will have already attempted to retry transient failures
  }
}

/**
 * Example of using the HTTP client in a care service
 */
async function careServiceExample() {
  // Create a client for the telemedicine API (external)
  const telemedicineClient = createExternalApiClient(
    'https://telemedicine.example.com/api',
    { journey: 'care' }
  );

  // Create a client for internal service communication
  const notificationClient = createInternalServiceClient(
    'notification-service',
    'http://notification-service:3000',
    { journey: 'care' }
  );

  try {
    // Schedule a telemedicine appointment
    const appointmentResponse = await telemedicineClient.post('/appointments', {
      patientId: '123',
      providerId: '456',
      startTime: '2023-06-15T10:00:00Z',
      endTime: '2023-06-15T10:30:00Z',
      reason: 'Follow-up consultation',
    });

    const appointment = appointmentResponse.data;

    // Send notification to the user
    await notificationClient.post('/notifications', {
      userId: appointment.patientId,
      type: 'APPOINTMENT_SCHEDULED',
      title: 'Appointment Scheduled',
      body: `Your appointment with Dr. ${appointment.providerName} has been scheduled for ${new Date(appointment.startTime).toLocaleString()}.`,
      data: {
        appointmentId: appointment.id,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
      },
    });

    console.log('Appointment scheduled successfully');
  } catch (error) {
    console.error('Failed to schedule appointment:', error.message);
    
    // The circuit breaker will automatically prevent further calls if the service is failing
    // The retry mechanism will have already attempted to retry transient failures
  }
}

/**
 * Example of using the HTTP client in a plan service
 */
async function planServiceExample() {
  // Create a client for the insurance API (external)
  const insuranceClient = createExternalApiClient(
    'https://insurance.example.com/api',
    { journey: 'plan' }
  );

  // Create a client for internal service communication
  const gamificationClient = createInternalServiceClient(
    'gamification-engine',
    'http://gamification-engine:3000',
    { journey: 'plan' }
  );

  try {
    // Submit an insurance claim
    const claimResponse = await insuranceClient.post('/claims', {
      memberId: '123',
      policyNumber: 'POL-456',
      serviceDate: '2023-06-01',
      providerNpi: '1234567890',
      diagnosisCodes: ['J20.9'],
      procedureCodes: ['99213'],
      amount: 150.00,
    });

    const claim = claimResponse.data;

    // Send event to gamification engine
    await gamificationClient.post('/events', {
      type: 'CLAIM_SUBMITTED',
      userId: claim.memberId,
      data: {
        claimId: claim.id,
        amount: claim.amount,
      },
      timestamp: new Date().toISOString(),
    });

    console.log('Claim submitted successfully');
  } catch (error) {
    console.error('Failed to submit claim:', error.message);
    
    // The circuit breaker will automatically prevent further calls if the service is failing
    // The retry mechanism will have already attempted to retry transient failures
  }
}

// Export examples
export {
  healthServiceExample,
  careServiceExample,
  planServiceExample,
};