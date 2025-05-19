import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

// Updated imports using standardized path aliases and packages
import { Button, Input } from '@austa/design-system';
import { useAuth } from '@austa/journey-context';
import { AuthLayout } from '@web/layouts';
import { API_CONFIG } from '@shared/constants/api';
import { AuthError } from '@austa/interfaces/auth';

/**
 * MFA (Multi-Factor Authentication) page component
 * Allows users to verify their identity by entering a verification code
 * sent to their registered device to complete the login process.
 */
const MFAPage = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const auth = useAuth();
  
  const [verificationCode, setVerificationCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

  /**
   * Handles verification code input changes
   */
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVerificationCode(e.target.value);
    
    // Clear error when user types
    if (error) {
      setError(null);
    }
  };

  /**
   * Handles verification code submission
   */
  const handleSubmit = async () => {
    if (!verificationCode.trim()) {
      setError({
        code: 'VALIDATION_ERROR',
        message: t('errors.required'),
        field: 'verificationCode'
      });
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // In a real implementation, this would call the auth service's MFA verification endpoint
      // For example: await auth.verifyMFA(verificationCode);
      
      // Simulating API call for demonstration purposes
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate to home page after successful verification
      router.push('/');
    } catch (err: any) {
      // Properly handle error with AuthError type from @austa/interfaces
      setError({
        code: err?.response?.data?.code || 'UNKNOWN_ERROR',
        message: err?.response?.data?.message || t('errors.unknown_error'),
        field: 'verificationCode'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handles resending the verification code
   */
  const handleResendCode = async () => {
    try {
      // In a real implementation, this would call the auth service to resend the MFA code
      // For example: await auth.resendMFA();
      
      // Simulating API call for demonstration purposes
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Could display a success message here
    } catch (err: any) {
      // Properly handle error with AuthError type
      console.error('Failed to resend verification code', err);
    }
  };

  return (
    <AuthLayout>
      <div>
        <h2>{t('auth.mfa.title')}</h2>
        <p>{t('auth.mfa.enterCode')}</p>
        
        <Input
          type="text"
          value={verificationCode}
          onChange={handleCodeChange}
          placeholder="000000"
          aria-label={t('auth.mfa.enterCode')}
          journey="plan" // Using plan journey colors for this screen
          error={error?.message}
        />
        
        <div style={{ marginTop: '24px' }}>
          <Button 
            onPress={handleSubmit}
            disabled={isSubmitting} 
            loading={isSubmitting}
            journey="plan"
          >
            {t('auth.mfa.verifyCode')}
          </Button>
        </div>
        
        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <Button 
            variant="tertiary" 
            onPress={handleResendCode}
            journey="plan"
          >
            {t('auth.mfa.resendCode')}
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
};

export default MFAPage;