import WizardStepFields from '../WizardStepFields';

export default function StepDocuments({ isValid }: { isValid: boolean }) {
  return <WizardStepFields title="Documents" isValid={isValid} fields={['Facility license', 'Practice license', 'CAC certificate', 'Tax clearance']} />;
}
