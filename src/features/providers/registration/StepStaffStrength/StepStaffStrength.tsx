import WizardStepFields from '../WizardStepFields';

export default function StepStaffStrength({ isValid }: { isValid: boolean }) {
  return <WizardStepFields title="Staff Strength" isValid={isValid} fields={['Doctors', 'Nurses', 'Administrative staff', 'Specialists']} />;
}
