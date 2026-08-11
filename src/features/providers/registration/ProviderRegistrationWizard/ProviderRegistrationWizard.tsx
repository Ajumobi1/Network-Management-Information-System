import { useMemo, useState } from 'react';
import Badge from '../../../../components/ui/Badge';
import Button from '../../../../components/ui/Button';
import Card from '../../../../components/ui/Card';
import { useProviderRegistrationDraft } from '../../hooks';
import StepBankDetails from '../StepBankDetails';
import StepBasicInformation from '../StepBasicInformation';
import StepDepartments from '../StepDepartments';
import StepDocuments from '../StepDocuments';
import StepEquipment from '../StepEquipment';
import StepFacilityInformation from '../StepFacilityInformation';
import StepMedicalServices from '../StepMedicalServices';
import StepOwnership from '../StepOwnership';
import StepReview from '../StepReview';
import StepStaffStrength from '../StepStaffStrength';

const steps = [
  { label: 'Basic Information', component: StepBasicInformation },
  { label: 'Facility Information', component: StepFacilityInformation },
  { label: 'Ownership', component: StepOwnership },
  { label: 'Medical Services', component: StepMedicalServices },
  { label: 'Departments', component: StepDepartments },
  { label: 'Staff Strength', component: StepStaffStrength },
  { label: 'Equipment', component: StepEquipment },
  { label: 'Bank Details', component: StepBankDetails },
  { label: 'Documents', component: StepDocuments },
  { label: 'Review & Submit', component: StepReview },
];

export default function ProviderRegistrationWizard() {
  const { data: draft } = useProviderRegistrationDraft();
  const [activeStep, setActiveStep] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState('Not saved this session');
  const validationState = useMemo(() => steps.map((_, index) => Boolean(draft) && index <= activeStep), [activeStep, draft]);
  const progress = Math.round(((activeStep + 1) / steps.length) * 100);
  const ActiveStep = steps[activeStep].component;

  function saveDraft() {
    setHasUnsavedChanges(false);
    setLastSavedAt(new Date().toLocaleTimeString());
  }

  return (
    <Card>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Provider registration</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Multi-step onboarding wizard</h2>
          <p className="mt-2 text-sm text-slate-600">Step validation • Save draft • Resume draft • Unsaved changes warning</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {hasUnsavedChanges && <Badge variant="warning">Unsaved changes</Badge>}
          <Badge variant="info">{progress}% complete</Badge>
        </div>
      </div>
      <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-brand-blue transition-all" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-6 grid gap-3 lg:grid-cols-5">
        {steps.map((step, index) => (
          <button
            key={step.label}
            onClick={() => {
              setActiveStep(index);
              setHasUnsavedChanges(true);
            }}
            className={`rounded-3xl border px-4 py-3 text-left text-sm transition ${activeStep === index ? 'border-brand-blue bg-brand-blue text-white' : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
          >
            <span className="block text-xs font-semibold opacity-75">Step {index + 1}</span>
            <span className="font-semibold">{step.label}</span>
          </button>
        ))}
      </div>
      <div className="mt-6">
        <ActiveStep isValid={validationState[activeStep]} />
      </div>
      <div className="mt-6 flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <span>Draft sections loaded: {draft ? Object.keys(draft).length : 0} • Last saved: {lastSavedAt}</span>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" disabled={activeStep === 0} onClick={() => setActiveStep(step => Math.max(step - 1, 0))}>Previous</Button>
          <Button variant="outline" onClick={saveDraft}>Save draft</Button>
          <Button variant="secondary" onClick={() => setHasUnsavedChanges(false)}>Resume draft</Button>
          <Button disabled={activeStep === steps.length - 1} onClick={() => { setActiveStep(step => Math.min(step + 1, steps.length - 1)); setHasUnsavedChanges(true); }}>Next</Button>
        </div>
      </div>
    </Card>
  );
}
