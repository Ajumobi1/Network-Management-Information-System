import { useEffect, useMemo, useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { ErrorState } from '../../components/ui/FeedbackStates';
import PageHeader from '../../components/ui/PageHeader';
import { useAdminUpsertInspectionTemplate, useInspectionTemplate, useInspectionTemplateOptions } from '../../hooks/inspections/structuredInspectionHooks';
import { InspectionTemplate, InspectionTemplateItem, InspectionTemplateSection } from '../../repositories/inspections/structuredInspectionRepository';

type ProfileField = { key: string; label: string; type: string; required: boolean; sort_order: number; options?: string[]; pair_with?: string };
type EligibilityRow = { criterion_code: string; criterion_label: string; required: boolean; sort_order: number };
type TemplateDraft = InspectionTemplate & { template: InspectionTemplate['template'] & { facility_type_code?: string | null; facility_profile_fields?: ProfileField[] } };

const blankTemplate = (option: { facility_type: { code: string; name: string; description?: string | null; active: boolean; sort_order: number } }): TemplateDraft => ({
  facility_type: option.facility_type,
  template: {
    id: '',
    code: `${option.facility_type.code}-inspection`,
    name: `${option.facility_type.name} Inspection Template`,
    version: '1.0',
    passing_threshold: 75,
    conditional_threshold: 60,
    facility_type_code: option.facility_type.code,
    facility_profile_fields: [],
  },
  sections: [],
  eligibility: [],
  items: [],
});

function TextField({ label, value, onChange, type = 'text' }: { label: string; value: string | number; onChange: (value: string) => void; type?: string }) {
  return <label className="block space-y-1"><span className="nmis-label">{label}</span><input type={type} value={value} onChange={event => onChange(event.target.value)} className="nmis-control" /></label>;
}

function SectionRow({ section, onChange, onRemove }: { section: InspectionTemplateSection; onChange: (next: InspectionTemplateSection) => void; onRemove: () => void }) {
  return <div className="grid gap-3 rounded-2xl border border-brand-divider bg-brand-surface p-4 md:grid-cols-[100px_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end"><TextField label="Code" value={section.section_code} onChange={value => onChange({ ...section, section_code: value })} /><TextField label="Section label" value={section.section_label} onChange={value => onChange({ ...section, section_label: value })} /><TextField label="Description" value={section.description || ''} onChange={value => onChange({ ...section, description: value })} /><button type="button" onClick={onRemove} className="rounded-control p-2 text-status-danger hover:bg-status-dangerSoft" aria-label="Remove section"><Trash2 size={16} /></button></div>;
}

function ItemRow({ item, onChange, onRemove }: { item: InspectionTemplateItem; onChange: (next: InspectionTemplateItem) => void; onRemove: () => void }) {
  return <div className="space-y-3 rounded-2xl border border-brand-divider bg-brand-surface p-4"><div className="grid gap-3 md:grid-cols-[90px_minmax(0,1fr)_120px_120px_auto] md:items-end"><TextField label="Section" value={item.section_code} onChange={value => onChange({ ...item, section_code: value })} /><TextField label="Item label" value={item.item_label} onChange={value => onChange({ ...item, item_label: value })} /><TextField label="Max points" value={item.max_points} type="number" onChange={value => onChange({ ...item, max_points: Number(value) })} /><TextField label="Min required" value={item.min_required ?? ''} type="number" onChange={value => onChange({ ...item, min_required: value === '' ? null : Number(value) })} /><button type="button" onClick={onRemove} className="rounded-control p-2 text-status-danger hover:bg-status-dangerSoft" aria-label="Remove item"><Trash2 size={16} /></button></div><div className="grid gap-3 md:grid-cols-4"><label className="block space-y-1"><span className="nmis-label">Item code</span><input value={item.item_code} onChange={event => onChange({ ...item, item_code: event.target.value })} className="nmis-control" /></label><label className="block space-y-1"><span className="nmis-label">Response type</span><select value={item.response_type} onChange={event => onChange({ ...item, response_type: event.target.value as InspectionTemplateItem['response_type'] })} className="nmis-control"><option value="boolean">Yes / No</option><option value="number">Number</option></select></label><label className="block space-y-1"><span className="nmis-label">Scoring method</span><select value={item.scoring_method} onChange={event => onChange({ ...item, scoring_method: event.target.value as InspectionTemplateItem['scoring_method'], manual_score_allowed: event.target.value === 'manual_only' })} className="nmis-control"><option value="yes_no_with_points">Yes / No with points</option><option value="headcount_formula">Headcount formula</option><option value="manual_only">Manual only</option></select></label><label className="flex items-center gap-2 self-end pb-2 text-sm font-bold text-brand-secondary"><input type="checkbox" checked={item.scored_when_no} onChange={event => onChange({ ...item, scored_when_no: event.target.checked })} /> Include NO in denominator</label></div></div>;
}

export default function InspectionTemplateAdminPage() {
  const optionsQuery = useInspectionTemplateOptions();
  const [facilityTypeCode, setFacilityTypeCode] = useState('');
  const selectedOption = useMemo(() => optionsQuery.data?.find(option => option.facility_type.code === facilityTypeCode), [optionsQuery.data, facilityTypeCode]);
  const templateCode = selectedOption?.configured && selectedOption.template ? selectedOption.template.code : 'pharmacy-accreditation';
  const templateQuery = useInspectionTemplate(templateCode, Boolean(selectedOption?.configured));
  const saveMutation = useAdminUpsertInspectionTemplate();
  const [draft, setDraft] = useState<TemplateDraft | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!facilityTypeCode && optionsQuery.data?.length) setFacilityTypeCode(optionsQuery.data[0].facility_type.code);
  }, [facilityTypeCode, optionsQuery.data]);

  useEffect(() => {
    if (!selectedOption) return;
    if (selectedOption.configured && templateQuery.data) {
      setDraft(templateQuery.data as TemplateDraft);
    } else if (!selectedOption.configured) {
      setDraft(blankTemplate(selectedOption));
    }
    setMessage('');
  }, [selectedOption, templateQuery.data]);

  const updateDraft = (updater: (current: TemplateDraft) => TemplateDraft) => setDraft(current => current ? updater(current) : current);
  const addSection = () => updateDraft(current => ({ ...current, sections: [...current.sections, { section_code: `S${current.sections.length + 1}`, section_label: 'New section', description: '', sort_order: current.sections.length + 1 }] }));
  const addItem = () => updateDraft(current => ({ ...current, items: [...current.items, { section_code: current.sections[0]?.section_code || 'A', item_code: `ITEM${current.items.length + 1}`, item_label: 'New inspection item', response_type: 'boolean', min_required: null, max_points: 1, scored_when_no: true, manual_score_allowed: false, scoring_method: 'yes_no_with_points', sort_order: current.items.length + 1 }] }));
  const addEligibility = () => updateDraft(current => ({ ...current, eligibility: [...current.eligibility, { criterion_code: `CRITERION_${current.eligibility.length + 1}`, criterion_label: 'New eligibility criterion', required: true, sort_order: current.eligibility.length + 1 }] }));
  const addProfileField = () => updateDraft(current => ({ ...current, template: { ...current.template, facility_profile_fields: [...(current.template.facility_profile_fields || []), { key: `field_${(current.template.facility_profile_fields || []).length + 1}`, label: 'New facility field', type: 'text', required: false, sort_order: (current.template.facility_profile_fields || []).length + 1 }] } }));

  const saveTemplate = async () => {
    if (!draft || !selectedOption) return;
    if (!draft.template.name.trim() || draft.template.passing_threshold < draft.template.conditional_threshold) {
      setMessage('Enter a template name and ensure the passing threshold is not below the conditional threshold.');
      return;
    }
    try {
      await saveMutation.mutateAsync({
        template_code: draft.template.code,
        facility_type_code: selectedOption.facility_type.code,
        name: draft.template.name,
        version: draft.template.version,
        passing_threshold: Number(draft.template.passing_threshold),
        conditional_threshold: Number(draft.template.conditional_threshold),
        active: true,
        facility_profile_fields: draft.template.facility_profile_fields || [],
        sections: draft.sections,
        eligibility: draft.eligibility,
        items: draft.items,
      });
      setMessage('Template saved. New inspections of this facility type will use the updated configuration.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Template could not be saved.');
    }
  };

  if (optionsQuery.isLoading) return <main className="nmis-page"><p className="text-brand-muted">Loading inspection facility types...</p></main>;
  if (optionsQuery.isError || !optionsQuery.data) return <main className="nmis-page"><ErrorState title="Inspection template administration unavailable" action={{ label: 'Retry', onClick: () => optionsQuery.refetch() }} /></main>;

  return <main className="nmis-page"><div className="space-y-6"><PageHeader eyebrow="Quality & Compliance · Administration" title="Inspection templates" subtitle="Configure a separate checklist, eligibility gate, facility profile, scoring method, and recommendation threshold for each facility type." actions={<Button onClick={saveTemplate} disabled={!draft || saveMutation.isPending}><Save size={16} /> {saveMutation.isPending ? 'Saving...' : 'Save template'}</Button>} />
    <Card><div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"><label className="block space-y-1"><span className="nmis-label">Facility type</span><select value={facilityTypeCode} onChange={event => setFacilityTypeCode(event.target.value)} className="nmis-control">{optionsQuery.data.map(option => <option key={option.facility_type.code} value={option.facility_type.code}>{option.facility_type.name}{option.configured ? ' · Configured' : ' · Not configured'}</option>)}</select></label><div className="rounded-2xl border border-brand-divider bg-brand-soft p-4 text-sm text-brand-secondary"><p className="font-black text-brand-foreground">Template scope</p><p className="mt-1">Each facility type has its own template. Hospital, Optical, Dental, and Diagnostic templates can be configured here later without changing application code.</p></div></div></Card>

    {draft && <>
      <Card><div className="mb-5 flex items-center justify-between gap-3"><div><h2 className="text-lg font-black text-brand-foreground">Template identity and thresholds</h2><p className="mt-1 text-sm text-brand-muted">Thresholds are evaluated against the configured denominator for this facility type.</p></div></div><div className="grid gap-4 md:grid-cols-4"><TextField label="Template code" value={draft.template.code} onChange={value => updateDraft(current => ({ ...current, template: { ...current.template, code: value } }))} /><TextField label="Template name" value={draft.template.name} onChange={value => updateDraft(current => ({ ...current, template: { ...current.template, name: value } }))} /><TextField label="Version" value={draft.template.version} onChange={value => updateDraft(current => ({ ...current, template: { ...current.template, version: value } }))} /><TextField label="Passing threshold %" value={draft.template.passing_threshold} type="number" onChange={value => updateDraft(current => ({ ...current, template: { ...current.template, passing_threshold: Number(value) } }))} /><TextField label="Conditional threshold %" value={draft.template.conditional_threshold} type="number" onChange={value => updateDraft(current => ({ ...current, template: { ...current.template, conditional_threshold: Number(value) } }))} /></div></Card>

      <Card><div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-lg font-black text-brand-foreground">Section A · Facility profile fields</h2><p className="mt-1 text-sm text-brand-muted">Define the metadata required for this facility type.</p></div><Button variant="secondary" onClick={addProfileField}><Plus size={16} /> Add field</Button></div><div className="space-y-3">{(draft.template.facility_profile_fields || []).map((field, index) => <div key={`${field.key}-${index}`} className="grid gap-3 rounded-2xl border border-brand-divider bg-brand-surface p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_140px_auto_auto] md:items-end"><TextField label="Key" value={field.key} onChange={value => updateDraft(current => ({ ...current, template: { ...current.template, facility_profile_fields: (current.template.facility_profile_fields || []).map((entry, entryIndex) => entryIndex === index ? { ...entry, key: value } : entry) } }))} /><TextField label="Label" value={field.label} onChange={value => updateDraft(current => ({ ...current, template: { ...current.template, facility_profile_fields: (current.template.facility_profile_fields || []).map((entry, entryIndex) => entryIndex === index ? { ...entry, label: value } : entry) } }))} /><label className="block space-y-1"><span className="nmis-label">Type</span><select value={field.type} onChange={event => updateDraft(current => ({ ...current, template: { ...current.template, facility_profile_fields: (current.template.facility_profile_fields || []).map((entry, entryIndex) => entryIndex === index ? { ...entry, type: event.target.value } : entry) } }))} className="nmis-control"><option value="text">Text</option><option value="number">Number</option><option value="email">Email</option><option value="date">Date</option><option value="boolean">Yes / No</option><option value="select">Dropdown</option></select></label>{field.type === 'select' && <TextField label="Options (comma separated)" value={(field.options || []).join(', ')} onChange={value => updateDraft(current => ({ ...current, template: { ...current.template, facility_profile_fields: (current.template.facility_profile_fields || []).map((entry, entryIndex) => entryIndex === index ? { ...entry, options: value.split(',').map(s => s.trim()).filter(Boolean) } : entry) } }))} />}<label className="flex items-center gap-2 pb-2 text-sm font-bold text-brand-secondary"><input type="checkbox" checked={field.required} onChange={event => updateDraft(current => ({ ...current, template: { ...current.template, facility_profile_fields: (current.template.facility_profile_fields || []).map((entry, entryIndex) => entryIndex === index ? { ...entry, required: event.target.checked } : entry) } }))} /> Required</label><button type="button" onClick={() => updateDraft(current => ({ ...current, template: { ...current.template, facility_profile_fields: (current.template.facility_profile_fields || []).filter((_, entryIndex) => entryIndex !== index) } }))} className="rounded-control p-2 text-status-danger hover:bg-status-dangerSoft" aria-label="Remove facility profile field"><Trash2 size={16} /></button></div>)}</div></Card>

      <Card><div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-lg font-black text-brand-foreground">Checklist sections</h2><p className="mt-1 text-sm text-brand-muted">Sections are independent per facility-type template.</p></div><Button variant="secondary" onClick={addSection}><Plus size={16} /> Add section</Button></div><div className="space-y-3">{draft.sections.map((section, index) => <SectionRow key={`${section.section_code}-${index}`} section={section} onChange={next => updateDraft(current => ({ ...current, sections: current.sections.map((entry, entryIndex) => entryIndex === index ? next : entry) }))} onRemove={() => updateDraft(current => ({ ...current, sections: current.sections.filter((_, entryIndex) => entryIndex !== index) }))} />)}</div></Card>

      <Card><div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-lg font-black text-brand-foreground">Eligibility criteria</h2><p className="mt-1 text-sm text-brand-muted">Each facility type can have a different eligibility gate.</p></div><Button variant="secondary" onClick={addEligibility}><Plus size={16} /> Add criterion</Button></div><div className="space-y-3">{draft.eligibility.map((criterion, index) => <div key={`${criterion.criterion_code}-${index}`} className="grid gap-3 rounded-2xl border border-brand-divider bg-brand-surface p-4 md:grid-cols-[180px_minmax(0,1fr)_auto_auto] md:items-end"><TextField label="Code" value={criterion.criterion_code} onChange={value => updateDraft(current => ({ ...current, eligibility: current.eligibility.map((entry, entryIndex) => entryIndex === index ? { ...entry, criterion_code: value } : entry) }))} /><TextField label="Criterion" value={criterion.criterion_label} onChange={value => updateDraft(current => ({ ...current, eligibility: current.eligibility.map((entry, entryIndex) => entryIndex === index ? { ...entry, criterion_label: value } : entry) }))} /><label className="flex items-center gap-2 pb-2 text-sm font-bold text-brand-secondary"><input type="checkbox" checked={criterion.required} onChange={event => updateDraft(current => ({ ...current, eligibility: current.eligibility.map((entry, entryIndex) => entryIndex === index ? { ...entry, required: event.target.checked } : entry) }))} /> Required</label><button type="button" onClick={() => updateDraft(current => ({ ...current, eligibility: current.eligibility.filter((_, entryIndex) => entryIndex !== index) }))} className="rounded-control p-2 text-status-danger hover:bg-status-dangerSoft" aria-label="Remove eligibility criterion"><Trash2 size={16} /></button></div>)}</div></Card>

      <Card><div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-lg font-black text-brand-foreground">Checklist items and scoring method</h2><p className="mt-1 text-sm text-brand-muted">Use manual-only for raw inspector entry, headcount formula for threshold-based items, and Yes / No with points for binary requirements.</p></div><Button variant="secondary" onClick={addItem}><Plus size={16} /> Add checklist item</Button></div><div className="space-y-3">{[...draft.items].sort((a, b) => a.sort_order - b.sort_order).map((item, index) => <ItemRow key={`${item.item_code}-${index}`} item={item} onChange={next => updateDraft(current => ({ ...current, items: current.items.map((entry, entryIndex) => entryIndex === index ? next : entry) }))} onRemove={() => updateDraft(current => ({ ...current, items: current.items.filter((_, entryIndex) => entryIndex !== index) }))} />)}</div></Card>
      {message && <div className="rounded-2xl border border-brand-divider bg-brand-surface p-4 text-sm font-bold text-brand-secondary">{message}</div>}
    </>}
  </div></main>;
}
