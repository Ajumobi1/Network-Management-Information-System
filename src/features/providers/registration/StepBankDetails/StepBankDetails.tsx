import WizardStepFields from '../WizardStepFields';

export default function StepBankDetails({ isValid }: { isValid: boolean }) {
  return <WizardStepFields title="Bank Details" isValid={isValid} fields={['Bank name', 'Account name', 'Account number', 'Payment reference']} />;
}
