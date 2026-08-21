import { useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent, ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CalendarDays, Check, CheckCircle2, ChevronLeft, ChevronRight, FileText, Plus, RotateCcw, Save, Send, ShieldCheck, Trash2, UserRound, X } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { ErrorState } from '../../components/ui/FeedbackStates';
import PageHeader from '../../components/ui/PageHeader';
import { useProviderDirectory, useProviderProfile } from '../../hooks/providers/providersHooks';
import { ProviderCategory, ProviderLifecycleStatus, ProviderOwnership } from '../../constants/providerNetwork';
import { useInspectionTemplate, useInspectionTemplateOptions, useSaveStructuredInspection } from '../../hooks/inspections/structuredInspectionHooks';
import { getStructuredInspection, InspectionTemplateItem, StructuredInspectionPayload } from '../../repositories/inspections/structuredInspectionRepository';
import { providerDocumentsRepository } from '../../repositories/providers/providerDocumentsRepository';
import { buildInspectionReportPdf, downloadPdf, inspectionReportFileName, pdfBytesToBlob, reportStoragePath } from '../../features/inspections/inspectionReportPdf';

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
  // Hospital-specific fields
  physician_in_charge: string;
  physician_phone: string;
  desk_officer: string;
  desk_officer_phone: string;
  hospital_beds: string;
  nhia_reg_no: string;
  smoh_reg_no: string;
  reference_quarter?: string;
  reference_year?: string;
  lga_district?: string;
};

type ResponseState = { number: string; manual_score: string; boolean: boolean | null; remark: string };
type EligibilityState = { met: boolean; notes: string };
type TeamMember = { id: string; name: string; role: string; inspection_date: string; signature_data: string };

const EMPTY_PROFILE: FacilityProfileState = {
  facility_name: '', address: '', telephone: '', superintendent_pharmacist: '', nhia_registered: '', nhia_registration_no: '', smoh_pcn_registered: '', smoh_pcn_registration_no: '', premises_registration_license_no: '', cac_registration_no: '', facility_email: '', inspection_date: new Date().toISOString().slice(0, 10), contact_person: '', facility_account_name: '',
  physician_in_charge: '', physician_phone: '', desk_officer: '', desk_officer_phone: '', hospital_beds: '', nhia_reg_no: '', smoh_reg_no: '', reference_quarter: '', reference_year: '', lga_district: '',
};

const STEP_LABELS = ['Eligibility', 'Facility Profile', 'Review & Sign'];
const DRAFT_KEY = 'nmis-structured-pharmacy-inspection-draft';
const WORKFLOW_ONLY_SECTION_CODES = new Set(['REMARKS', 'TEAM']);

function SectionCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return <Card><div className="mb-5 border-b border-brand-divider pb-4"><h2 className="text-lg font-black text-brand-foreground">{title}</h2><p className="mt-1 text-sm text-brand-muted">{subtitle}</p></div>{children}</Card>;
}

function isManualItem(item: InspectionTemplateItem) {
  return item.scoring_method === 'manual_only' || item.manual_score_allowed;
}

function isResponseComplete(item: InspectionTemplateItem, response: ResponseState) {
  if (isManualItem(item)) {
    if (response.manual_score === '') return false;
    return item.response_type === 'number' ? response.number !== '' : response.boolean !== null;
  }
  return item.response_type === 'number' ? response.number !== '' : response.boolean !== null;
}

function blankResponse(item: InspectionTemplateItem): ResponseState {
  return { number: '', manual_score: isManualItem(item) ? '' : '', boolean: item.response_type === 'boolean' ? null : null, remark: '' };
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

function Field({ label, value, onChange, type = 'text', placeholder, required = false, options = [] }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; required?: boolean; options?: string[] }) {
  const isSelect = type === 'select' || (options && options.length > 0);
  
  if (isSelect) {
    return (
      <label className="block space-y-1.5">
        <span className="nmis-label">{label}{required ? ' *' : ''}</span>
        <select 
          required={required} 
          value={value || ''} 
          onChange={event => onChange(event.target.value)} 
          className="nmis-control"
        >
          <option value="">Select {label}</option>
          {(options || []).map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </label>
    );
  }
  
  return (
    <label className="block space-y-1.5">
      <span className="nmis-label">{label}{required ? ' *' : ''}</span>
      <input 
        type={type === 'select' ? 'text' : type} 
        required={required} 
        value={value || ''} 
        placeholder={placeholder} 
        onChange={event => onChange(event.target.value)} 
        className="nmis-control" 
      />
    </label>
  );
}

function YesNoToggle({ value, onChange }: { value: boolean | null; onChange: (value: boolean) => void }) {
  return <div className="inline-flex rounded-control border border-brand-divider bg-white p-1"><button type="button" onClick={() => onChange(true)} className={`min-h-10 rounded px-4 text-xs font-black uppercase tracking-wide transition ${value === true ? 'bg-status-success text-white' : 'text-brand-secondary hover:bg-brand-surface'}`}>Yes</button><button type="button" onClick={() => onChange(false)} className={`min-h-10 rounded px-4 text-xs font-black uppercase tracking-wide transition ${value === false ? 'bg-status-error text-white' : 'text-brand-secondary hover:bg-brand-surface'}`}>No</button></div>;
}

function displayItemCode(itemCode: string) {
  if (itemCode === 'D27B') return '27b';
  return itemCode.replace(/[A-Z]/g, '');
}

function isCredentialingSection(sectionCode: string) {
  return ['B', 'PERSONNEL'].includes(sectionCode.toUpperCase());
}

function isAccreditationSection(sectionCode: string) {
  const code = sectionCode.toUpperCase();
  return !['A', 'ELIGIBILITY', 'PROFILE'].includes(code) && !isCredentialingSection(code);
}

function MonthlyAmountTable({ value, onChange, label, quarter }: { value: string; onChange: (next: string) => void; label: string; quarter?: string }) {
  const data = useMemo(() => {
    try {
      return JSON.parse(value || '[]');
    } catch {
      return [];
    }
  }, [value]);

  const months = useMemo(() => {
    const q = (quarter || '').trim();
    const mapping: Record<string, string[]> = {
      'Q1': ['January', 'February', 'March'],
      'Q2': ['April', 'May', 'June'],
      'Q3': ['July', 'August', 'September'],
      'Q4': ['October', 'November', 'December'],
    };
    // Support both short (Q1) and long (Q1 (Jan-Mar)) formats
    const key = Object.keys(mapping).find(k => q.startsWith(k)) || '';
    return mapping[key] || ['Month 1', 'Month 2', 'Month 3'];
  }, [quarter]);

  const initializedData = useMemo(() => {
    return months.map((m, i) => {
      const existing = data[i] || {};
      return { month: m, amount: existing.amount || '', comment: existing.comment || '' };
    });
  }, [data, months]);

  const updateRow = (index: number, field: string, val: string) => {
    const next = [...initializedData];
    next[index] = { ...next[index], [field]: val };
    onChange(JSON.stringify(next));
  };

  return (
    <div className="rounded-2xl border border-brand-divider bg-brand-surface p-4">
      <p className="nmis-label mb-3">{label}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-brand-divider">
              <th className="pb-2 font-black text-brand-muted uppercase tracking-wider">Month</th>
              <th className="pb-2 font-black text-brand-muted uppercase tracking-wider">Amount (₦)</th>
              <th className="pb-2 font-black text-brand-muted uppercase tracking-wider">Comment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-divider">
            {initializedData.map((row: any, i: number) => (
              <tr key={i}>
                <td className="py-3 pr-4 font-bold text-brand-foreground">{row.month}</td>
                <td className="py-2 pr-4">
                  <input
                    type="number"
                    value={row.amount}
                    onChange={e => updateRow(i, 'amount', e.target.value)}
                    className="nmis-control h-9 min-w-32"
                    placeholder="0.00"
                  />
                </td>
                <td className="py-2">
                  <input
                    type="text"
                    value={row.comment}
                    onChange={e => updateRow(i, 'comment', e.target.value)}
                    className="nmis-control h-9"
                    placeholder="Note..."
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatDynamicLabel(label: string, quarter?: string): string {
  const q = quarter ? quarter.trim() : '';
  return label
    .replace(/·?\s*Quarter:\s*\(select quarter(\s+in\s+Section\s+A)?\)/gi, q ? `· Quarter: ${q}` : '· Quarter: (Select Quarter in Section A)')
    .replace(/\(Select Quarter( Above)?\)/gi, q ? `(${q})` : '(Select Quarter Above)')
    .replace(/—\s*\(Select Quarter( Above)?\)/gi, q ? `— ${q}` : '— (Select Quarter Above)');
}

function QAItem({ item, response, quarter, onChange }: { item: InspectionTemplateItem; response: ResponseState; quarter?: string; onChange: (next: ResponseState) => void }) {
  const dynamicLabel = formatDynamicLabel(item.item_label, quarter);

  if (item.response_type === 'json') {
    return <MonthlyAmountTable label={dynamicLabel} value={response.remark} quarter={quarter} onChange={val => onChange({ ...response, remark: val })} />;
  }

  return (
    <div className="rounded-2xl border border-brand-divider bg-brand-card p-4 shadow-sm">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-black text-brand-blue">
            {displayItemCode(item.item_code)}
          </span>
          <p className="text-sm font-black text-brand-foreground">{dynamicLabel}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
          {item.response_type === 'boolean' ? (
            <label className="block space-y-1">
              <span className="nmis-label">Observation</span>
              <YesNoToggle value={response.boolean} onChange={boolean => onChange({ ...response, boolean })} />
            </label>
          ) : item.response_type === 'number' ? (
            <label className="block space-y-1">
              <span className="nmis-label">No. Observed</span>
              <input
                type="number"
                min="0"
                value={response.number}
                onChange={event => onChange({ ...response, number: event.target.value })}
                className="nmis-control"
                placeholder="Count"
              />
            </label>
          ) : null}

          <label className="block space-y-1">
            <span className="nmis-label">Remark / Comment</span>
            {item.response_type === 'text' ? (
              <textarea
                rows={3}
                value={response.remark}
                onChange={event => onChange({ ...response, remark: event.target.value })}
                className="nmis-control resize-y"
                placeholder="Enter details..."
              />
            ) : (
              <input
                type="text"
                value={response.remark}
                onChange={event => onChange({ ...response, remark: event.target.value })}
                className="nmis-control"
                placeholder="Enter comment..."
              />
            )}
          </label>
        </div>
      </div>
    </div>
  );
}

function ScoredItem({ item, response, error, onChange }: { item: InspectionTemplateItem; response: ResponseState; error?: string; onChange: (next: ResponseState) => void }) {
  const isManual = item.scoring_method === 'manual_only' || item.manual_score_allowed;
  const earned = isManual ? Number(response.manual_score || 0) : item.response_type === 'number' ? (Number(response.number || 0) >= Number(item.min_required || 0) ? item.max_points : 0) : response.boolean === true ? item.max_points : 0;
  const denominator = item.max_points;

  const handleManualScoreChange = (value: string) => {
    // Automatically cap the manual score at the item's maximum
    const numeric = Number(value);
    if (!isNaN(numeric) && numeric > item.max_points) {
      onChange({ ...response, manual_score: String(item.max_points) });
    } else {
      onChange({ ...response, manual_score: value });
    }
  };

  return (
    <div className="rounded-2xl border border-brand-divider bg-brand-card p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-black text-brand-blue">
            {displayItemCode(item.item_code)}
          </span>
          <div>
            <p className="text-sm font-black text-brand-foreground">{item.item_label}</p>
            <p className="mt-1 text-xs text-brand-muted">
              Maximum {item.max_points} points
              {item.min_required !== null && item.min_required > 0 ? ` · Minimum required: ${item.min_required}` : ''}
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:w-[380px]">
          {item.response_type === 'boolean' ? (
            <label className="block space-y-1">
              <span className="nmis-label">Available?</span>
              <YesNoToggle value={response.boolean} onChange={boolean => onChange({ ...response, boolean })} />
            </label>
          ) : (
            <label className="block space-y-1">
              <span className="nmis-label">No. Available</span>
              <input
                type="number"
                min="0"
                value={response.number}
                onChange={event => onChange({ ...response, number: event.target.value })}
                className="nmis-control"
                placeholder="Observed headcount"
              />
            </label>
          )}
          <label className="block space-y-1">
            <span className="nmis-label">Score (max {item.max_points})</span>
            <input
              type="number"
              min="0"
              max={item.max_points}
              step="0.01"
              value={response.manual_score}
              onChange={event => handleManualScoreChange(event.target.value)}
              className={`nmis-control ${error ? 'border-status-error ring-2 ring-status-error/10' : ''}`}
              placeholder="Awarded points"
            />
            {error && <span className="text-xs font-bold text-status-error">{error}</span>}
          </label>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <textarea
          rows={2}
          value={response.remark}
          onChange={event => onChange({ ...response, remark: event.target.value })}
          placeholder="Remark or evidence note..."
          className="nmis-control resize-y"
        />
        <div className="min-w-20 text-right">
          <p className="text-lg font-black text-brand-blue">{earned}/{denominator}</p>
          <p className="text-[10px] font-bold uppercase tracking-wide text-brand-muted">points</p>
        </div>
      </div>
    </div>
  );
}

export default function NewInspectionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inspectionRecordId = searchParams.get('inspectionId') || searchParams.get('draftId');
  const requestedProviderId = searchParams.get('providerId');
  const requestedFacilityTypeCode = searchParams.get('facilityType') || 'pharmacy';
  const templateOptionsQuery = useInspectionTemplateOptions();
  const [facilityTypeCode, setFacilityTypeCode] = useState(requestedFacilityTypeCode);
  const selectedFacilityType = useMemo(() => templateOptionsQuery.data?.find(option => option.facility_type.code === facilityTypeCode), [facilityTypeCode, templateOptionsQuery.data]);
  const templateCode = selectedFacilityType?.template?.code || 'pharmacy-accreditation';
  const templateQuery = useInspectionTemplate(templateCode, Boolean(selectedFacilityType?.configured));
  const { providerCategory, providerOwnership } = useMemo(() => {
    // Template codes use both short and hyphenated forms (for example,
    // `dental-centre`), while the provider directory uses canonical enum values.
    // Normalize separators so every configured facility type is strictly scoped.
    const normalizedCode = facilityTypeCode.toLowerCase().replace(/[\s_-]+/g, '');
    const categoryByFacilityType: Record<string, ProviderCategory> = {
      pharmacy: ProviderCategory.Pharmacy,
      hospital: ProviderCategory.Hospital,
      privatehospital: ProviderCategory.Hospital,
      governmenthospital: ProviderCategory.Hospital,
      opticalcentre: ProviderCategory.OpticalCentre,
      dentalcentre: ProviderCategory.DentalCentre,
      diagnosticcentre: ProviderCategory.DiagnosticCentre,
    };

    const ownershipByFacilityType: Record<string, string> = {
      privatehospital: 'Private',
      governmenthospital: 'Government',
    };

    return {
      providerCategory: categoryByFacilityType[normalizedCode],
      providerOwnership: ownershipByFacilityType[normalizedCode] || 'all'
    };
  }, [facilityTypeCode]);
  const [providerSearch, setProviderSearch] = useState('');
  const providerQuery = useProviderDirectory({
    search: providerSearch,
    status: ProviderLifecycleStatus.Active,
    contractStatus: 'all',
    credentialStatus: 'all',
    inspectionStatus: 'all',
    capitationStatus: 'all',
    lga: 'all',
    category: providerCategory || 'all',
    subcategory: 'all',
    ownership: providerOwnership as 'all' | ProviderOwnership,
    service: 'all',
    page: 1,
    pageSize: -1
  });
  const scopedProviders = useMemo(() => {
    const category = providerCategory ? String(providerCategory).trim().toLowerCase() : null;
    const ownership = providerOwnership !== 'all' ? String(providerOwnership).trim().toLowerCase() : null;
    return (providerQuery.data || []).filter(provider => {
      const providerCategoryValue = String(provider.category || '').trim().toLowerCase();
      const providerOwnershipValue = String(provider.ownership || '').trim().toLowerCase();
      return (!category || providerCategoryValue === category) && (!ownership || providerOwnershipValue === ownership);
    });
  }, [providerQuery.data, providerCategory, providerOwnership]);
  const saveMutation = useSaveStructuredInspection();
  const [step, setStep] = useState(0);
  const [inspectionId, setInspectionId] = useState<string | null>(null);
  const [providerId, setProviderId] = useState('');
  const profileQuery = useProviderProfile(providerId);
  const [profile, setProfile] = useState<FacilityProfileState>(EMPTY_PROFILE);
  const [extraProfile, setExtraProfile] = useState<Record<string, string>>({});
  const [eligibility, setEligibility] = useState<Record<string, EligibilityState>>({});
  const [generalRemarks, setGeneralRemarks] = useState('');
  const [responses, setResponses] = useState<Record<string, ResponseState>>({});
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [saveMessage, setSaveMessage] = useState('');
  const [reportProgress, setReportProgress] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [draftLoaded, setDraftLoaded] = useState(false);

  const draftKey = `${DRAFT_KEY}:${facilityTypeCode}:${inspectionId || 'new'}`;
  const template = templateQuery.data;
  const items = template?.items || [];
  const isScoredTemplate = Boolean(template && template.template.passing_threshold > 0);

  useEffect(() => {
    setFacilityTypeCode(requestedFacilityTypeCode);
    setDraftLoaded(false);
    setStep(0);
    setInspectionId(null);
    setProviderId(requestedProviderId || '');
    setProviderSearch('');
    setProfile(EMPTY_PROFILE);
    setExtraProfile({});
    setEligibility({});
    setGeneralRemarks('');
    setResponses({});
    setTeam([]);
    setValidationErrors({});
    setSaveMessage('');
  }, [requestedFacilityTypeCode, requestedProviderId]);

  useEffect(() => {
    if (!selectedFacilityType?.configured || !template || draftLoaded) return;
    if (!inspectionRecordId) {
      setDraftLoaded(true);
      return;
    }

    let cancelled = false;
    setSaveMessage('Loading saved inspection...');
    getStructuredInspection(inspectionRecordId)
      .then((saved: any) => {
        if (cancelled) return;
        if (!saved?.inspection) throw new Error('Saved inspection record was not found.');

        const facility = saved.facility_profile || {};
        const metadata = facility.metadata || {};
        const savedResponses = saved.responses || [];
        const savedEligibility = saved.eligibility || [];
        const savedTeam = saved.team || [];
        const responseState: Record<string, ResponseState> = {};
        template.items.forEach(item => {
          const row = savedResponses.find((entry: any) => entry.item_code === item.item_code);
          responseState[item.item_code] = {
            number: row?.response_number === null || row?.response_number === undefined ? '' : String(row.response_number),
            manual_score: row?.manual_score === null || row?.manual_score === undefined ? '' : String(row.manual_score),
            boolean: row?.response_boolean === null || row?.response_boolean === undefined ? null : Boolean(row.response_boolean),
            remark: row?.remark || '',
          };
        });
        const eligibilityState: Record<string, EligibilityState> = {};
        savedEligibility.forEach((entry: any) => { eligibilityState[entry.criterion_code] = { met: Boolean(entry.met), notes: entry.notes || '' }; });
        const profileData = { ...metadata, ...facility };
        delete profileData.metadata;
        const stepValue = String(saved.inspection.workflow_step || 'eligibility').toLowerCase();
        const workflowLabels = [
          'ELIGIBILITY',
          'FACILITY PROFILE',
          ...Array.from(new Set((template.sections || []).filter(section => !['A', 'ELIGIBILITY', 'PROFILE', 'REMARKS', 'TEAM'].includes(section.section_code.toUpperCase()) && template.items.some(item => item.section_code === section.section_code)).sort((a, b) => a.sort_order - b.sort_order).map(section => section.section_label.toUpperCase()))),
          (template.sections || []).find(section => section.section_code.toUpperCase() === 'REMARKS')?.section_label.toUpperCase() || 'GENERAL REMARKS / RECOMMENDATION',
          'REVIEW & SIGN',
        ];
        const restoredStep = workflowLabels.findIndex(label => {
          const normalized = label.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-');
          return normalized === stepValue || stepValue.includes(normalized) || normalized.includes(stepValue);
        });

        setInspectionId(saved.inspection.id || inspectionRecordId);
        setProviderId(saved.inspection.provider_id || '');
        setProfile({ ...EMPTY_PROFILE, ...profileData });
        setExtraProfile(metadata);
        setEligibility(eligibilityState);
        setGeneralRemarks(metadata.general_remarks || '');
        setResponses(responseState);
        setTeam(savedTeam.map((member: any, index: number) => ({ id: member.id || `saved-team-${index}`, name: member.member_name || member.name || '', role: member.member_role || member.role || 'Inspector', inspection_date: member.inspection_date || profile.inspection_date || new Date().toISOString().slice(0, 10), signature_data: member.signature_data || '' })));
        setStep(restoredStep >= 0 ? restoredStep : 0);
        const savedStatus = String(saved.inspection.status || '').toLowerCase();
        setSaveMessage(savedStatus === 'draft' ? 'Draft loaded. Continue the inspection and submit when ready.' : 'Submitted inspection loaded. Update the evidence and submit again when ready.');
      })
      .catch(error => {
        if (!cancelled) setSaveMessage(error instanceof Error ? error.message : 'Unable to load saved draft.');
      })
      .finally(() => {
        if (!cancelled) setDraftLoaded(true);
      });

    return () => { cancelled = true; };
  }, [inspectionRecordId, selectedFacilityType?.configured, template, draftLoaded]);

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
    localStorage.setItem(draftKey, JSON.stringify({ step, inspectionId, providerId, profile, extraProfile, eligibility, generalRemarks, responses, team, validationErrors }));
  }, [draftKey, template, draftLoaded, step, inspectionId, providerId, profile, extraProfile, eligibility, generalRemarks, responses, team, validationErrors]);

  useEffect(() => {
    if (profileQuery.data) {
      const p = profileQuery.data;
      setProfile(prev => ({
        ...prev,
        address: prev.address || p.address || '',
        telephone: (!prev.telephone || prev.telephone === 'Pending verification') ? p.phone || '' : prev.telephone,
        facility_email: (!prev.facility_email || prev.facility_email === 'Pending verification') ? p.email || '' : prev.facility_email,
        facility_account_name: prev.facility_account_name || p.accountName || '',
        // Auto-fill bank details if available
        bank_name: (prev as any).bank_name || p.bankName || '',
        account_number: (prev as any).account_number || p.accountNumber || '',
      }));
    }
  }, [profileQuery.data]);

  const scoredSections = useMemo(() => (template?.sections || []).filter(section => !['A', 'ELIGIBILITY', 'PROFILE'].includes(section.section_code) && !WORKFLOW_ONLY_SECTION_CODES.has(section.section_code.toUpperCase()) && (template?.items || []).some(item => item.section_code === section.section_code)).sort((a, b) => a.sort_order - b.sort_order), [template]);
  const remarksSection = useMemo(() => (template?.sections || []).find(section => section.section_code.toUpperCase() === 'REMARKS'), [template]);
  const stepLabels = useMemo(() => {
    const labels = [];
    if (isScoredTemplate) labels.push('ELIGIBILITY');
    labels.push('FACILITY PROFILE');
    scoredSections.forEach(s => labels.push(s.section_label.toUpperCase()));
    labels.push(remarksSection?.section_label.toUpperCase() || 'GENERAL REMARKS / RECOMMENDATION');
    labels.push('REVIEW & SIGN');
    return labels;
  }, [isScoredTemplate, remarksSection, scoredSections]);
  const remarksStep = stepLabels.length - 2;
  const reviewStep = stepLabels.length - 1;

  useEffect(() => {
    if (step > reviewStep) setStep(reviewStep);
  }, [reviewStep, step]);

  const selectedProvider = useMemo(() => scopedProviders.find(provider => provider.id === providerId), [providerId, scopedProviders]);
  const allEligibilityMet = template?.eligibility.filter(item => item.required).every(item => eligibility[item.criterion_code]?.met) ?? false;
  const answeredCount = items.filter(item => {
    const response = responses[item.item_code];
    return Boolean(response && isResponseComplete(item, response) && !validationErrors[item.item_code]);
  }).length;
  const signedCount = team.filter(member => Boolean(member.name.trim() && member.signature_data)).length;
  const score = useMemo(() => {
    let points = 0;
    let possible = items.reduce((sum, item) => sum + item.max_points, 0);
    let credentialingPoints = 0;
    let accreditationPoints = 0;
    const credentialingPossible = items.filter(item => isCredentialingSection(item.section_code)).reduce((sum, item) => sum + item.max_points, 0);
    const accreditationPossible = items.filter(item => isAccreditationSection(item.section_code)).reduce((sum, item) => sum + item.max_points, 0);

    items.forEach(item => {
      const response = responses[item.item_code];
      if (!response) return;
      let earned = 0;
      let included = false;
      if (isManualItem(item)) {
        if (!isResponseComplete(item, response) || validationErrors[item.item_code]) return;
        included = true;
        earned = Math.min(Number(response.manual_score), item.max_points);
      } else if (item.response_type === 'number') {
        if (response.number === '') return;
        included = true;
        earned = Number(response.number) >= Number(item.min_required || 0) ? item.max_points : 0;
      } else if (response.boolean !== null) {
        included = Boolean(response.boolean || item.scored_when_no);
        earned = response.boolean ? item.max_points : 0;
      }

      if (!included) return;
      points += earned;
      if (isCredentialingSection(item.section_code)) credentialingPoints += earned;
      if (isAccreditationSection(item.section_code)) accreditationPoints += earned;
    });

    const percentage = possible ? Math.round((points / possible) * 10000) / 100 : 0;
    const recommendation = percentage >= (template?.template.passing_threshold || 75) ? 'Recommended for Accreditation' : percentage >= (template?.template.conditional_threshold || 60) ? 'Conditionally Recommended — Re-inspection Required' : 'Not Recommended for Accreditation';
    return { points, possible, percentage, recommendation, credentialingPoints, credentialingPossible, accreditationPoints, accreditationPossible };
  }, [items, responses, template, validationErrors]);

  const setProfileValue = (key: keyof FacilityProfileState, value: string) => setProfile(previous => ({ ...previous, [key]: value }));
  const setResponse = (itemCode: string, response: ResponseState) => {
    const item = items.find(entry => entry.item_code === itemCode);
    if (item && isManualItem(item)) {
      const rawScore = response.manual_score.trim();
      const parsedScore = rawScore === '' ? null : Number(rawScore);
      if (parsedScore !== null && (!Number.isFinite(parsedScore) || parsedScore < 0 || parsedScore > item.max_points)) {
        setValidationErrors(previous => ({ ...previous, [itemCode]: `Score cannot exceed ${item.max_points} points.` }));
      } else {
        setValidationErrors(previous => { const next = { ...previous }; delete next[itemCode]; return next; });
      }
    }
    setResponses(previous => ({ ...previous, [itemCode]: response }));
  };
  const sectionItems = (sectionCode: string) => items.filter(item => item.section_code === sectionCode);
  const sectionScore = (sectionCode: string) => {
    const section = sectionItems(sectionCode);
    const points = section.reduce((sum, item) => {
      const response = responses[item.item_code];
      if (!response) return sum;
      if (isManualItem(item)) return !isResponseComplete(item, response) || validationErrors[item.item_code] ? sum : sum + Math.min(Number(response.manual_score), item.max_points);
      if (item.response_type === 'number') return response.number === '' ? sum : sum + (Number(response.number) >= Number(item.min_required || 0) ? item.max_points : 0);
      return sum + (response.boolean ? item.max_points : 0);
    }, 0);
    const possible = section.reduce((sum, item) => sum + item.max_points, 0);
    return { points, possible };
  };

  const applyProvider = (id: string) => {
    setProviderId(id);
    const provider = scopedProviders.find(item => item.id === id) as any;
    if (!provider) return;
    setProfile(previous => ({
      ...previous,
      facility_name: provider.providerName || '',
      address: provider.address || provider.facility_address || '',
      telephone: provider.phone || '',
      facility_email: provider.email || '',
      facility_account_name: provider.accountName || '',
      inspection_date: previous.inspection_date || new Date().toISOString().slice(0, 10),
      // Auto-fill additional fields if they exist in the provider record (e.g. from previous inspections)
      bank_name: provider.bankName || '',
      account_number: provider.accountNumber || '',
    }));
    
    // Auto-fill extra profile fields like LGA/District
    setExtraProfile(previous => ({
      ...previous,
      lga_district: provider.lga && provider.senatorialDistrict 
        ? `${provider.lga} / ${provider.senatorialDistrict}` 
        : provider.lga || provider.senatorialDistrict || '',
    }));
  };

    useEffect(() => {
    if (inspectionRecordId || !requestedProviderId || providerId || !scopedProviders.some(provider => provider.id === requestedProviderId)) return;
    applyProvider(requestedProviderId);
  }, [inspectionRecordId, requestedProviderId, providerId, scopedProviders]);

  const buildPayload = (mode: 'draft' | 'submit'): StructuredInspectionPayload => ({
 mode, step: stepLabels[step].toLowerCase().replace(/ & /g, '-').replace(/ /g, '-'), template_code: template?.template.code || 'pharmacy-accreditation', provider_id: providerId, inspection_type: `${selectedFacilityType?.facility_type.name || 'Facility'} Accreditation`, scheduled_date: profile.inspection_date || new Date().toISOString().slice(0, 10), inspector_name: '', facility_profile: { ...profile, ...extraProfile, general_remarks: generalRemarks }, eligibility: template?.eligibility.map(item => ({ criterion_code: item.criterion_code, criterion_label: item.criterion_label, met: Boolean(eligibility[item.criterion_code]?.met), notes: eligibility[item.criterion_code]?.notes || '' })) || [], responses: items.map(item => ({ item_code: item.item_code, response_number: item.response_type === 'number' ? Number(responses[item.item_code]?.number || 0) : null, manual_score: isManualItem(item) ? Number(responses[item.item_code]?.manual_score || 0) : null, response_boolean: item.response_type === 'boolean' ? responses[item.item_code]?.boolean : null, remark: responses[item.item_code]?.remark || '' })), team: team.map(member => ({ name: member.name, role: member.role, inspection_date: member.inspection_date, signature_data: member.signature_data })) });

  const saveDraft = async () => {
    if (!providerId) { setSaveMessage('Select a provider before saving the draft.'); return; }
    if (Object.keys(validationErrors).length) { setSaveMessage('Correct the highlighted manual score errors before saving.'); return; }
    try {
      const result = await saveMutation.mutateAsync({ inspectionId, payload: buildPayload('draft') });
      setInspectionId(result.inspection_id);
      setSaveMessage(`Draft saved - ${result.overall_score}% preview score. You can start a new accreditation or resume this draft from the Drafts list.`);
      navigate('/inspections');
    } catch (error) { setSaveMessage(error instanceof Error ? error.message : 'Unable to save draft.'); }
  };

  const submitInspection = async () => {
    if (!providerId) { setSaveMessage('Select a provider before submission.'); return; }
    if (!template) { setSaveMessage('The inspection template is still loading. Please retry submission.'); return; }
    if (Object.keys(validationErrors).length) { setSaveMessage('Correct the highlighted manual score errors before submission.'); return; }
    const blockers: string[] = [];
    if (!signedCount) blockers.push('Add at least one team member with a name and captured signature.');
    if (blockers.length) {
      setSaveMessage(`Cannot submit yet: ${blockers.join(' ')}`);
      setStep(reviewStep);
      return;
    }

    setSaveMessage('Submitting inspection and preparing the signed PDF outcome...');
    setReportProgress(true);
    try {
      const result = await saveMutation.mutateAsync({ inspectionId, payload: buildPayload('submit') });
      const submittedInspectionId = result.inspection_id;
      setInspectionId(submittedInspectionId);
      const reportFileName = inspectionReportFileName(selectedProvider?.providerName || profile.facility_name, profile.inspection_date);
      const reportBytes = await buildInspectionReportPdf({
        inspectionId: submittedInspectionId,
        providerName: selectedProvider?.providerName || profile.facility_name,
        providerCode: selectedProvider?.providerCode,
        facilityType: selectedFacilityType?.facility_type.name || 'Facility',
        inspectionDate: profile.inspection_date,
        templateName: template.template.name,
        passingThreshold: template.template.passing_threshold,
        conditionalThreshold: template.template.conditional_threshold,
        profile: { ...profile, ...extraProfile },
        eligibility: template.eligibility.map(item => ({ criterion_label: item.criterion_label, met: Boolean(eligibility[item.criterion_code]?.met), notes: eligibility[item.criterion_code]?.notes || '' })),
        items,
        sections: template.sections,
        responses,
        generalRemarks,
        team,
        score: { ...score, percentage: result.overall_score, points: result.total_points, possible: result.total_possible },
      });
      downloadPdf(reportBytes, reportFileName);

      const filePath = reportStoragePath(providerId, submittedInspectionId);
      await providerDocumentsRepository.uploadInspectionReport(filePath, pdfBytesToBlob(reportBytes));
      await providerDocumentsRepository.registerInspectionReport({ providerId, inspectionId: submittedInspectionId, filePath, fileName: reportFileName });

      localStorage.removeItem(`${DRAFT_KEY}:${facilityTypeCode}:${submittedInspectionId}`);
      localStorage.removeItem(`${DRAFT_KEY}:${facilityTypeCode}:new`);
      setSaveMessage('Inspection submitted successfully. The PDF outcome was downloaded and attached to the provider Documents tab.');
      navigate(`/providers/${providerId}?tab=Inspections`);
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : 'Inspection submission or report generation failed.');
    } finally {
      setReportProgress(false);
    }
  };

  if (templateOptionsQuery.isLoading || (selectedFacilityType?.configured && templateQuery.isLoading)) return <main className="nmis-page"><p className="text-brand-muted">Loading inspection facility types and template...</p></main>;
  if (templateOptionsQuery.isError || !selectedFacilityType) return <main className="nmis-page"><ErrorState title="Inspection facility types unavailable" action={{ label: 'Retry', onClick: () => templateOptionsQuery.refetch() }} /></main>;
  if (!selectedFacilityType.configured) return <main className="nmis-page"><div className="space-y-6"><PageHeader eyebrow="Quality & Compliance" title="New facility inspection" subtitle="Select a facility type with a configured checklist to begin." actions={<Button variant="secondary" onClick={() => navigate('/inspections')}><X size={16} /> Exit</Button>} /><Card><h2 className="text-lg font-black text-brand-foreground">{selectedFacilityType.facility_type.name} template not configured</h2><p className="mt-2 text-sm text-brand-secondary">An administrator must configure the {selectedFacilityType.facility_type.name} eligibility gate, facility profile, sections, checklist items, scoring methods, and thresholds before inspectors can start this workflow.</p></Card></div></main>;
  if (templateQuery.isError || !template) return <main className="nmis-page"><ErrorState title="Inspection template unavailable" action={{ label: 'Retry', onClick: () => templateQuery.refetch() }} /></main>;

  return <main className="nmis-page"><div className="space-y-6"><PageHeader eyebrow="ONDO STATE CONTRIBUTORY HEALTH COMMISSION" title={`ACCREDITATION CHECKLIST — ${selectedFacilityType.facility_type.name.toUpperCase()}${selectedFacilityType.facility_type.name.toUpperCase().includes('SERVICES') ? '' : ' SERVICES'}`} subtitle={`Complete the ${selectedFacilityType.facility_type.name.toLowerCase()}${selectedFacilityType.facility_type.name.toLowerCase().includes('services') ? '' : ' services'} accreditation process, capture clinical evidence, and submit a signed recommendation.`} actions={<Button variant="secondary" onClick={() => navigate('/inspections')}><X size={16} /> Exit</Button>} />
    <Card><div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"><label className="block space-y-1.5"><span className="nmis-label">Facility type *</span><select className="nmis-control" value={facilityTypeCode} onChange={event => setFacilityTypeCode(event.target.value)}>{templateOptionsQuery.data?.map(option => <option key={option.facility_type.code} value={option.facility_type.code}>{option.facility_type.name}</option>)}</select></label><div className="rounded-2xl border border-brand-divider bg-brand-soft p-4 text-sm text-brand-secondary"><p className="font-black text-brand-foreground">Active checklist</p><p className="mt-1">{template.template.name} · v{template.template.version}</p></div></div></Card>
    <div className="grid gap-3 md:grid-cols-6">{stepLabels.map((label, index) => <button key={label} type="button" onClick={() => index <= step && setStep(index)} className={`rounded-2xl border p-3 text-left transition ${index === step ? 'border-brand-blue bg-brand-soft shadow-sm' : index < step ? 'border-status-success/30 bg-status-successSoft' : 'border-brand-divider bg-brand-card'}`}><div className="flex items-center gap-2"><span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${index === step ? 'bg-brand-blue text-white' : index < step ? 'bg-status-success text-white' : 'bg-brand-surface text-brand-muted'}`}>{index < step ? <Check size={14} /> : index + 1}</span><span className="text-xs font-black text-brand-foreground">{label}</span></div></button>)}</div>

    {isScoredTemplate && step === 0 && <SectionCard title="ELIGIBILITY CRITERIA" subtitle="Record each criterion as observed. Eligibility findings do not block scored sections or submission."><div className="space-y-4">{template.eligibility.map(item => { const current = eligibility[item.criterion_code] || { met: false, notes: '' }; return <div key={item.criterion_code} className="flex flex-col gap-3 rounded-2xl border border-brand-divider bg-brand-surface p-4 sm:flex-row sm:items-center"><div className="flex flex-1 items-start gap-3"><ShieldCheck size={20} className={current.met ? 'text-status-success' : 'text-brand-muted'} /><div><p className="text-sm font-black text-brand-foreground">{item.criterion_label}{item.required ? ' *' : ''}</p><input value={current.notes} onChange={event => setEligibility(previous => ({ ...previous, [item.criterion_code]: { ...current, notes: event.target.value } }))} placeholder="Optional note or evidence reference" className="nmis-control mt-2" /></div></div><YesNoToggle value={current.met} onChange={met => setEligibility(previous => ({ ...previous, [item.criterion_code]: { ...current, met } }))} /></div>; })}</div><div className={`mt-5 rounded-2xl border p-4 text-sm font-bold ${allEligibilityMet ? 'border-status-success/30 bg-status-successSoft text-status-success' : 'border-status-warning/30 bg-status-warningSoft text-status-warning'}`}>{allEligibilityMet ? 'All required criteria are MET.' : 'One or more criteria are not MET. You may continue; record the finding and supporting evidence for follow-up.'}</div></SectionCard>}

    {step === (isScoredTemplate ? 1 : 0) && <SectionCard title="Section A · FACILITY PROFILE" subtitle="Capture the metadata exactly as observed during the inspection visit."><div className="space-y-5"><div className="space-y-4 md:col-span-2"><div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"><label className="block space-y-1.5"><span className="nmis-label">Search provider directory</span><input className="nmis-control" value={providerSearch} onChange={event => setProviderSearch(event.target.value)} placeholder={`Search ${selectedFacilityType.facility_type.name.toLowerCase()} name, code, or LGA`} /></label><div className="rounded-2xl border border-brand-divider bg-brand-soft p-4"><p className="nmis-label">Directory scope</p><p className="mt-1 text-sm font-black text-brand-foreground">{selectedFacilityType.facility_type.name} providers only</p><p className="mt-1 text-xs text-brand-muted">Showing {scopedProviders.length.toLocaleString()} matching providers</p></div></div><label className="block space-y-1.5"><span className="nmis-label">Provider / Facility *</span><select className="nmis-control" value={providerId} onChange={event => applyProvider(event.target.value)} required disabled={providerQuery.isLoading || providerQuery.isError}><option value="">{providerQuery.isLoading ? `Loading ${selectedFacilityType.facility_type.name.toLowerCase()} providers...` : providerQuery.isError ? 'Provider Directory unavailable' : `Select an authoritative ${selectedFacilityType.facility_type.name.toLowerCase()}`}</option>{scopedProviders.map(provider => <option key={provider.id} value={provider.id}>{provider.providerName} · {provider.providerCode} · {provider.lga}</option>)}</select>{providerQuery.isError ? <span className="text-xs font-bold text-status-error">The provider directory could not be loaded. Retry or refine the search.</span> : scopedProviders.length === 0 ? <span className="text-xs text-brand-muted">No {selectedFacilityType.facility_type.name.toLowerCase()} providers match this search.</span> : null}{selectedProvider && <span className="text-xs text-brand-muted">Selected: {selectedProvider.providerName} · {selectedProvider.providerCode}</span>}</label></div><div className="grid gap-4 md:grid-cols-2">{(() => {
          const pairedTargetKeys = new Set((template.template.facility_profile_fields || []).filter(f => (f as any).pair_with).map(f => (f as any).pair_with));
          return (template.template.facility_profile_fields || []).map(field => {
            if ((field as any).hidden || pairedTargetKeys.has(field.key)) return null;
          if (field.type === 'boolean') {
            const val = Object.prototype.hasOwnProperty.call(EMPTY_PROFILE, field.key) ? (profile as any)[field.key] : extraProfile[field.key];
            const pairedKey = (field as any).pair_with;
            const pairedField = pairedKey ? (template.template.facility_profile_fields || []).find(f => f.key === pairedKey) : null;
            const pairedVal = pairedField ? (Object.prototype.hasOwnProperty.call(EMPTY_PROFILE, pairedField.key) ? (profile as any)[pairedField.key] : extraProfile[pairedField.key]) : '';
            
            return (
              <div key={field.key} className={`space-y-1.5 ${pairedKey ? 'md:col-span-2' : ''}`}>
                <span className="nmis-label">
                  {formatDynamicLabel(field.label, profile.reference_quarter)}
                  {field.required ? ' *' : ''}
                </span>
                <div className="flex flex-wrap items-center gap-4">
                  <YesNoToggle 
                    value={val === 'true' ? true : val === 'false' ? false : null} 
                    onChange={met => Object.prototype.hasOwnProperty.call(EMPTY_PROFILE, field.key) ? setProfileValue(field.key as any, String(met)) : setExtraProfile(prev => ({ ...prev, [field.key]: String(met) }))} 
                  />
                  {pairedField && (
                    <div className="flex flex-1 items-center gap-3 min-w-[240px]">
                      <span className="text-xs font-black text-brand-muted whitespace-nowrap">{pairedField.label}</span>
                      <input 
                        type="text" 
                        value={pairedVal || ''} 
                        onChange={event => Object.prototype.hasOwnProperty.call(EMPTY_PROFILE, pairedField.key) ? setProfileValue(pairedField.key as any, event.target.value) : setExtraProfile(prev => ({ ...prev, [pairedField.key]: event.target.value }))} 
                        className="nmis-control" 
                        placeholder="Enter registration number"
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          }
          const val = Object.prototype.hasOwnProperty.call(EMPTY_PROFILE, field.key) ? (profile as any)[field.key] : extraProfile[field.key];
          const dynamicLabel = formatDynamicLabel(field.label, profile.reference_quarter);
          return <Field key={field.key} label={dynamicLabel} value={val || ''} onChange={value => Object.prototype.hasOwnProperty.call(EMPTY_PROFILE, field.key) ? setProfileValue(field.key as any, value) : setExtraProfile(prev => ({ ...prev, [field.key]: value }))} type={field.type} required={field.required} options={(field as any).options} />;
        });
      })()}</div></div></SectionCard>}

    {step >= (isScoredTemplate ? 2 : 1) && step < remarksStep && scoredSections[step - (isScoredTemplate ? 2 : 1)] && <SectionCard title={scoredSections[step - (isScoredTemplate ? 2 : 1)].section_label} subtitle={scoredSections[step - (isScoredTemplate ? 2 : 1)].description || (isScoredTemplate && step === 2 ? 'Enter the observed headcount and manually award points within each maximum.' : 'Mark each facility requirement and record a concise observation remark.')}><div className="space-y-4">{sectionItems(scoredSections[step - (isScoredTemplate ? 2 : 1)].section_code).map(item => isScoredTemplate ? <ScoredItem key={item.item_code} item={item} error={validationErrors[item.item_code]} response={responses[item.item_code] || blankResponse(item)} onChange={response => setResponse(item.item_code, response)} /> : <QAItem key={item.item_code} item={item} response={responses[item.item_code] || blankResponse(item)} quarter={profile.reference_quarter} onChange={response => setResponse(item.item_code, response)} />)}</div>{isScoredTemplate && <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-divider bg-brand-soft p-4"><div><p className="nmis-label">Section subtotal</p><p className="mt-1 text-sm font-black text-brand-foreground">{sectionScore(scoredSections[step - (isScoredTemplate ? 2 : 1)].section_code).points} / {sectionScore(scoredSections[step - (isScoredTemplate ? 2 : 1)].section_code).possible} points</p></div><p className="text-2xl font-black text-brand-blue">{score.percentage}% overall</p></div>}</SectionCard>}

    {step === remarksStep && <SectionCard title={remarksSection?.section_label || 'GENERAL REMARKS / RECOMMENDATION'} subtitle="Record the inspector's overall findings, risks, conditions, and recommended follow-up actions."><div className="space-y-4"><label className="block space-y-1.5"><span className="nmis-label">General remarks and recommendation</span><textarea rows={8} value={generalRemarks} onChange={event => setGeneralRemarks(event.target.value)} className="nmis-control min-h-40 resize-y" placeholder="Summarise the inspection findings, deficiencies, corrective actions, and any recommendation for ODCHC." /></label>{isScoredTemplate && <div className="grid gap-4 md:grid-cols-3"><div className="rounded-2xl border border-brand-divider bg-brand-soft p-4"><p className="nmis-label">Current overall score</p><p className="mt-1 text-2xl font-black text-brand-blue">{score.percentage}%</p></div><div className="rounded-2xl border border-brand-divider bg-brand-surface p-4"><p className="nmis-label">Included points</p><p className="mt-1 text-2xl font-black text-brand-foreground">{score.points} / {score.possible}</p></div><div className="rounded-2xl border border-brand-divider bg-brand-surface p-4"><p className="nmis-label">Calculated recommendation</p><p className="mt-1 text-sm font-black text-brand-foreground">{score.recommendation}</p></div></div>}</div></SectionCard>}

    {step === reviewStep && template && (
      <div className="space-y-6">
        <SectionCard title="Review & Sign" subtitle="Review the complete inspection record, add the inspection team, and submit the signed recommendation.">
          {isScoredTemplate ? (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-brand-divider bg-brand-soft p-4">
                <p className="nmis-label">Overall score</p>
                <p className="mt-1 text-3xl font-black text-brand-blue">{score.percentage}%</p>
                <p className="text-xs text-brand-muted">{score.points} / {score.possible} total points</p>
              </div>
              <div className="rounded-2xl border border-brand-divider bg-brand-surface p-4">
                <p className="nmis-label">Credentialing Score</p>
                <p className="mt-1 text-2xl font-black text-brand-blue">{score.credentialingPoints} / {score.credentialingPossible}</p>
                <p className="mt-1 text-xs text-brand-muted">Personnel licences, registrations, and qualifications</p>
              </div>
              <div className="rounded-2xl border border-brand-divider bg-brand-surface p-4">
                <p className="nmis-label">Accreditation Score</p>
                <p className="mt-1 text-2xl font-black text-brand-blue">{score.accreditationPoints} / {score.accreditationPossible}</p>
                <p className="mt-1 text-xs text-brand-muted">Infrastructure and Essential Services</p>
              </div>
              <div className="rounded-2xl border border-brand-divider bg-brand-surface p-4 md:col-span-3">
                <p className="nmis-label">Recommendation</p>
                <p className={`mt-2 text-base font-black ${score.percentage >= (template.template.passing_threshold || 75) ? 'text-status-success' : score.percentage >= (template.template.conditional_threshold || 60) ? 'text-status-warning' : 'text-status-danger'}`}>{score.recommendation}</p>
                <p className="mt-1 text-xs text-brand-muted">Thresholds: &gt;= {template.template.passing_threshold}% recommended - {template.template.conditional_threshold}-{Math.max((template.template.passing_threshold || 75) - 1, template.template.conditional_threshold)}% conditional</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-brand-divider bg-brand-soft p-4">
                <p className="nmis-label">Checklist Completion</p>
                <p className="mt-1 text-3xl font-black text-brand-blue">{Math.round((answeredCount / (items.length || 1)) * 100)}%</p>
                <p className="text-xs text-brand-muted">{answeredCount} / {items.length} items recorded</p>
              </div>
              <div className="rounded-2xl border border-brand-divider bg-brand-surface p-4">
                <p className="nmis-label">QA Summary Status</p>
                <p className="mt-1 text-xl font-black text-brand-foreground">Ready for Review</p>
                <p className="mt-1 text-xs text-brand-muted">All sections completed and observations captured.</p>
              </div>
            </div>
          )}
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-brand-divider bg-brand-surface p-4">
              <p className="nmis-label">Eligibility status</p>
              <p className="mt-1 font-black text-brand-foreground">{allEligibilityMet ? 'All required criteria MET' : 'Criteria recorded with follow-up required'}</p>
            </div>
            <div className="rounded-2xl border border-brand-divider bg-brand-surface p-4">
              <p className="nmis-label">Scored responses</p>
              <p className="mt-1 font-black text-brand-foreground">{answeredCount} / {items.length}</p>
            </div>
            <div className="rounded-2xl border border-brand-divider bg-brand-surface p-4">
              <p className="nmis-label">Signed team members</p>
              <p className="mt-1 font-black text-brand-foreground">{signedCount}</p>
            </div>
          </div>
          {generalRemarks && (
            <div className="mt-6 rounded-2xl border border-brand-divider bg-brand-soft p-4">
              <p className="nmis-label">General remarks</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-brand-secondary">{generalRemarks}</p>
            </div>
          )}
        </SectionCard>
        <SectionCard title="Inspection team" subtitle="Add each inspector or reviewer and capture a signature before submission.">
          <div className="space-y-4">
            {team.map((member, index) => (
              <div key={member.id} className="rounded-2xl border border-brand-divider bg-brand-surface p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-brand-foreground">Team member {index + 1}</p>
                  <button type="button" onClick={() => setTeam(previous => previous.filter(item => item.id !== member.id))} className="rounded-control p-2 text-status-danger hover:bg-status-dangerSoft">
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <Field label="Name" value={member.name} onChange={value => setTeam(previous => previous.map(item => item.id === member.id ? { ...item, name: value } : item))} required />
                  <Field label="Role" value={member.role} onChange={value => setTeam(previous => previous.map(item => item.id === member.id ? { ...item, role: value } : item))} />
                  <Field label="Date" value={member.inspection_date} onChange={value => setTeam(previous => previous.map(item => item.id === member.id ? { ...item, inspection_date: value } : item))} type="date" required />
                </div>
                <div className="mt-4">
                  <p className="nmis-label">Signature</p>
                  <SignaturePad value={member.signature_data} onChange={value => setTeam(previous => previous.map(item => item.id === member.id ? { ...item, signature_data: value } : item))} />
                </div>
              </div>
            ))}
            <button type="button" onClick={() => setTeam(previous => [...previous, { id: crypto.randomUUID(), name: '', role: 'Inspector', inspection_date: profile.inspection_date, signature_data: '' }])} className="inline-flex min-h-11 items-center gap-2 rounded-control border border-dashed border-brand-blue px-4 py-2 text-sm font-black text-brand-blue hover:bg-brand-soft">
              <Plus size={16} /> Add inspection team member
            </button>
          </div>
        </SectionCard>
      </div>
    )}

    {saveMessage && <div className="rounded-2xl border border-brand-divider bg-brand-surface p-4 text-sm font-bold text-brand-secondary">{saveMessage}</div>}
    <div className="flex flex-col-reverse gap-3 border-t border-brand-divider pt-5 sm:flex-row sm:items-center sm:justify-between"><Button variant="secondary" onClick={() => setStep(previous => Math.max(0, previous - 1))} disabled={step === 0}><ChevronLeft size={16} /> Back</Button><div className="flex flex-col gap-2 sm:flex-row"><Button variant="secondary" onClick={saveDraft} disabled={saveMutation.isPending || reportProgress}><Save size={16} /> {saveMutation.isPending ? 'Saving...' : 'Save draft'}</Button>{step < stepLabels.length - 1 ? <Button onClick={() => { setSaveMessage(''); setStep(previous => Math.min(stepLabels.length - 1, previous + 1)); }} disabled={reportProgress}><ChevronRight size={16} /> Continue</Button> : <Button onClick={submitInspection} disabled={saveMutation.isPending || reportProgress}><Send size={16} /> {reportProgress ? 'Generating PDF...' : saveMutation.isPending ? 'Submitting...' : 'Submit inspection'}</Button>}</div></div>
  </div></main>;
}
