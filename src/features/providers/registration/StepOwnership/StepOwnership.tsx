import WizardStepFields from '../WizardStepFields';

export default function StepOwnership({ isValid }: { isValid: boolean }) {
  return <WizardStepFields title="Ownership" isValid={isValid} fields={['Ownership type', 'Registration number', 'Tax ID', 'Authorizing officer']} />;
}
