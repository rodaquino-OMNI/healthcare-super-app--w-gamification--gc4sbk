import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Import from @austa/design-system instead of direct paths
import { Input } from '@austa/design-system/components/Input';
import { Select } from '@austa/design-system/components/Select';
import { Button } from '@austa/design-system/components/Button';
import { Card } from '@austa/design-system/components/Card';

// Import from @austa/interfaces/plan
import { ProcedureType } from '@austa/interfaces/plan';

// Import from @austa/journey-context
import { useJourney } from '@austa/journey-context/hooks';

// Define validation schema using Zod
const costSimulatorSchema = z.object({
  procedureType: z.string().min(1, { message: 'Selecione um tipo de procedimento' }),
  provider: z.string().min(1, { message: 'Digite o nome do profissional ou clínica' }),
});

// Infer TypeScript type from the schema
type CostSimulatorFormData = z.infer<typeof costSimulatorSchema>;

/**
 * A screen component that allows users to simulate healthcare costs 
 * based on insurance coverage within the Plan journey.
 */
export const CostSimulatorScreen: React.FC = () => {
  // Use journey context for journey-specific state and theming
  const { currentJourney } = useJourney();
  
  // Initialize form with React Hook Form and Zod validation
  const { 
    control, 
    handleSubmit, 
    formState: { errors },
    watch,
  } = useForm<CostSimulatorFormData>({
    resolver: zodResolver(costSimulatorSchema),
    defaultValues: {
      procedureType: '',
      provider: '',
    },
  });
  
  // State for the estimated cost result
  const [estimatedCost, setEstimatedCost] = React.useState<number | null>(null);
  
  // Watch form values for validation
  const procedureType = watch('procedureType');
  const provider = watch('provider');
  
  // Procedure type options for the dropdown
  const procedureOptions = [
    { label: 'Consulta médica', value: 'consultation' },
    { label: 'Exame laboratorial', value: 'labTest' },
    { label: 'Exame de imagem', value: 'imaging' },
    { label: 'Cirurgia', value: 'surgery' },
    { label: 'Fisioterapia', value: 'physicalTherapy' },
  ];
  
  /**
   * Simulates the cost based on procedure type and provider.
   * In a real implementation, this would call an API to get accurate estimates.
   */
  const onSubmit = (data: CostSimulatorFormData) => {
    // This is a simplified mock implementation
    // In a real app, we would call the backend API to calculate the actual cost
    let baseCost = 0;
    
    switch (data.procedureType) {
      case 'consultation':
        baseCost = 150;
        break;
      case 'labTest':
        baseCost = 200;
        break;
      case 'imaging':
        baseCost = 500;
        break;
      case 'surgery':
        baseCost = 3000;
        break;
      case 'physicalTherapy':
        baseCost = 100;
        break;
      default:
        baseCost = 0;
    }
    
    // Mock coverage calculation (80% coverage)
    const coverage = 0.8;
    const outOfPocket = baseCost * (1 - coverage);
    
    // Round to 2 decimal places
    setEstimatedCost(Math.round(outOfPocket * 100) / 100);
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Simulador de Custos</Text>
      <Text style={styles.subtitle}>Simule quanto custará seu procedimento com base na sua cobertura</Text>
      
      <Card journey="plan">
        <View style={styles.formGroup}>
          <Controller
            control={control}
            name="procedureType"
            render={({ field: { onChange, value } }) => (
              <Select
                label="Tipo de Procedimento"
                options={procedureOptions}
                value={value}
                onChange={onChange}
                journey="plan"
                error={errors.procedureType?.message}
              />
            )}
          />
        </View>
        
        <View style={styles.formGroup}>
          <Controller
            control={control}
            name="provider"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Nome do Profissional ou Clínica"
                value={value}
                onChangeText={onChange}
                placeholder="Digite o nome do profissional ou clínica"
                journey="plan"
                error={errors.provider?.message}
              />
            )}
          />
        </View>
        
        <Button 
          onPress={handleSubmit(onSubmit)}
          journey="plan"
          disabled={!procedureType || !provider}
        >
          Simular Custo
        </Button>
        
        {estimatedCost !== null && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>Custo Estimado</Text>
            <Text style={styles.resultValue}>
              R$ {estimatedCost.toFixed(2)}
            </Text>
            <Text style={styles.resultDescription}>
              Este é o valor estimado que você pagará após a cobertura do seu plano.
            </Text>
            <Text style={styles.resultCoverage}>
              Cobertura aplicada: 80%
            </Text>
          </View>
        )}
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    color: '#666',
  },
  formGroup: {
    marginBottom: 16,
  },
  resultContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  resultValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3A86FF',
    marginBottom: 8,
  },
  resultDescription: {
    textAlign: 'center',
    marginBottom: 8,
  },
  resultCoverage: {
    fontSize: 14,
    color: '#757575',
  },
});