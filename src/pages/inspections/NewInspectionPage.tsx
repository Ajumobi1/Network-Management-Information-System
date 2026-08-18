import { useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Check, CheckCircle2, ChevronLeft, ChevronRight, FileText, Plus, RotateCcw, Save, Send, ShieldCheck, Trash2, UserRound, X } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { ErrorState } from '../../components/ui/FeedbackStates';
import PageHeader from '../../components/ui/PageHeader';
import { useProviderDirectory } from '../../hooks/providers/providersHooks';
import { useInspectionTemplate, useSaveStructuredInspection } from '../../hooks/inspections/structuredInspectionHooks';
import { InspectionTemplateItem, StructuredInspectionPayload } from '../../repositories/inspections/structuredInspectionRepository';

type FacilityProfileState = {
  facility_name: string;
  address: string;
  telephone: string;
  superintendent_pharmacist: string;
  nhia_registered: string;
  nhia_registration_no: string;
  smoh_pcn_registered: string;
  smoh_pcn_registration_no: string;
  premises_registration_license_no: string;
  cac_registration_no: string;
  facility_email: string;
  inspection_date: string;
  contact_person: string;
  facility_account_name: string;
};

type ResponseState = { number: string; boolean: boolean | null; remark: string };
type EligibilityState = { met: boolean; notes: string };
type TeamMember = { id: string; name: string; role: string; inspection_date: string; signature_data: string };

const EMPTY_PROFILE: FacilityProfileState = {
  facility_name: '', address: '', telephone: '', superintendent_pharmacist: '', nhia_registered: '', nhia_registration_no: '', smoh_pcn_registered: '', smoh_pcn_registration_no: '', premises_registration_license_no: '', cac_registration_no: '', facility_email: '', inspection_date: new Date().toISOString().slice(0, 10), contact_person: '', facility_account_name: '',
};

const STEP_LABELS = ['Eligibility', 'Facility Profile', 'Personnel', 'Infrastructure', 'Essential Services', 'Review & Sign'];
const DRAFT_KEY = 'nmis-structured-pharmacy-inspection-draft';

function SectionCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return <Card><div className="mb-5 border-b border-brand-divider pb-4"><h2 className="text-lg font-black text-brand-foreground">{title}</h2><p className="mt-1 text-sm text-brand-muted">{subtitle}</p></div>{children}</Card>;
}

function blankResponse(item: InspectionTemplateItem): ResponseState {
  return { number: item.response_type === 'number' ? '' : '', boolean: item.response_type === 'boolean' ? null : null, remark: '' };
}

function SignaturePad({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.lineWidth = 2;
    context.lineCap = 'round';
    context.strokeStyle = '#0b4f82';
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (value) {
      const image = new Image();
      image.onload = () => context.drawImage(image, 0, 0, canvas.width, canvas.height);
      image.src = value;
    }
  }, [value]);

  const point = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: ((event.clientX - rect.left) / rect.width) * canvas.width, y: ((event.clientY - rect.top) / rect.height) * canvas.height };
  };

  const start = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    drawing.current = true;
    canvas.setPointerCapture(event.pointerId);
    const p = point(event);
    context.beginPath();
    context.moveTo(p.x, p.y);
  };

  const move = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const context = canvasRef.current?.getContext('2d');
    if (!context) return;
    const p = point(event);
    context.lineTo(p.x, p.y);
    context.stroke();
  };

  const stop = () => {
    if (!drawing.current) return;
    drawing.current = false;
    if (canvasRef.current) onChange(canvasRef.current.toDataURL('image/png'));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    onChange('');
  };

  return <div className="space-y-2"><div className="overflow-hidden rounded-control border border-brand-divider bg-white"><canvas ref={canvasRef} width={720} height={170} className="h-32 w-full touch-none" onPointerDown={start} onPointerMove={move} onPointerUp={stop} onPointerCancel={stop} /></div><div className="flex justify-end"><button type="button" onClick={clear} className="inline-flex items-center gap-1 text-xs font-bold text-brand-muted hover:text-brand-blue"><RotateCcw size={13} /> Clear signature</button></div></div>;
}

function Field({ label, value, onChange, type = 'text', placeholder, required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; required?: boolean }) {
  return <label className="block space-y-1.5"><span className="nmis-label">{label}{required ? ' *' : ''}</span><input type={type} required={required} value={value} placeholder={placeholder} onChange={event => onChange(event.target.value)} className="nmis-control" /></label>;
}

function YesNoToggle({ value, onChange }: { value: boolean | null; onChange: (value: boolean) => void }) {
  return <div className="inline-flex rounded-control border border-brand-divider bg-white p-1"><button type="button" onClick={() => onChange(true)} className={`min-h-10 rounded px-4 text-xs font-black uppercase tracking-wide transition ${value === true ? 'bg-status-success text-white' : 'text-brand-secondary hover:bg-brand-surface'}`}>Yes</button><button type="button" onClick={() => onChange(false)} className={`min-h-10 rounded px-4 text-xs font-black uppercase tracking-wide transition ${value === false ? 'bg-status-danger text-white' : 'text-brand-secondary hover:bg-brand-surface'}`}>No</button></div>;
}

function ScoredItem({ item, response, onChange }: { item: InspectionTemplateItem; response: ResponseState; onChange: (next: ResponseState) => void }) {
  const answered = item.response_type === 'number' ? response.number !== '' : response.boolean !== null;
  const earned = item.response_type === 'number' ? (Number(response.number || 0) >= Number(item.min_required || 0) ? item.max_points : 0) : response.boolean === true ? item.max_points : 0;
  const denominator = answered && (item.response_type === 'number' || response.boolean === true || item.scored_when_no) ? item.max_points : 0;
  return <div className="rounded-2xl border border-brand-divider bg-brand-card p-4 shadow-sm"><div className="flex flex-col gap-4 lg:flex-row lg:items-start"><div className="flex min-w-0 flex-1 gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-black text-brand-blue">{item.item_code.replace(/[A-Z]/g, '')}</span><div><p className="text-sm font-black text-brand-foreground">{item.item_label}</p><p className="mt-1 text-xs text-brand-muted">Maximum {item.max_points} points{item.min_required !== null ? ` · Minimum required: ${item.min_required}` : ''}{item.response_type === 'boolean' && !item.scored_when_no ? ' · No excludes this item from denominator' : ''}</p></div></div><div className="flex items-center gap-4">{item.response_type === 'number' ? <input type="number" min="0" value={response.number} onChange={event => onChange({ ...response, number: event.target.value })} className="nmis-control w-28" placeholder="Available" /> : <YesNoToggle value={response.boolean} onChange={boolean => onChange({ ...response, boolean })} />}<div className="min-w-20 text-right"><p className="text-lg font-black text-brand-blue">{earned}/{denominator || item.max_points}</p><p className="text-[10px] font-bold uppercase tracking-wide text-brand-muted">points</p></div></div></div><textarea rows={2} value={response.remark} onChange={event => onChange({ ...response, remark: event.target.value })} placeholder="Remark or evidence note..." className="nmis-control mt-4 resize-y" /></div>;
}

export default function NewInspectionPage() {
  const navigate = useNavigate();
  const templateQuery = useInspectionTemplate();
  const providerQuery = useProviderDirectory({ search: '', status: 'all', contractStatus: 'all', credentialStatus: 'all', inspectionStatus: 'all', capitationStatus: 'all', lga: 'all', category: 'all', subcategory: 'all', ownership: 'all', service: 'all' });
  const saveMutation = useSaveStructuredInspection();
  const [step, setStep] = useState(0);
  const [inspectionId, setInspectionId] = useState<string | null>(null);
  const [providerId, setProviderId] = useState('');
  const [profile, setProfile] = useState<FacilityProfileState>(EMPTY_PROFILE);
  const [eligibility, setEligibility] = useState<Record<string, EligibilityState>>({});
  const [responses, setResponses] = useState<Record<string, ResponseState>>({});
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [saveMessage, setSaveMessage] = useState('');
  const [draftLoaded, setDraftLoaded] = useState(false);

  const template = templateQuery.data;
  const items = template?.items || [];

  useEffect(() => {
    if (!template || draftLoaded) return;
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
      try {
        const draft = JSON.parse(raw);
        setStep(draft.step || 0); setInspectionId(draft.inspectionId || null); setProviderId(draft.providerId || ''); setProfile({ ...EMPTY_PROFILE, ...(draft.profile || {}) }); setEligibility(draft.eligibility || {}); setResponses(draft.responses || {}); setTeam(draft.team || []);
      } catch { localStorage.removeItem(DRAFT_KEY); }
    }
    setDraftLoaded(true);
  }, [template, draftLoaded]);

  useEffect(() => {
    if (!template || !draftLoaded) return;
    setEligibility(previous => {
      const next = { ...previous };
      template.eligibility.forEach(item => { next[item.criterion_code] = next[item.criterion_code] || { met: false, notes: '' }; });
      return next;
    });
    setResponses(previous => {
      const next = { ...previous };
      template.items.forEach(item => { next[item.item_code] = next[item.item_code] || blankResponse(item); });
      return next;
    });
  }, [template, draftLoaded]);

  useEffect(() => {
    if (!template || !draftLoaded) return;
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ step, inspectionId, providerId, profile, eligibility, responses, team }));
  }, [template, draftLoaded, step, inspectionId, providerId, profile, eligibility, responses, team]);

  const selectedProvider = useMemo(() => providerQuery.data?.find(provider => provider.id === providerId), [providerId, providerQuery.data]);
  const allEligibilityMet = template?.eligibility.filter(item => item.required).every(item => eligibility[item.criterion_code]?.met) ?? false;
  const answeredCount = items.filter(item => item.response_type === 'number' ? responses[item.item_code]?.number !== '' : responses[item.item_code]?.boolean !== null).length;
  const signedCount = team.filter(member => Boolean(member.signature_data)).length;
  const score = useMemo(() => {
    let points = 0; let possible = 0;
    items.forEach(item => {
      const response = responses[item.item_code];
      if (!response) return;
      if (item.response_type === 'number') {
        if (!response.number) return;
        possible += item.max_points;
        if (Number(response.number) >= Number(item.min_required || 0)) points += item.max_points;
      } else if (response.boolean !== null) {
        if (response.boolean || item.scored_when_no) possible += item.max_points;
        if (response.boolean) points += item.max_points;
      }
    });
    const percentage = possible ? Math.round((points / possible) * 10000) / 100 : 0;
    const recommendation = percentage >= (template?.template.passing_threshold || 75) ? 'Recommended for Accreditation' : percentage >= (template?.template.conditional_threshold || 60) ? 'Conditionally Recommended — Re-inspection Required' : 'Not Recommended for Accreditation';
    return { points, possible, percentage, recommendation };
  }, [items, responses, template]);

  const setProfileValue = (key: keyof FacilityProfileState, value: string) => setProfile(previous => ({ ...previous, [key]: value }));
  const setResponse = (itemCode: string, response: ResponseState) => setResponses(previous => ({ ...previous, [itemCode]: response }));

  const applyProvider = (id: string) => {
    setProviderId(id);
    const provider = providerQuery.data?.find(item => item.id === id) as any;
    if (!provider) return;
    setProfile(previous => ({ ...previous, facility_name: provider.providerName || '', address: provider.address || '', telephone: provider.phone || '', facility_email: provider.email || '', inspection_date: previous.inspection_date || new Date().toISOString().slice(0, 10) }));
  };

  const buildPayload = (mode: 'draft' | 'submit'): StructuredInspectionPayload => ({ mode, step: STEP_LABELS[step].toLowerCase().replace(/ & /g, '-').replace(/ /g, '-'), template_code: template?.template.code || 'pharmacy-accreditation', provider_id: providerId, inspection_type: 'Pharmacy Accreditation', scheduled_date: profile.inspection_date || new Date().toISOString().slice(0, 10), inspector_name: '', facility_profile: profile, eligibility: template?.eligibility.map(item => ({ criterion_code: item.criterion_code, criterion_label: item.criterion_label, met: Boolean(eligibility[item.criterion_code]?.met), notes: eligibility[item.criterion_code]?.notes || '' })) || [], responses: items.map(item => ({ item_code: item.item_code, response_number: item.response_type === 'number' ? Number(responses[item.item_code]?.number || 0) : null, response_boolean: item.response_type === 'boolean' ? responses[item.item_code]?.boolean : null, remark: responses[item.item_code]?.remark || '' })), team: team.map(member => ({ name: member.name, role: member.role, inspection_date: member.inspection_date, signature_data: member.signature_data })) });

  const saveDraft = async () => {
    if (!providerId) { setSaveMessage('Select a provider before saving the draft.'); return; }
    try {
      const result = await saveMutation.mutateAsync({ inspectionId, payload: buildPayload('draft') });
      setInspectionId(result.inspection_id); setSaveMessage(`Draft saved · ${result.overall_score}% preview score`); localStorage.removeItem(DRAFT_KEY);
    } catch (error) { setSaveMessage(error instanceof Error ? error.message : 'Unable to save draft.'); }
  };

  const submitInspection = async () => {
    if (!providerId) { setSaveMessage('Select a provider before submission.'); return; }
    if (!allEligibilityMet) { setSaveMessage('All eligibility criteria must be marked MET before submission.'); setStep(0); return; }
    if (answeredCount !== items.length) { setSaveMessage('Complete every scored checklist item before submission.'); return; }
    if (!signedCount) { setSaveMessage('At least one signed inspection team member is required.'); setStep(5); return; }
    try {
      await saveMutation.mutateAsync({ inspectionId, payload: buildPayload('submit') });
      localStorage.removeItem(DRAFT_KEY);
      navigate('/inspections');
    } catch (error) { setSaveMessage(error instanceof Error ? error.message : 'Unable to submit inspection.'); }
  };

  if (templateQuery.isLoading) return <main className="nmis-page"><p className="text-brand-muted">Loading inspection template...</p></main>;
  if (templateQuery.isError || !template) return <main className="nmis-page"><ErrorState title="Inspection template unavailable" action={{ label: 'Retry', onClick: () => templateQuery.refetch() }} /></main>;

  return <main className="nmis-page"><div className="space-y-6"><PageHeader eyebrow="Quality & Compliance" title="New facility inspection" subtitle="Complete the pharmacy accreditation checklist, capture evidence, and submit a signed recommendation." actions={<Button variant="secondary" onClick={() => navigate('/inspections')}><X size={16} /> Exit</Button>} />
    <div className="grid gap-3 md:grid-cols-6">{STEP_LABELS.map((label, index) => <button key={label} type="button" onClick={() => index <= step && setStep(index)} className={`rounded-2xl border p-3 text-left transition ${index === step ? 'border-brand-blue bg-brand-soft shadow-sm' : index < step ? 'border-status-success/30 bg-status-successSoft' : 'border-brand-divider bg-brand-card'}`}><div className="flex items-center gap-2"><span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${index === step ? 'bg-brand-blue text-white' : index < step ? 'bg-status-success text-white' : 'bg-brand-surface text-brand-muted'}`}>{index < step ? <Check size={14} /> : index + 1}</span><span className="text-xs font-black text-brand-foreground">{label}</span></div></button>)}</div>

    {step === 0 && <SectionCard title="Eligibility gate" subtitle="All required criteria must be MET before scored sections unlock."><div className="space-y-4">{template.eligibility.map(item => { const current = eligibility[item.criterion_code] || { met: false, notes: '' }; return <div key={item.criterion_code} className="flex flex-col gap-3 rounded-2xl border border-brand-divider bg-brand-surface p-4 sm:flex-row sm:items-center"><div className="flex flex-1 items-start gap-3"><ShieldCheck size={20} className={current.met ? 'text-status-success' : 'text-brand-muted'} /><div><p className="text-sm font-black text-brand-foreground">{item.criterion_label}{item.required ? ' *' : ''}</p><input value={current.notes} onChange={event => setEligibility(previous => ({ ...previous, [item.criterion_code]: { ...current, notes: event.target.value } }))} placeholder="Optional note or evidence reference" className="nmis-control mt-2" /></div></div><YesNoToggle value={current.met} onChange={met => setEligibility(previous => ({ ...previous, [item.criterion_code]: { ...current, met } }))} /></div>; })}</div><div className={`mt-5 rounded-2xl border p-4 text-sm font-bold ${allEligibilityMet ? 'border-status-success/30 bg-status-successSoft text-status-success' : 'border-status-warning/30 bg-status-warningSoft text-status-warning'}`}>{allEligibilityMet ? 'Eligibility gate passed. Scored sections are unlocked.' : 'Eligibility gate not yet passed. Mark every required criterion MET to proceed.'}</div></SectionCard>}

    {step === 1 && <SectionCard title="Section A · Facility profile" subtitle="Capture the metadata exactly as observed during the inspection visit."><div className="space-y-5"><label className="block space-y-1.5"><span className="nmis-label">Provider / Facility *</span><select className="nmis-control" value={providerId} onChange={event => applyProvider(event.target.value)} required><option value="">Select an authoritative provider</option>{providerQuery.data?.map(provider => <option key={provider.id} value={provider.id}>{provider.providerName} · {provider.providerCode}</option>)}</select>{selectedProvider && <span className="text-xs text-brand-muted">{selectedProvider.providerCode}</span>}</label><div className="grid gap-4 md:grid-cols-2"><Field label="Name of pharmacy / facility" value={profile.facility_name} onChange={value => setProfileValue('facility_name', value)} required /><Field label="Address" value={profile.address} onChange={value => setProfileValue('address', value)} /><Field label="Telephone number" value={profile.telephone} onChange={value => setProfileValue('telephone', value)} /><Field label="Facility email" value={profile.facility_email} onChange={value => setProfileValue('facility_email', value)} type="email" /><Field label="Superintendent pharmacist" value={profile.superintendent_pharmacist} onChange={value => setProfileValue('superintendent_pharmacist', value)} /><Field label="Date of inspection" value={profile.inspection_date} onChange={value => setProfileValue('inspection_date', value)} type="date" required /><Field label="NHIA registration number" value={profile.nhia_registration_no} onChange={value => setProfileValue('nhia_registration_no', value)} /><Field label="SMOH / PCN registration number" value={profile.smoh_pcn_registration_no} onChange={value => setProfileValue('smoh_pcn_registration_no', value)} /><Field label="Premises registration license no." value={profile.premises_registration_license_no} onChange={value => setProfileValue('premises_registration_license_no', value)} /><Field label="CAC registration no." value={profile.cac_registration_no} onChange={value => setProfileValue('cac_registration_no', value)} /><Field label="Contact person" value={profile.contact_person} onChange={value => setProfileValue('contact_person', value)} /><Field label="Facility account name" value={profile.facility_account_name} onChange={value => setProfileValue('facility_account_name', value)} /></div><div className="grid gap-4 sm:grid-cols-2"><label className="space-y-1.5"><span className="nmis-label">NHIA accredited?</span><select className="nmis-control" value={profile.nhia_registered} onChange={event => setProfileValue('nhia_registered', event.target.value)}><option value="">Select</option><option value="true">Yes</option><option value="false">No</option></select></label><label className="space-y-1.5"><span className="nmis-label">Current SMOH & PCN registration?</span><select className="nmis-control" value={profile.smoh_pcn_registered} onChange={event => setProfileValue('smoh_pcn_registered', event.target.value)}><option value="">Select</option><option value="true">Yes</option><option value="false">No</option></select></label></div></div></SectionCard>}

    {step >= 2 && step <= 4 && <SectionCard title={`Section ${step === 2 ? 'B · Personnel' : step === 3 ? 'C · Infrastructure' : 'D · Essential Services'}`} subtitle={step === 2 ? 'Enter the number available and the engine will test minimum staffing requirements.' : 'Mark each facility requirement YES or NO and record a concise evidence remark.'}><div className="space-y-4">{items.filter(item => item.section_code === (step === 2 ? 'B' : step === 3 ? 'C' : 'D')).map(item => <ScoredItem key={item.item_code} item={item} response={responses[item.item_code] || blankResponse(item)} onChange={response => setResponse(item.item_code, response)} />)}</div><div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-divider bg-brand-soft p-4"><div><p className="nmis-label">Live section progress</p><p className="mt-1 text-sm font-black text-brand-foreground">{items.filter(item => item.section_code === (step === 2 ? 'B' : step === 3 ? 'C' : 'D')).filter(item => item.response_type === 'number' ? responses[item.item_code]?.number !== '' : responses[item.item_code]?.boolean !== null).length} of {items.filter(item => item.section_code === (step === 2 ? 'B' : step === 3 ? 'C' : 'D')).length} items answered</p></div><p className="text-2xl font-black text-brand-blue">{score.percentage}%</p></div></SectionCard>}

    {step === 5 && <div className="space-y-6"><SectionCard title="Review & Sign" subtitle="Confirm the computed recommendation, add the inspection team, and submit only after all evidence is complete."><div className="grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border border-brand-divider bg-brand-soft p-4"><p className="nmis-label">Overall score</p><p className="mt-1 text-3xl font-black text-brand-blue">{score.percentage}%</p><p className="text-xs text-brand-muted">{score.points} / {score.possible || 100} included points</p></div><div className="rounded-2xl border border-brand-divider bg-brand-surface p-4 sm:col-span-2"><p className="nmis-label">Recommendation</p><p className={`mt-2 text-base font-black ${score.percentage >= 75 ? 'text-status-success' : score.percentage >= 60 ? 'text-status-warning' : 'text-status-danger'}`}>{score.recommendation}</p><p className="mt-1 text-xs text-brand-muted">Thresholds: ≥75% recommended · 60–74% conditional · &lt;60% not recommended</p></div></div><div className="mt-6 grid gap-4 sm:grid-cols-3"><div><p className="nmis-label">Eligibility</p><p className="mt-1 font-black text-brand-foreground">{allEligibilityMet ? 'All MET' : 'Incomplete'}</p></div><div><p className="nmis-label">Scored responses</p><p className="mt-1 font-black text-brand-foreground">{answeredCount} / {items.length}</p></div><div><p className="nmis-label">Signed team members</p><p className="mt-1 font-black text-brand-foreground">{signedCount}</p></div></div></SectionCard><SectionCard title="Inspection team" subtitle="Add each inspector or reviewer and capture a signature on the tablet or laptop."><div className="space-y-4">{team.map((member, index) => <div key={member.id} className="rounded-2xl border border-brand-divider bg-brand-surface p-4"><div className="flex items-center justify-between gap-3"><p className="text-sm font-black text-brand-foreground">Team member {index + 1}</p><button type="button" onClick={() => setTeam(previous => previous.filter(item => item.id !== member.id))} className="rounded-control p-2 text-status-danger hover:bg-status-dangerSoft"><Trash2 size={16} /></button></div><div className="mt-4 grid gap-4 sm:grid-cols-3"><Field label="Name" value={member.name} onChange={value => setTeam(previous => previous.map(item => item.id === member.id ? { ...item, name: value } : item))} required /><Field label="Role" value={member.role} onChange={value => setTeam(previous => previous.map(item => item.id === member.id ? { ...item, role: value } : item))} /><Field label="Date" value={member.inspection_date} onChange={value => setTeam(previous => previous.map(item => item.id === member.id ? { ...item, inspection_date: value } : item))} type="date" required /></div><div className="mt-4"><p className="nmis-label">Signature</p><SignaturePad value={member.signature_data} onChange={value => setTeam(previous => previous.map(item => item.id === member.id ? { ...item, signature_data: value } : item))} /></div></div>)}<button type="button" onClick={() => setTeam(previous => [...previous, { id: crypto.randomUUID(), name: '', role: 'Inspector', inspection_date: profile.inspection_date, signature_data: '' }])} className="inline-flex min-h-11 items-center gap-2 rounded-control border border-dashed border-brand-blue px-4 py-2 text-sm font-black text-brand-blue hover:bg-brand-soft"><Plus size={16} /> Add inspection team member</button></div></SectionCard></div>}

    {saveMessage && <div className="rounded-2xl border border-brand-divider bg-brand-surface p-4 text-sm font-bold text-brand-secondary">{saveMessage}</div>}
    <div className="flex flex-col-reverse gap-3 border-t border-brand-divider pt-5 sm:flex-row sm:items-center sm:justify-between"><Button variant="secondary" onClick={() => setStep(previous => Math.max(0, previous - 1))} disabled={step === 0}><ChevronLeft size={16} /> Back</Button><div className="flex flex-col gap-2 sm:flex-row"><Button variant="secondary" onClick={saveDraft} disabled={saveMutation.isPending}><Save size={16} /> {saveMutation.isPending ? 'Saving...' : 'Save draft'}</Button>{step < STEP_LABELS.length - 1 ? <Button onClick={() => { if (step === 0 && !allEligibilityMet) { setSaveMessage('All eligibility criteria must be marked MET before proceeding.'); return; } setSaveMessage(''); setStep(previous => Math.min(STEP_LABELS.length - 1, previous + 1)); }}><ChevronRight size={16} /> Continue</Button> : <Button onClick={submitInspection} disabled={saveMutation.isPending}><Send size={16} /> {saveMutation.isPending ? 'Submitting...' : 'Submit inspection'}</Button>}</div></div>
  </div></main>;
}
