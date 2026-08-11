import WizardStepFields from '../WizardStepFields';

export default function StepFacilityInformation({ isValid }: { isValid: boolean }) {
  return <WizardStepFields title="Facility Information" isValid={isValid} fields={['Facility type', 'Address', 'State', 'LGA']} />;
}
