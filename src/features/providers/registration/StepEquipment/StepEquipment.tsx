import WizardStepFields from '../WizardStepFields';

export default function StepEquipment({ isValid }: { isValid: boolean }) {
  return <WizardStepFields title="Equipment" isValid={isValid} fields={['X-Ray', 'Ultrasound', 'Ambulance', 'Cold-chain storage']} />;
}
