import WizardStepFields from '../WizardStepFields';

export default function StepReview({ isValid }: { isValid: boolean }) {
  return <WizardStepFields title="Review & Submit" isValid={isValid} fields={['Completeness check', 'Compliance check', 'Draft status', 'Submission readiness']} />;
}
