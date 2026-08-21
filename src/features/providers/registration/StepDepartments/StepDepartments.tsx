import WizardStepFields from '../WizardStepFields';

export default function StepDepartments({ isValid }: { isValid: boolean }) {
  return <WizardStepFields title="Departments" isValid={isValid} fields={['Outpatient', 'Inpatient', 'Laboratory', 'Pharmacy']} />;
}
