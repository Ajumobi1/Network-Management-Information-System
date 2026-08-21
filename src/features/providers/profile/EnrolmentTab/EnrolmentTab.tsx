import { useMemo, useState, type ReactNode } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BarChart3, Building2, Calendar, Download, ShieldCheck, UserCheck, UserRound, Users, VenusAndMars } from 'lucide-react';
import Card from '../../../../components/ui/Card';
import Badge from '../../../../components/ui/Badge';
import Button from '../../../../components/ui/Button';
import { useProviderPopulationSummary } from '../../../../hooks/enrolment';
import { enrolmentService } from '../../../../services/enrolment/enrolmentService';
import { EnrolmentFilters } from '../../../../types/enrolment/enrolmentTypes';
import { isSecureContractError } from '../../../../lib/security/secureContracts';
import { ProviderTabProps } from '../ProfileTabShell';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function csvCell(value: unknown): string {
  const text = value === undefined || value === null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export default function EnrolmentTab({ provider }: ProviderTabProps) {
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const periodsQuery = useProviderPopulationSummary(provider.id);
  const availablePeriods = useMemo(() => (periodsQuery.data?.monthlyTrend ?? [])
    .map(item => String(item.name).slice(0, 7))
    .filter(period => /^20\d{2}-\d{2}$/.test(period))
    .sort((a, b) => b.localeCompare(a)), [periodsQuery.data?.monthlyTrend]);
  const availableYears = useMemo(() => Array.from(new Set(availablePeriods.map(period => period.slice(0, 4)))), [availablePeriods]);
  const latestPeriod = availablePeriods[0] ?? '';
  const latestYear = latestPeriod.slice(0, 4);
  const effectiveYear = selectedYear || latestYear;
  const availableMonthsForYear = useMemo(() => Array.from(new Set(
    availablePeriods
      .filter(period => period.slice(0, 4) === effectiveYear)
      .map(period => Number(period.slice(5, 7)))
      .filter(month => month >= 1 && month <= 12),
  )).sort((a, b) => b - a), [availablePeriods, effectiveYear]);
  const latestMonthForYear = availableMonthsForYear[0];
  const effectiveMonth = selectedMonth && availableMonthsForYear.includes(Number(selectedMonth))
    ? Number(selectedMonth)
    : latestMonthForYear;
  const filters = useMemo<EnrolmentFilters>(() => ({
    providerId: provider.id,
    year: effectiveYear ? Number(effectiveYear) : undefined,
    month: effectiveMonth,
  }), [provider.id, effectiveYear, effectiveMonth]);
  const { data, isLoading, error } = useProviderPopulationSummary(provider.id, filters);

  const summary = {
    total: data?.totalEnrollees ?? 0,
    formal: data?.formalCount ?? 0,
    informal: data?.informalCount ?? 0,
    principals: data?.principalCount ?? 0,
    dependants: data?.dependantCount ?? 0,
    male: data?.maleCount ?? 0,
    female: data?.femaleCount ?? 0,
  };
  const monthlyHistory = (data?.monthlyTrend ?? []).map(item => ({ period: item.name, value: item.value }));
  const secureUnavailable = isSecureContractError(error);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const records = await enrolmentService.fetchEnrollees({
        providerId: provider.id,
        year: effectiveYear ? Number(effectiveYear) : undefined,
        month: effectiveMonth,
        page: 1,
        pageSize: 50000,
        sortField: 'period',
        sortDirection: 'desc',
      });

      if (records.length === 0) {
        window.alert('No enrollee records were found for the selected provider and period.');
        return;
      }

      const headers = [
        'Policy Number', 'Category', 'Sector', 'First Name', 'Last Name',
        'Gender', 'Age', 'Phone', 'Facility', 'Provider Code', 'LGA', 'State',
        'Senatorial District', 'Period', 'Status',
      ];
      const rows = records.map(record => [
        record.policyNumber, record.category, record.sector, record.firstName, record.lastName,
        record.gender, record.age, record.phoneNumber, record.providerName, record.providerCode,
        record.lga, record.state, record.senatorialDistrict, record.period, record.recordStatus,
      ]);
      const csv = [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\n');
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `nmis-${provider.providerCode || 'provider'}-enrollees-${effectiveYear || 'latest'}-${effectiveMonth ? MONTHS[effectiveMonth - 1].toLowerCase() : 'latest'}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (exportError) {
      window.alert(isSecureContractError(exportError)
        ? 'Enrollee export is not available for this account under the current access policy.'
        : 'The provider enrollee export could not be generated. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[1.75rem] border border-[#d6e5f0] bg-white shadow-[0_18px_45px_-30px_rgba(11,79,130,0.45)]">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#0b416d] via-[#0b65a1] to-[#f7931e]" />
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#0b4f82] text-white shadow-[0_10px_22px_-12px_rgba(11,79,130,0.9)]">
              <Building2 className="h-7 w-7" strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#0b65a1]">Population linkage</p>
                <span className="h-1 w-1 rounded-full bg-[#f7931e]" />
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">ODCHC ORANGHIS</span>
              </div>
              <h3 className="mt-1 text-xl font-black tracking-tight text-[#123b5d] sm:text-2xl">Enrolment / Population</h3>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">Aggregate population statistics linked to {provider.providerName}.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <Badge variant="info" className="bg-[#eaf4fb] text-[#0b4f82] ring-1 ring-[#c5dfef]">Provider master: {provider.providerCode}</Badge>
            <Button
              variant="primary"
              size="sm"
              className="bg-[#f7931e] text-white shadow-[0_8px_18px_-10px_rgba(247,147,30,0.9)] hover:bg-[#df7d08]"
              onClick={handleExport}
              disabled={isExporting || isLoading || secureUnavailable}
            >
              <Download className="h-4 w-4" />
              {isExporting ? 'Preparing...' : 'Export enrollees'}
            </Button>
          </div>
        </div>
      </section>

      <Card className="overflow-hidden border-[#cfe0ee] bg-white p-0 shadow-[0_14px_35px_-28px_rgba(11,79,130,0.55)]">
        <div className="flex items-center gap-3 bg-[#0b4f82] px-5 py-4 text-white">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15"><Calendar className="h-4.5 w-4.5" /></div>
          <div>
            <p className="text-sm font-black">Reporting context</p>
            <p className="text-xs text-blue-100">Population is shown for the latest available reporting period by default.</p>
          </div>
          <span className="ml-auto hidden h-2 w-2 rounded-full bg-[#f7931e] shadow-[0_0_0_5px_rgba(247,147,30,0.16)] sm:block" />
        </div>
        <div className="grid gap-4 bg-[#f7fbfe] p-5 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.6fr]">
          <label>
            <span className="block text-[10px] font-black uppercase tracking-[0.14em] text-[#55738b]">Reporting year</span>
            <select className="mt-2 w-full rounded-xl border border-[#cfe0ee] bg-white px-3 py-2.5 text-sm font-bold text-[#123b5d] shadow-sm outline-none transition focus:border-[#0b65a1] focus:ring-2 focus:ring-[#0b65a1]/15" value={effectiveYear} onChange={event => { setSelectedYear(event.target.value); setSelectedMonth(''); }} disabled={availableYears.length === 0}>
              {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
            </select>
          </label>
          <label>
            <span className="block text-[10px] font-black uppercase tracking-[0.14em] text-[#55738b]">Reporting month</span>
            <select className="mt-2 w-full rounded-xl border border-[#cfe0ee] bg-white px-3 py-2.5 text-sm font-bold text-[#123b5d] shadow-sm outline-none transition focus:border-[#0b65a1] focus:ring-2 focus:ring-[#0b65a1]/15" value={effectiveMonth ? String(effectiveMonth) : ''} onChange={event => setSelectedMonth(event.target.value)} disabled={availableMonthsForYear.length === 0}>
              {availableMonthsForYear.map(month => <option key={month} value={month}>{MONTHS[month - 1]}</option>)}
            </select>
          </label>
          <div className="flex items-end rounded-xl border border-[#f6d6ad] bg-[#fff8ef] px-4 py-3 text-xs text-[#8a5a1d]">
            <span className="mr-2 mt-0.5 h-2 w-2 shrink-0 rounded-full bg-[#f7931e]" />
            <span>{selectedYear || selectedMonth ? `Showing ${effectiveYear || 'latest year'} · ${effectiveMonth ? MONTHS[effectiveMonth - 1] : 'latest available month'}` : `Showing latest available reporting period${latestPeriod ? `: ${latestPeriod}` : ' for this provider'}.`}</span>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <Card className="border-[#cfe0ee] bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf4fb] text-[#0b65a1]"><BarChart3 className="h-6 w-6 animate-pulse" /></div>
          <p className="mt-4 text-sm font-bold text-[#123b5d]">Loading facility population summary...</p>
          <p className="mt-1 text-xs text-slate-500">Retrieving the approved aggregate reporting contract.</p>
        </Card>
      ) : secureUnavailable ? (
        <Card className="border-[#f6d6ad] bg-[#fff8ef] shadow-sm">
          <div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f7931e]/15 text-[#c36a00]"><ShieldCheck className="h-5 w-5" /></div><div><p className="font-black text-[#8a5a1d]">Secure population summary unavailable</p><p className="mt-1 text-sm leading-6 text-[#9b6b2d]">This account does not have the approved provider population aggregate permission. No raw beneficiary records were loaded.</p></div></div>
        </Card>
      ) : error ? (
        <Card className="border-red-200 bg-red-50 shadow-sm"><p className="font-black text-red-800">Population summary could not be loaded</p><p className="mt-1 text-sm text-red-700">Please retry this provider profile. Existing records were not changed.</p></Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Total enrollees" value={summary.total} icon={<Users />} tone="blue" />
            <Metric label="Formal" value={summary.formal} icon={<ShieldCheck />} tone="navy" />
            <Metric label="Informal" value={summary.informal} icon={<Building2 />} tone="orange" />
            <Metric label="Principals" value={summary.principals} icon={<UserCheck />} tone="sky" />
            <Metric label="Dependants" value={summary.dependants} icon={<Users />} tone="blue" />
            <Metric label="Male" value={summary.male} icon={<UserRound />} tone="navy" />
            <Metric label="Female" value={summary.female} icon={<VenusAndMars />} tone="orange" />
            <Metric label="Periods" value={monthlyHistory.length} icon={<Calendar />} tone="sky" />
          </div>

          {summary.total === 0 && (
            <Card className="border-[#cfe0ee] bg-[#f7fbfe] shadow-sm"><p className="font-black text-[#123b5d]">No enrollee data for this selection</p><p className="mt-1 text-sm text-slate-600">Select another reporting year or month to view a different reporting period.</p></Card>
          )}

          <div className="grid gap-5 lg:grid-cols-2">
            <Card className="overflow-hidden border-[#cfe0ee] bg-white p-0 shadow-[0_14px_35px_-28px_rgba(11,79,130,0.55)]">
              <div className="flex items-center justify-between border-b border-[#e3edf4] px-5 py-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eaf4fb] text-[#0b65a1]"><BarChart3 className="h-4 w-4" /></div><div><h4 className="font-black text-[#123b5d]">Reporting trend</h4><p className="text-xs text-slate-500">Latest selected population period</p></div></div><span className="h-2.5 w-2.5 rounded-full bg-[#f7931e]" /></div>
              <div className="p-5">{monthlyHistory.length === 0 ? <p className="py-12 text-center text-sm text-slate-500">No aggregate enrolment history is available for this selection.</p> : <ResponsiveContainer width="100%" height={240}><BarChart data={monthlyHistory} margin={{ top: 10, right: 8, left: -14, bottom: 0 }}><CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e6eef5" /><XAxis dataKey="period" tick={{ fontSize: 11, fill: '#55738b', fontWeight: 700 }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 11, fill: '#55738b' }} axisLine={false} tickLine={false} /><Tooltip cursor={{ fill: '#f7fbfe' }} contentStyle={{ borderRadius: 12, border: '1px solid #cfe0ee', boxShadow: '0 10px 24px -16px rgba(11,79,130,0.6)' }} formatter={(value) => [Number(value ?? 0).toLocaleString(), 'Enrollees']} /><Bar dataKey="value" fill="#0b65a1" radius={[8, 8, 2, 2]} barSize={56} /></BarChart></ResponsiveContainer>}</div>
            </Card>
            <Card className="overflow-hidden border-[#cfe0ee] bg-white p-0 shadow-[0_14px_35px_-28px_rgba(11,79,130,0.55)]">
              <div className="flex items-center gap-3 border-b border-[#e3edf4] px-5 py-4"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff4e6] text-[#d97908]"><Users className="h-4 w-4" /></div><div><h4 className="font-black text-[#123b5d]">Facility composition</h4><p className="text-xs text-slate-500">Distribution of the selected population</p></div></div>
              <div className="space-y-5 p-5"><Composition label="Formal" value={summary.formal} total={summary.total} color="#0b65a1" /><Composition label="Informal" value={summary.informal} total={summary.total} color="#f7931e" /><Composition label="Principals" value={summary.principals} total={summary.total} color="#0b4f82" /><Composition label="Dependants" value={summary.dependants} total={summary.total} color="#62a8d2" /></div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function Metric({ label, value, icon, tone }: { label: string; value: number; icon: ReactNode; tone: 'blue' | 'navy' | 'orange' | 'sky' }) {
  const tones = {
    blue: { border: 'border-[#cfe0ee]', icon: 'bg-[#eaf4fb] text-[#0b65a1]', accent: 'bg-[#0b65a1]' },
    navy: { border: 'border-[#c7d8e6]', icon: 'bg-[#e9f0f6] text-[#0b4f82]', accent: 'bg-[#0b4f82]' },
    orange: { border: 'border-[#f6d6ad]', icon: 'bg-[#fff4e6] text-[#d97908]', accent: 'bg-[#f7931e]' },
    sky: { border: 'border-[#c9e4f3]', icon: 'bg-[#eef9fe] text-[#3b91bd]', accent: 'bg-[#62a8d2]' },
  }[tone];
  return <div className={`relative overflow-hidden rounded-2xl border bg-white p-4 shadow-[0_12px_30px_-26px_rgba(11,79,130,0.65)] ${tones.border}`}><div className={`absolute inset-x-0 top-0 h-1 ${tones.accent}`} /><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#55738b]">{label}</p><p className="mt-2 text-2xl font-black tracking-tight text-[#123b5d]">{value.toLocaleString()}</p></div><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tones.icon}`}>{icon}</div></div></div>;
}

function Composition({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const percentage = total ? (value / total) * 100 : 0;
  return <div><div className="flex items-center justify-between gap-4 text-sm"><span className="font-bold text-[#36566d]">{label}</span><span className="font-black text-[#123b5d]">{value.toLocaleString()} <span className="font-semibold text-slate-400">({percentage.toFixed(1)}%)</span></span></div><div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#eaf1f6]"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(percentage, value ? 4 : 0))}%`, backgroundColor: color }} /></div></div>;
}
