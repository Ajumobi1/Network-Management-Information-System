import WizardStepFields from '../WizardStepFields';

export default function StepBasicInformation({ isValid }: { isValid: boolean }) {
  return <WizardStepFields title="Basic Information" isValid={isValid} fields={['Provider name', 'Provider code', 'Email', 'Phone']} />;
}
