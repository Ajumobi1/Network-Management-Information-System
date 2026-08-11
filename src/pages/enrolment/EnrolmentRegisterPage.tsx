import { useEffect, useMemo, useState } from 'react';
import { Download, FileText, Filter, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useEnrollee, useEnrollees } from '../../hooks/enrolment';
import { EnrolleeRecord, EnrolmentFilters } from '../../types/enrolment/enrolmentTypes';

type SortField = 'policyNumber' | 'beneficiary' | 'providerName' | 'lga' | 'period';

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
  const pageSize = 15;

  const { data: allRecords = [], isLoading: allLoading } = useEnrollees();
  const filters = useMemo<EnrolmentFilters>(() => ({ search, sector, category, gender, state, lga, senatorialDistrict: district, providerId, period }), [category, district, gender, lga, period, providerId, search, sector, state]);
  const { data: records = [], isLoading } = useEnrollees(filters);
  const { data: selectedRecord } = useEnrollee(selectedId);

  useEffect(() => setPage(1), [search, sector, category, gender, state, lga, district, providerId, period]);

  const options = useMemo(() => ({
    states: unique(allRecords.map(record => record.state)),
    lgas: unique(allRecords.map(record => record.lga)),
    districts: unique(allRecords.map(record => record.senatorialDistrict).filter((value): value is string => Boolean(value))),
    periods: unique(allRecords.map(record => record.period)).sort(),
    providers: Array.from(new Map(allRecords.map(record => [record.providerId || record.providerName, { id: record.providerId || record.providerName, name: record.providerName }])).values()).sort((a, b) => a.name.localeCompare(b.name)),
  }), [allRecords]);

  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => {
      const valueA = sortValue(a, sortField);
      const valueB = sortValue(b, sortField);
      return valueA.localeCompare(valueB) * (sortDirection === 'asc' ? 1 : -1);
    });
  }, [records, sortDirection, sortField]);
  const totalPages = Math.max(1, Math.ceil(sortedRecords.length / pageSize));
  const visibleRecords = sortedRecords.slice((page - 1) * pageSize, page * pageSize);

  const clearFilters = () => {
    setSearch(''); setSector('all'); setCategory('all'); setGender('all'); setState('all'); setLga('all'); setDistrict('all'); setProviderId('all'); setPeriod('all');
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDirection(direction => direction === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection('asc'); }
  };

  const exportCsv = () => {
    if (sortedRecords.length === 0) return;
    const headers = ['Policy Number', 'Category', 'Sector', 'First Name', 'Last Name', 'Gender', 'Phone', 'Facility', 'Provider Code', 'LGA', 'State', 'Senatorial District', 'Period', 'Status'];
    const rows = sortedRecords.map(record => [record.policyNumber, record.category, record.sector, record.firstName, record.lastName, record.gender, record.phoneNumber, record.providerName, record.providerCode, record.lga, record.state, record.senatorialDistrict, record.period, record.recordStatus]);
    const csv = [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `nmis-enrolment-register-${period === 'all' ? 'all-periods' : period}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formalCount = records.filter(record => record.sector === 'formal').length;
  const informalCount = records.filter(record => record.sector === 'informal').length;
  const principalCount = records.filter(record => record.category === 'principal').length;
  const dependantCount = records.filter(record => record.category === 'dependant').length;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="text-xs font-bold uppercase tracking-[0.28em] text-brand-blue">Population &amp; Enrolment</p><h1 className="mt-2 text-2xl font-bold text-slate-900">Enrolment Register</h1><p className="mt-1 text-sm text-slate-500">Search and analyze beneficiary records by policy, facility, LGA, district, sector, category, gender, and reporting period.</p></div>
        <div className="flex flex-wrap gap-3"><Link to="/population/enrolment"><Button variant="secondary">Population overview</Button></Link><Link to="/population/enrolment/upload"><Button>Upload list</Button></Link><Button variant="secondary" onClick={exportCsv} disabled={sortedRecords.length === 0}><Download className="mr-2 h-4 w-4" /> Export CSV</Button></div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"><Summary label="Matching records" value={records.length.toLocaleString()} /><Summary label="Formal" value={formalCount.toLocaleString()} /><Summary label="Informal" value={informalCount.toLocaleString()} /><Summary label="Principals" value={principalCount.toLocaleString()} /><Summary label="Dependants" value={dependantCount.toLocaleString()} /></section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><div><h2 className="font-bold text-slate-900">Register filters</h2><p className="mt-1 text-xs text-slate-500">Sector and category can be applied independently.</p></div><Button variant="secondary" className="flex items-center gap-2 py-2" onClick={clearFilters}><Filter className="h-4 w-4" /> Clear</Button></div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5"><div className="relative sm:col-span-2"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input className="w-full rounded-xl border-slate-200 py-2.5 pl-10 text-sm" placeholder="Search policy, beneficiary, facility, LGA..." value={search} onChange={event => setSearch(event.target.value)} /></div><Select label="Sector" value={sector || 'all'} onChange={value => setSector(value as EnrolmentFilters['sector'])} options={['all', 'formal', 'informal']} /><Select label="Category" value={category || 'all'} onChange={value => setCategory(value as EnrolmentFilters['category'])} options={['all', 'principal', 'dependant']} /><Select label="Gender" value={gender} onChange={setGender} options={['all', 'male', 'female', 'other']} /><Select label="Period" value={period} onChange={setPeriod} options={['all', ...options.periods]} /><Select label="State" value={state} onChange={setState} options={['all', ...options.states]} /><Select label="LGA" value={lga} onChange={setLga} options={['all', ...options.lgas]} /><Select label="Senatorial district" value={district} onChange={setDistrict} options={['all', ...options.districts]} /><label className="space-y-1 text-xs font-semibold text-slate-500"><span>Facility</span><select className="w-full rounded-xl border-slate-200 text-sm font-normal" value={providerId} onChange={event => setProviderId(event.target.value)}><option value="all">All facilities</option>{options.providers.map(provider => <option key={provider.id} value={provider.id}>{provider.name}</option>)}</select></label></div></section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-bold text-slate-900">Normalized beneficiary records</h2><p className="mt-1 text-xs text-slate-500">Showing {visibleRecords.length.toLocaleString()} of {sortedRecords.length.toLocaleString()} matching records.</p></div><div className="flex items-center gap-2 text-xs text-slate-500"><span>Sort by</span><select className="rounded-lg border-slate-200 text-xs" value={sortField} onChange={event => setSortField(event.target.value as SortField)}><option value="policyNumber">Policy number</option><option value="beneficiary">Beneficiary</option><option value="providerName">Facility</option><option value="lga">LGA</option><option value="period">Period</option></select><button type="button" className="rounded-lg border border-slate-200 bg-white px-2 py-1 font-bold" onClick={() => setSortDirection(direction => direction === 'asc' ? 'desc' : 'asc')}>{sortDirection === 'asc' ? 'A–Z' : 'Z–A'}</button></div></div><div className="overflow-x-auto"><table className="w-full min-w-[1250px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><SortableHead label="Policy number" field="policyNumber" active={sortField} onClick={toggleSort} /><SortableHead label="Category" /><SortableHead label="Sector" /><SortableHead label="Beneficiary" field="beneficiary" active={sortField} onClick={toggleSort} /><SortableHead label="Gender" /><SortableHead label="Facility" field="providerName" active={sortField} onClick={toggleSort} /><SortableHead label="LGA" field="lga" active={sortField} onClick={toggleSort} /><SortableHead label="Senatorial district" /><SortableHead label="Period" field="period" active={sortField} onClick={toggleSort} /><SortableHead label="Status" /></tr></thead><tbody className="divide-y divide-slate-100">{isLoading || allLoading ? <LoadingRows /> : visibleRecords.length === 0 ? <EmptyRow /> : visibleRecords.map(record => <RegisterRow key={record.id} record={record} onSelect={() => setSelectedId(record.id)} />)}</tbody></table></div><div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-sm"><p className="text-slate-500">Page {page} of {totalPages}</p><div className="flex gap-2"><Button variant="secondary" className="py-2" disabled={page <= 1} onClick={() => setPage(current => current - 1)}>Previous</Button><Button variant="secondary" className="py-2" disabled={page >= totalPages} onClick={() => setPage(current => current + 1)}>Next</Button></div></div></section>

      {selectedId && <DetailDrawer record={selectedRecord} onClose={() => setSelectedId(null)} />}
    </div>
  );
}

function RegisterRow({ record, onSelect }: { record: EnrolleeRecord; onSelect: () => void }) {
  return <tr className="cursor-pointer hover:bg-blue-50/40" onClick={onSelect}><td className="px-5 py-4 font-mono text-xs font-semibold text-slate-700">{record.policyNumber}</td><td className="px-5 py-4"><Badge variant="info">{record.category}</Badge></td><td className="px-5 py-4"><Badge variant={record.sector === 'formal' ? 'success' : 'warning'}>{record.sector}</Badge></td><td className="px-5 py-4 font-semibold text-slate-900">{record.firstName} {record.lastName}</td><td className="px-5 py-4 capitalize text-slate-600">{record.gender}</td><td className="px-5 py-4"><p className="font-semibold text-slate-800">{record.providerName}</p><p className="text-xs text-slate-500">{record.providerCode || 'Provider code unavailable'}</p></td><td className="px-5 py-4 text-slate-600">{record.lga}</td><td className="px-5 py-4 text-slate-600">{record.senatorialDistrict || 'Not supplied'}</td><td className="px-5 py-4 font-medium text-slate-700">{record.period}</td><td className="px-5 py-4"><Badge variant={record.recordStatus === 'valid' ? 'success' : record.recordStatus === 'duplicate' ? 'warning' : 'error'}>{record.recordStatus}</Badge></td></tr>;
}

function DetailDrawer({ record, onClose }: { record?: EnrolleeRecord; onClose: () => void }) {
  if (!record) return null;
  const items = [['Policy number', record.policyNumber], ['Category', record.category], ['Sector', record.sector], ['Beneficiary', `${record.firstName} ${record.lastName}`], ['Gender', record.gender], ['Phone', record.phoneNumber || 'Not supplied'], ['Facility', record.providerName], ['Provider code', record.providerCode || 'Not supplied'], ['State', record.state], ['LGA', record.lga], ['Senatorial district', record.senatorialDistrict || 'Not supplied'], ['Reporting period', record.period], ['Source file', record.sourceFile], ['Source row', record.sourceRow ? String(record.sourceRow) : 'Not supplied']];
  return <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30" onClick={onClose}><aside className="h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-2xl" onClick={event => event.stopPropagation()}><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-blue">Enrollee detail</p><h2 className="mt-2 text-xl font-bold text-slate-900">{record.firstName} {record.lastName}</h2><p className="mt-1 font-mono text-xs text-slate-500">{record.policyNumber}</p></div><button type="button" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100" onClick={onClose}><X className="h-5 w-5" /></button></div><div className="mt-6 grid gap-3 sm:grid-cols-2">{items.map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50 p-3"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 text-sm font-semibold capitalize text-slate-800">{value}</p></div>)}</div><div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900"><p className="font-bold">Traceability</p><p className="mt-1">Fingerprint: <span className="font-mono text-xs">{record.fingerprint}</span></p><p className="mt-1">Import batch: <span className="font-mono text-xs">{record.importBatchId}</span></p></div></aside></div>;
}

function Summary({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-2 text-xl font-black text-slate-900">{value}</p></div>; }
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) { return <label className="space-y-1 text-xs font-semibold text-slate-500"><span>{label}</span><select className="w-full rounded-xl border-slate-200 text-sm font-normal" value={value} onChange={event => onChange(event.target.value)}>{options.map(option => <option key={option} value={option}>{option === 'all' ? 'All' : option}</option>)}</select></label>; }
function SortableHead({ label, field, active, onClick }: { label: string; field?: SortField; active?: SortField; onClick?: (field: SortField) => void }) { return <th className={`px-5 py-3 ${field ? 'cursor-pointer hover:text-brand-blue' : ''}`} onClick={() => field && onClick?.(field)}>{label}{field && active === field ? ' ↕' : ''}</th>; }
function LoadingRows() { return <tr><td colSpan={10} className="px-5 py-16 text-center text-slate-500">Loading enrolment records...</td></tr>; }
function EmptyRow() { return <tr><td colSpan={10} className="px-5 py-16 text-center"><FileText className="mx-auto h-10 w-10 text-slate-200" /><p className="mt-3 font-semibold text-slate-600">No enrolment records match the current filters.</p><p className="mt-1 text-sm text-slate-400">Adjust the filters or upload a normalized capitation list.</p></td></tr>; }
function unique(values: string[]) { return Array.from(new Set(values.filter(Boolean))).sort(); }
function sortValue(record: EnrolleeRecord, field: SortField) { return field === 'beneficiary' ? `${record.firstName} ${record.lastName}`.toLowerCase() : String(record[field] || '').toLowerCase(); }
function csvCell(value: unknown) { const text = value === undefined || value === null ? '' : String(value); return `"${text.replace(/"/g, '""')}"`; }
