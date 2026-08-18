import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
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

  // Keep an unfiltered aggregate query available so period choices remain stable
  // when the user applies a year or month filter.
  const periodsQuery = useProviderPopulationSummary(provider.id);
  const filters = useMemo<EnrolmentFilters>(() => ({
    providerId: provider.id,
    year: selectedYear ? Number(selectedYear) : undefined,
    month: selectedMonth ? Number(selectedMonth) : undefined,
  }), [provider.id, selectedYear, selectedMonth]);
  const { data, isLoading, error } = useProviderPopulationSummary(provider.id, filters);

  const availableYears = useMemo(() => {
    const years = new Set(
      (periodsQuery.data?.monthlyTrend ?? [])
        .map(item => String(item.name).slice(0, 4))
        .filter(year => /^20\d{2}$/.test(year)),
    );
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [periodsQuery.data?.monthlyTrend]);

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
        year: selectedYear ? Number(selectedYear) : undefined,
        month: selectedMonth ? Number(selectedMonth) : undefined,
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
      link.download = `nmis-${provider.providerCode || 'provider'}-enrollees-${selectedYear || 'all-years'}-${selectedMonth ? MONTHS[Number(selectedMonth) - 1].toLowerCase() : 'all-months'}.csv`;
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
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Population linkage</p>
          <h3 className="mt-1 text-xl font-bold text-slate-900">Enrolment / Population</h3>
          <p className="mt-1 text-sm text-slate-500">Aggregate population statistics linked to {provider.providerName}.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="info">Provider master: {provider.providerCode}</Badge>
          <Button variant="secondary" size="sm" onClick={handleExport} disabled={isExporting || isLoading || secureUnavailable}>
            <Download className="h-4 w-4" />
            {isExporting ? 'Preparing...' : 'Export enrollees'}
          </Button>
        </div>
      </div>

      <Card className="border-brand-divider bg-brand-surface/40">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label>
            <span className="nmis-label">Reporting year</span>
            <select className="nmis-control" value={selectedYear} onChange={event => setSelectedYear(event.target.value)}>
              <option value="">All years</option>
              {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
            </select>
          </label>
          <label>
            <span className="nmis-label">Reporting month</span>
            <select className="nmis-control" value={selectedMonth} onChange={event => setSelectedMonth(event.target.value)}>
              <option value="">All months</option>
              {MONTHS.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}
            </select>
          </label>
          <div className="flex items-end text-xs text-brand-muted sm:col-span-2">
            {selectedYear || selectedMonth
              ? `Showing ${selectedYear || 'all years'} · ${selectedMonth ? MONTHS[Number(selectedMonth) - 1] : 'all months'}`
              : 'Showing all available reporting periods for this provider.'}
          </div>
        </div>
      </Card>

      {isLoading ? <Card>Loading facility population summary...</Card> : secureUnavailable ? (
        <Card className="border-amber-200 bg-amber-50">
          <p className="font-semibold text-amber-800">Secure population summary unavailable</p>
          <p className="mt-2 text-sm text-amber-700">This account does not have the approved provider population aggregate permission. No raw beneficiary records were loaded.</p>
        </Card>
      ) : error ? (
        <Card className="border-rose-200 bg-rose-50">
          <p className="font-semibold text-rose-800">Population summary could not be loaded</p>
          <p className="mt-2 text-sm text-rose-700">Please retry this provider profile. Existing records were not changed.</p>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Total enrollees" value={summary.total} />
            <Metric label="Formal" value={summary.formal} />
            <Metric label="Informal" value={summary.informal} />
            <Metric label="Principals" value={summary.principals} />
            <Metric label="Dependants" value={summary.dependants} />
            <Metric label="Male" value={summary.male} />
            <Metric label="Female" value={summary.female} />
            <Metric label="Periods" value={monthlyHistory.length} />
          </div>
          {summary.total === 0 && (
            <Card className="border-slate-200 bg-slate-50">
              <p className="font-semibold text-slate-800">No enrollee data for this selection</p>
              <p className="mt-1 text-sm text-slate-600">Try All years and All months, or select another reporting period.</p>
            </Card>
          )}
          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <h4 className="font-bold text-slate-900">Monthly enrolment history</h4>
              {monthlyHistory.length === 0 ? <p className="mt-8 text-center text-sm text-slate-500">No aggregate enrolment history is available for this selection.</p> : <div className="mt-5"><ResponsiveContainer width="100%" height={240}><BarChart data={monthlyHistory}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="period" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip formatter={(value) => [Number(value ?? 0).toLocaleString(), 'Enrollees']} /><Bar dataKey="value" fill="#2563eb" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div>}
            </Card>
            <Card>
              <h4 className="font-bold text-slate-900">Current facility composition</h4>
              <div className="mt-5 space-y-4"><Composition label="Formal" value={summary.formal} total={summary.total} color="bg-brand-blue" /><Composition label="Informal" value={summary.informal} total={summary.total} color="bg-amber-500" /><Composition label="Principals" value={summary.principals} total={summary.total} color="bg-emerald-500" /><Composition label="Dependants" value={summary.dependants} total={summary.total} color="bg-violet-500" /></div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-2 text-xl font-black text-slate-900">{value.toLocaleString()}</p></div>;
}

function Composition({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const percentage = total ? (value / total) * 100 : 0;
  return <div><div className="flex justify-between text-sm"><span className="font-semibold text-slate-700">{label}</span><span className="font-bold text-slate-900">{value.toLocaleString()} ({percentage.toFixed(1)}%)</span></div><div className="mt-2 h-2 rounded-full bg-slate-100"><div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(percentage, value ? 4 : 0)}%` }} /></div></div>;
}
