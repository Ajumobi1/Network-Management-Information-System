import WizardStepFields from '../WizardStepFields';

export default function StepMedicalServices({ isValid }: { isValid: boolean }) {
  return <WizardStepFields title="Medical Services" isValid={isValid} fields={['Primary services', 'Emergency care', 'Diagnostics', 'Specialist services']} />;
}
