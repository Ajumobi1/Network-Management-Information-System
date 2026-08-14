import { useEffect, useMemo, useState } from 'react';
import { Download, FileText, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import FilterBar from '../../components/ui/FilterBar';
import Input from '../../components/ui/Input';
import KpiCard from '../../components/ui/KpiCard';
import PageHeader from '../../components/ui/PageHeader';
import { useEnrollee, useEnrollees, useEnrolmentAnalytics } from '../../hooks/enrolment';
import { EnrolleeRecord, EnrolmentFilters } from '../../types/enrolment/enrolmentTypes';
import ActiveFilterChips from '../../components/ui/ActiveFilterChips';
import { isSecureContractError } from '../../lib/security/secureContracts';
import ExportEnrolmentDialog from './ExportEnrolmentDialog';

type SortField = 'policyNumber' | 'beneficiary' | 'providerName' | 'lga' | 'period' | 'gender' | 'category' | 'sector' | 'district';

export default function EnrolmentRegisterPage() {
  const [search, setSearch] = useState('');
  const [sector, setSector] = useState<EnrolmentFilters['sector']>('all');
  const [category, setCategory] = useState<EnrolmentFilters['category']>('all');
  const [gender, setGender] = useState('all');
  const [state, setState] = useState('all');
  const [lga, setLga] = useState('all');
  const [district, setDistrict] = useState('all');
  const [providerId, setProviderId] = useState('all');
  const [period, setPeriod] = useState('all');
  const [sortField, setSortField] = useState<SortField>('policyNumber');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const pageSize = 15;

  const allRecordsQuery = useEnrollees();
  const allRecords = allRecordsQuery.data ?? [];
  const allLoading = allRecordsQuery.isLoading;

  const filters = useMemo<EnrolmentFilters>(() => ({
    search, sector, category, gender, state, lga, senatorialDistrict: district, providerId, period
  }), [category, district, gender, lga, period, providerId, search, sector, state]);

  const analyticsQuery = useEnrolmentAnalytics(filters);
  const analytics = analyticsQuery.data;
  const isAnalyticsLoading = analyticsQuery.isLoading;

  const recordsQuery = useEnrollees({
    ...filters,
    page,
    pageSize,
    sortField,
    sortDirection
  });
  const records = recordsQuery.data ?? [];
  const isLoading = recordsQuery.isLoading;

  const { data: selectedRecord } = useEnrollee(selectedId);
  const secureError = [allRecordsQuery.error, recordsQuery.error, analyticsQuery.error].find(isSecureContractError);

  useEffect(() => setPage(1), [search, sector, category, gender, state, lga, district, providerId, period]);

  const options = useMemo(() => ({
    states: unique(allRecords.map(record => record.state)),
    lgas: unique(allRecords.map(record => record.lga)),
    districts: unique(allRecords.map(record => record.senatorialDistrict).filter((value): value is string => Boolean(value))),
    periods: unique(allRecords.map(record => record.period)).sort(),
    providers: Array.from(new Map(allRecords.map(record => [record.providerId || record.providerName, { id: record.providerId || record.providerName, name: record.providerName }])).values()).sort((a, b) => a.name.localeCompare(b.name)),
  }), [allRecords]);

  const totalMatching = analytics?.totalEnrollees ?? records[0]?.totalCount ?? records.length;
  const totalPages = Math.max(1, Math.ceil(totalMatching / pageSize));

  const clearFilters = () => { setSearch(''); setSector('all'); setCategory('all'); setGender('all'); setState('all'); setLga('all'); setDistrict('all'); setProviderId('all'); setPeriod('all'); };
  const activeFilterChips = [search ? { id: 'search', label: 'Search', value: search } : null, sector !== 'all' ? { id: 'sector', label: 'Sector', value: sector || '' } : null, category !== 'all' ? { id: 'category', label: 'Category', value: category || '' } : null, gender !== 'all' ? { id: 'gender', label: 'Gender', value: gender } : null, state !== 'all' ? { id: 'state', label: 'State', value: state } : null, lga !== 'all' ? { id: 'lga', label: 'LGA', value: lga } : null, district !== 'all' ? { id: 'district', label: 'District', value: district } : null, providerId !== 'all' ? { id: 'providerId', label: 'Facility', value: options.providers.find(provider => provider.id === providerId)?.name || providerId } : null, period !== 'all' ? { id: 'period', label: 'Period', value: period } : null].filter((chip): chip is { id: string; label: string; value: string } => Boolean(chip));
  const removeFilter = (id: string) => { if (id === 'search') setSearch(''); if (id === 'sector') setSector('all'); if (id === 'category') setCategory('all'); if (id === 'gender') setGender('all'); if (id === 'state') setState('all'); if (id === 'lga') setLga('all'); if (id === 'district') setDistrict('all'); if (id === 'providerId') setProviderId('all'); if (id === 'period') setPeriod('all'); };
  const toggleSort = (field: SortField) => { if (sortField === field) setSortDirection(direction => direction === 'asc' ? 'desc' : 'asc'); else { setSortField(field); setSortDirection('asc'); } };

  const openExportDialog = () => setIsExportDialogOpen(true);

  const formalCount = analytics?.formalCount ?? 0;
  const informalCount = analytics?.informalCount ?? 0;
  const principalCount = analytics?.principalCount ?? 0;
  const dependantCount = analytics?.dependantCount ?? 0;

  if (secureError) {
    return <div className="space-y-6"><PageHeader eyebrow="Population & enrolment" title="Enrolment Register" subtitle="Individual beneficiary records require an explicitly approved PII access contract." actions={<><Link to="/population/enrolment"><Button variant="secondary">Population overview</Button></Link><Link to="/population/enrolment/new"><Button>New enrollee</Button></Link><Link to="/population/enrolment/upload"><Button variant="secondary">Upload list</Button></Link></>} /><Card className="border-amber-200 bg-amber-50"><div className="space-y-2 p-5"><p className="font-semibold text-amber-900">Secure access unavailable</p><p className="text-sm text-amber-800">This user does not have an approved browser contract for enrollee register, detail, or export access. No records were loaded.</p><p className="text-xs font-semibold uppercase tracking-wide text-amber-700">{secureError.code}</p></div></Card></div>;
  }

  return <div className="space-y-6">
<PageHeader eyebrow="Population & enrolment" title="Enrolment Register" subtitle="Search and analyze beneficiary records by policy, facility, LGA, district, sector, category, gender, and reporting period." actions={<><Link to="/population/enrolment"><Button variant="secondary">Population overview</Button></Link><Link to="/population/enrolment/new"><Button>New enrollee</Button></Link><Link to="/population/enrolment/upload"><Button variant="secondary">Upload list</Button></Link><Button variant="secondary" onClick={openExportDialog} disabled={totalMatching === 0}><Download className="h-4 w-4" />Export CSV</Button></>} />
	    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard title="Matching records" value={isAnalyticsLoading ? '...' : totalMatching.toLocaleString()} subtitle="Current filter context" tone="primary" />
        <KpiCard title="Formal" value={isAnalyticsLoading ? '...' : formalCount.toLocaleString()} subtitle="/C/ policy sector" tone="success" />
        <KpiCard title="Informal" value={isAnalyticsLoading ? '...' : informalCount.toLocaleString()} subtitle="/D/ policy sector" tone="warning" />
        <KpiCard title="Principals" value={isAnalyticsLoading ? '...' : principalCount.toLocaleString()} subtitle="Source CATEGORY" tone="info" />
        <KpiCard title="Dependants" value={isAnalyticsLoading ? '...' : dependantCount.toLocaleString()} subtitle="Source CATEGORY" tone="neutral" />
      </section>
	    <FilterBar primaryFilters={<><label className="relative min-w-[240px] flex-[2]"><span className="nmis-label">Search records</span><Search className="pointer-events-none absolute left-3 top-[2.35rem] h-4 w-4 text-brand-subtle" /><Input aria-label="Search policy, beneficiary, facility, or LGA" placeholder="Policy, beneficiary, facility, LGA..." value={search} onChange={event => setSearch(event.target.value)} className="pl-9" /></label><Select label="Sector" value={sector || 'all'} onChange={value => setSector(value as EnrolmentFilters['sector'])} options={['all', 'formal', 'informal']} /><Select label="Category" value={category || 'all'} onChange={value => setCategory(value as EnrolmentFilters['category'])} options={['all', 'principal', 'dependant']} /><Select label="Period" value={period} onChange={setPeriod} options={['all', ...options.periods]} /></>} advancedFilters={<><Select label="Gender" value={gender} onChange={setGender} options={['all', 'male', 'female', 'other']} /><Select label="State" value={state} onChange={setState} options={['all', ...options.states]} /><Select label="LGA" value={lga} onChange={setLga} options={['all', ...options.lgas]} /><Select label="Senatorial district" value={district} onChange={setDistrict} options={['all', ...options.districts]} /><label><span className="nmis-label">Facility</span><select className="nmis-control" value={providerId} onChange={event => setProviderId(event.target.value)}><option value="all">All facilities</option>{options.providers.map(provider => <option key={provider.id} value={provider.id}>{provider.name}</option>)}</select></label></>} activeFilters={<ActiveFilterChips chips={activeFilterChips} onRemove={removeFilter} onClear={clearFilters} />} onReset={clearFilters} />
	    <section className="nmis-table-wrap"><div className="flex flex-col gap-3 border-b border-brand-divider bg-brand-surface/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="nmis-section-title">Normalized beneficiary records</h2><p className="nmis-section-subtitle">Showing {records.length.toLocaleString()} of {totalMatching.toLocaleString()} matching records.</p></div><div className="flex items-center gap-2 text-xs text-brand-muted">
  <span>Sort by</span>
  <select
    className="nmis-control min-h-8 py-1.5 text-xs"
    value={sortField}
    onChange={event => setSortField(event.target.value as SortField)}
  >
    <option value="policyNumber">Policy number</option>
    <option value="beneficiary">Beneficiary</option>
    <option value="providerName">Facility</option>
    <option value="lga">LGA</option>
    <option value="district">Senatorial district</option>
    <option value="period">Period</option>
    <option value="gender">Gender</option>
    <option value="category">Category</option>
    <option value="sector">Sector</option>
  </select>
  <button
    type="button"
    className="inline-flex min-w-[3.5rem] items-center justify-center gap-1 rounded-control border border-brand-border bg-brand-card px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-brand-secondary hover:bg-brand-surface transition-colors"
    onClick={() => setSortDirection(direction => direction === 'asc' ? 'desc' : 'asc')}
  >
    {sortDirection === 'asc' ? 'A-Z' : 'Z-A'}
  </button>
</div></div><div className="overflow-x-auto"><table className="nmis-table min-w-[1250px]"><thead><tr><SortableHead label="Policy number" field="policyNumber" active={sortField} onClick={toggleSort} /><SortableHead label="Category" /><SortableHead label="Sector" /><SortableHead label="Beneficiary" field="beneficiary" active={sortField} onClick={toggleSort} /><SortableHead label="Gender" /><SortableHead label="Facility" field="providerName" active={sortField} onClick={toggleSort} /><SortableHead label="LGA" field="lga" active={sortField} onClick={toggleSort} /><SortableHead label="Senatorial district" /><SortableHead label="Period" field="period" active={sortField} onClick={toggleSort} /><SortableHead label="Status" /></tr></thead><tbody>{isLoading || allLoading ? <LoadingRows /> : records.length === 0 ? <EmptyRow /> : records.map(record => <RegisterRow key={record.id} record={record} onSelect={() => setSelectedId(record.id)} />)}</tbody></table></div><div className="flex items-center justify-between border-t border-brand-divider px-5 py-4 text-sm"><p className="text-brand-muted">Page {page} of {totalPages}</p><div className="flex gap-2"><Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(current => current - 1)}>Previous</Button><Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(current => current + 1)}>Next</Button></div></div></section>
    {selectedId && <DetailDrawer record={selectedRecord} onClose={() => setSelectedId(null)} />}
    {isExportDialogOpen && (
      <ExportEnrolmentDialog
        onClose={() => setIsExportDialogOpen(false)}
        currentFilters={filters}
        options={options}
      />
    )}
  </div>;
}

function RegisterRow({ record, onSelect }: { record: EnrolleeRecord; onSelect: () => void }) { return <tr className="cursor-pointer" onClick={onSelect}><td className="font-mono text-xs font-semibold text-brand-secondary">{record.policyNumber}</td><td><Badge variant="info">{record.category}</Badge></td><td><Badge variant={record.sector === 'formal' ? 'success' : 'warning'}>{record.sector}</Badge></td><td className="font-semibold text-brand-foreground">{record.firstName} {record.lastName}</td><td className="capitalize">{record.gender}</td><td><p className="font-semibold text-brand-foreground">{record.providerName}</p><p className="text-xs text-brand-muted">{record.providerCode || 'Provider code unavailable'}</p></td><td>{record.lga}</td><td>{record.senatorialDistrict || 'Not supplied'}</td><td className="font-medium">{record.period}</td><td><Badge variant={record.recordStatus === 'valid' ? 'success' : record.recordStatus === 'duplicate' ? 'warning' : 'error'}>{record.recordStatus}</Badge></td></tr>; }
function DetailDrawer({ record, onClose }: { record?: EnrolleeRecord; onClose: () => void }) { if (!record) return null; const items = [['Policy number', record.policyNumber], ['Category', record.category], ['Sector', record.sector], ['Beneficiary', `${record.firstName} ${record.lastName}`], ['Gender', record.gender], ['Phone', record.phoneNumber || 'Not supplied'], ['Facility', record.providerName], ['Provider code', record.providerCode || 'Not supplied'], ['State', record.state], ['LGA', record.lga], ['Senatorial district', record.senatorialDistrict || 'Not supplied'], ['Reporting period', record.period], ['Source file', record.sourceFile], ['Source row', record.sourceRow ? String(record.sourceRow) : 'Not supplied']]; return <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/35" onClick={onClose}><aside role="dialog" aria-modal="true" aria-label="Enrollee detail" className="h-full w-full max-w-xl overflow-y-auto border-l border-brand-border bg-brand-elevated p-6 shadow-panel" onClick={event => event.stopPropagation()}><div className="flex items-start justify-between gap-4"><div><p className="nmis-eyebrow">Enrollee detail</p><h2 className="mt-2 text-xl font-semibold text-brand-foreground">{record.firstName} {record.lastName}</h2><p className="mt-1 font-mono text-xs text-brand-muted">{record.policyNumber}</p></div><button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-control text-brand-muted hover:bg-brand-surface" onClick={onClose} aria-label="Close enrollee detail"><X className="h-5 w-5" /></button></div><div className="mt-6 grid gap-3 sm:grid-cols-2">{items.map(([label, value]) => <div key={label} className="rounded-control border border-brand-divider bg-brand-surface p-3"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-brand-muted">{label}</p><p className="mt-1 text-sm font-semibold capitalize text-brand-foreground">{value}</p></div>)}</div><div className="mt-5 rounded-control border border-brand-blue/20 bg-brand-soft p-4 text-sm text-brand-secondary"><p className="font-bold text-brand-navy">Traceability</p><p className="mt-1">Fingerprint: <span className="font-mono text-xs">{record.fingerprint}</span></p><p className="mt-1">Import batch: <span className="font-mono text-xs">{record.importBatchId}</span></p></div></aside></div>; }
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) { return <label className="min-w-[140px] flex-1"><span className="nmis-label">{label}</span><select className="nmis-control" value={value} onChange={event => onChange(event.target.value)}>{options.map(option => <option key={option} value={option}>{option === 'all' ? 'All' : option}</option>)}</select></label>; }
function SortableHead({ label, field, active, onClick }: { label: string; field?: SortField; active?: SortField; onClick?: (field: SortField) => void }) { return <th className={field ? 'cursor-pointer hover:text-brand-blue' : ''} onClick={() => field && onClick?.(field)}>{label}{field && active === field ? ' ↕' : ''}</th>; }
function LoadingRows() { return <tr><td colSpan={10} className="px-5 py-16 text-center text-brand-muted">Loading enrolment records...</td></tr>; }
function EmptyRow() { return <tr><td colSpan={10} className="px-5 py-16 text-center"><FileText className="mx-auto h-10 w-10 text-slate-200" /><p className="mt-3 font-semibold text-brand-secondary">No enrolment records match the current filters.</p><p className="mt-1 text-sm text-brand-muted">Adjust the filters or upload a normalized capitation list.</p></td></tr>; }
function unique(values: string[]) { return Array.from(new Set(values.filter(Boolean))).sort(); }
function sortValue(record: EnrolleeRecord, field: SortField) {
  if (field === 'beneficiary') return `${record.firstName} ${record.lastName}`.toLowerCase();
  if (field === 'district') return (record.senatorialDistrict || '').toLowerCase();
  return String(record[field as keyof EnrolleeRecord] || '').toLowerCase();
}
function csvCell(value: unknown) { const text = value === undefined || value === null ? '' : String(value); return `"${text.replace(/"/g, '""')}"`; }
