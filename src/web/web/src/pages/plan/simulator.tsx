import React, { useState, useMemo } from 'react';
import { NextPage } from 'next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Import from @austa packages
import { Coverage, CoverageType } from '@austa/interfaces/plan/coverage.types';
import { useJourney } from '@austa/journey-context';
import { useCoverage } from '../../hooks/useCoverage';
import { useAuth } from '../../hooks/useAuth';

// Import design system components
import { Box, Stack, Text, Button } from '@design-system/primitives';
import { Card } from '@austa/design-system/components/Card';
import { Input } from '@austa/design-system/components/Input';
import { Select } from '@austa/design-system/components/Select';
import { DatePicker } from '@austa/design-system/components/DatePicker';
import { ProgressCircle } from '@austa/design-system/components/ProgressCircle';

// Import layout and shared components
import PlanLayout from '../../layouts/PlanLayout';
import LoadingIndicator from '../../components/shared/LoadingIndicator';
import ErrorState from '../../components/shared/ErrorState';

// Define the form schema using Zod
const simulatorFormSchema = z.object({
  procedureType: z.string({
    required_error: 'Selecione o tipo de procedimento',
  }),
  provider: z.string({
    required_error: 'Informe o prestador de serviço',
  }).min(3, 'Nome do prestador deve ter pelo menos 3 caracteres'),
  serviceDate: z.date({
    required_error: 'Selecione a data do serviço',
  }),
  estimatedCost: z.preprocess(
    (val) => (val === '' ? undefined : Number(String(val).replace(/[^0-9.]/g, ''))),
    z.number({
      required_error: 'Informe o valor estimado',
      invalid_type_error: 'Valor deve ser um número',
    }).positive('Valor deve ser maior que zero')
  ),
});

type SimulatorFormData = z.infer<typeof simulatorFormSchema>;

interface SimulationResult {
  totalCost: number;
  coverageAmount: number;
  outOfPocketCost: number;
  coveragePercentage: number;
  deductible: number;
  coPayment: number;
  coverage?: Coverage;
}

const PlanSimulator: NextPage = () => {
  const { journeyData } = useJourney();
  const { session } = useAuth();
  const planId = session?.planId || '';
  
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);

  // Fetch coverage data using React Query
  const { data: coverageData, isLoading, error, refetch } = useCoverage(planId);

  // Setup form with Zod validation
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SimulatorFormData>({
    resolver: zodResolver(simulatorFormSchema),
    defaultValues: {
      procedureType: '',
      provider: '',
      serviceDate: new Date(),
      estimatedCost: undefined,
    },
  });

  // Create coverage type options for select dropdown
  const coverageOptions = useMemo(() => {
    if (!coverageData) return [];
    
    return coverageData.map((coverage) => ({
      value: coverage.type,
      label: getCoverageTypeLabel(coverage.type),
    }));
  }, [coverageData]);

  // Helper function to get coverage type label
  function getCoverageTypeLabel(type: CoverageType): string {
    switch (type) {
      case CoverageType.CONSULTATION:
        return 'Consulta Médica';
      case CoverageType.EXAM:
        return 'Exame';
      case CoverageType.PROCEDURE:
        return 'Procedimento';
      case CoverageType.HOSPITALIZATION:
        return 'Internação';
      case CoverageType.EMERGENCY:
        return 'Emergência';
      case CoverageType.THERAPY:
        return 'Terapia';
      case CoverageType.MEDICATION:
        return 'Medicamento';
      default:
        return 'Outro';
    }
  }

  // Calculate simulation result based on form data and coverage
  const calculateSimulation = (data: SimulatorFormData) => {
    if (!coverageData) return;

    // Find the coverage that matches the selected procedure type
    const coverage = coverageData.find(c => c.type === data.procedureType);
    
    if (!coverage) return;
    
    const totalCost = data.estimatedCost;
    const deductible = coverage.deductible || 0;
    const coPayment = coverage.coPayment || 0;
    
    // Calculate coverage percentage (from 0 to 1)
    const coveragePercentage = (100 - coPayment) / 100;
    
    // Calculate covered amount and out-of-pocket cost
    let coverageAmount = 0;
    let outOfPocketCost = 0;
    
    if (totalCost <= deductible) {
      // If total cost is less than or equal to deductible, patient pays everything
      coverageAmount = 0;
      outOfPocketCost = totalCost;
    } else {
      // If total cost is greater than deductible
      const amountAfterDeductible = totalCost - deductible;
      coverageAmount = amountAfterDeductible * coveragePercentage;
      outOfPocketCost = deductible + (amountAfterDeductible * (coPayment / 100));
    }
    
    // Set the simulation result
    setSimulationResult({
      totalCost,
      coverageAmount,
      outOfPocketCost,
      coveragePercentage,
      deductible,
      coPayment,
      coverage,
    });
  };

  // Handle form submission
  const onSubmit = (data: SimulatorFormData) => {
    calculateSimulation(data);
  };

  // Format currency values
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Reset the form and simulation result
  const handleReset = () => {
    reset();
    setSimulationResult(null);
  };

  return (
    <PlanLayout>
      <Box padding="lg">
        <Text variant="h1" color="journeys.plan.primary" marginBottom="lg">
          Simulador de Custos
        </Text>
        <Text variant="body" color="neutral.gray700" marginBottom="xl">
          Simule os custos de procedimentos médicos com base na sua cobertura de plano de saúde.
        </Text>

        {isLoading ? (
          <LoadingIndicator />
        ) : error ? (
          <ErrorState 
            message="Não foi possível carregar os dados de cobertura."
            onRetry={() => refetch()}
          />
        ) : (
          <Stack direction="column" spacing="xl">
            <Card>
              <Box padding="lg">
                <Text variant="h2" color="journeys.plan.primary" marginBottom="md">
                  Dados do Procedimento
                </Text>
                <form onSubmit={handleSubmit(onSubmit)}>
                  <Stack direction="column" spacing="md">
                    <Controller
                      name="procedureType"
                      control={control}
                      render={({ field }) => (
                        <Select
                          label="Tipo de Procedimento"
                          options={coverageOptions}
                          error={errors.procedureType?.message}
                          {...field}
                        />
                      )}
                    />
                    
                    <Controller
                      name="provider"
                      control={control}
                      render={({ field }) => (
                        <Input
                          label="Prestador de Serviço"
                          placeholder="Nome do hospital, clínica ou médico"
                          error={errors.provider?.message}
                          {...field}
                        />
                      )}
                    />
                    
                    <Controller
                      name="serviceDate"
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          label="Data do Serviço"
                          error={errors.serviceDate?.message}
                          value={field.value}
                          onChange={field.onChange}
                          locale={ptBR}
                          maxDate={new Date()}
                        />
                      )}
                    />
                    
                    <Controller
                      name="estimatedCost"
                      control={control}
                      render={({ field: { onChange, value, ...field } }) => (
                        <Input
                          label="Valor Estimado"
                          placeholder="R$ 0,00"
                          type="text"
                          error={errors.estimatedCost?.message}
                          value={value !== undefined ? formatCurrency(Number(value)) : ''}
                          onChange={(e) => {
                            const rawValue = e.target.value.replace(/[^0-9]/g, '');
                            onChange(rawValue ? Number(rawValue) / 100 : '');
                          }}
                          {...field}
                        />
                      )}
                    />
                    
                    <Stack direction="row" spacing="md" justifyContent="flex-end">
                      <Button 
                        variant="secondary" 
                        type="button" 
                        onPress={handleReset}
                      >
                        Limpar
                      </Button>
                      <Button 
                        variant="primary" 
                        type="submit" 
                        isLoading={isSubmitting}
                        disabled={isSubmitting}
                      >
                        Simular
                      </Button>
                    </Stack>
                  </Stack>
                </form>
              </Box>
            </Card>

            {simulationResult && (
              <Card>
                <Box padding="lg">
                  <Text variant="h2" color="journeys.plan.primary" marginBottom="md">
                    Resultado da Simulação
                  </Text>
                  
                  <Stack direction="row" spacing="xl" alignItems="center" marginBottom="lg">
                    <Box width="120px" height="120px">
                      <ProgressCircle
                        progress={simulationResult.coverageAmount / simulationResult.totalCost}
                        size="lg"
                        color="journeys.plan.primary"
                        label={`${Math.round((simulationResult.coverageAmount / simulationResult.totalCost) * 100)}%`}
                      />
                    </Box>
                    
                    <Stack direction="column" spacing="sm" flex={1}>
                      <Text variant="h3" color="journeys.plan.primary">
                        Cobertura do Plano
                      </Text>
                      <Text variant="body">
                        Seu plano cobre {formatCurrency(simulationResult.coverageAmount)} do valor total de {formatCurrency(simulationResult.totalCost)}.
                      </Text>
                      <Text variant="bodyBold" color="neutral.gray800">
                        Você pagará: {formatCurrency(simulationResult.outOfPocketCost)}
                      </Text>
                    </Stack>
                  </Stack>
                  
                  <Box 
                    padding="md" 
                    backgroundColor="neutral.gray100" 
                    borderRadius="md"
                    marginBottom="md"
                  >
                    <Stack direction="column" spacing="sm">
                      <Text variant="bodyBold">Detalhes da Cobertura:</Text>
                      <Stack direction="row" justifyContent="space-between">
                        <Text variant="body">Tipo de Procedimento:</Text>
                        <Text variant="bodyBold">{getCoverageTypeLabel(simulationResult.coverage?.type || CoverageType.CONSULTATION)}</Text>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Text variant="body">Franquia:</Text>
                        <Text variant="bodyBold">{formatCurrency(simulationResult.deductible)}</Text>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Text variant="body">Coparticipação:</Text>
                        <Text variant="bodyBold">{simulationResult.coPayment}%</Text>
                      </Stack>
                      {simulationResult.coverage?.limitations && (
                        <Text variant="body" color="neutral.gray600" fontSize="sm">
                          Limitações: {simulationResult.coverage.limitations}
                        </Text>
                      )}
                    </Stack>
                  </Box>
                  
                  <Box 
                    padding="md" 
                    backgroundColor="neutral.gray100" 
                    borderRadius="md"
                  >
                    <Stack direction="column" spacing="sm">
                      <Text variant="bodyBold">Detalhes do Cálculo:</Text>
                      <Stack direction="row" justifyContent="space-between">
                        <Text variant="body">Valor Total:</Text>
                        <Text variant="bodyBold">{formatCurrency(simulationResult.totalCost)}</Text>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Text variant="body">Valor da Franquia:</Text>
                        <Text variant="bodyBold">{formatCurrency(Math.min(simulationResult.deductible, simulationResult.totalCost))}</Text>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Text variant="body">Valor após Franquia:</Text>
                        <Text variant="bodyBold">{formatCurrency(Math.max(0, simulationResult.totalCost - simulationResult.deductible))}</Text>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Text variant="body">Valor da Coparticipação:</Text>
                        <Text variant="bodyBold">
                          {formatCurrency(Math.max(0, simulationResult.totalCost - simulationResult.deductible) * (simulationResult.coPayment / 100))}
                        </Text>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Text variant="body">Valor Coberto pelo Plano:</Text>
                        <Text variant="bodyBold" color="journeys.plan.primary">{formatCurrency(simulationResult.coverageAmount)}</Text>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Text variant="bodyBold">Seu Desembolso:</Text>
                        <Text variant="bodyBold" color="journeys.plan.accent">{formatCurrency(simulationResult.outOfPocketCost)}</Text>
                      </Stack>
                    </Stack>
                  </Box>
                </Box>
              </Card>
            )}
          </Stack>
        )}
      </Box>
    </PlanLayout>
  );
};

export default PlanSimulator;