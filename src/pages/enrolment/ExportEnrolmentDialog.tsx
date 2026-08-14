import React, { useState } from 'react';
import { Download, X, FileSpreadsheet, Filter, Users, Building2, MapPin, Calendar } from 'lucide-react';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import { EnrolmentFilters } from '../../types/enrolment/enrolmentTypes';
import { enrolmentService } from '../../services/enrolment/enrolmentService';

interface ExportEnrolmentDialogProps {
  onClose: () => void;
  currentFilters: EnrolmentFilters;
  options: {
    lgas: string[];
    districts: string[];
    periods: string[];
    providers: Array<{ id: string; name: string }>;
  };
}

type ExportScope = 'current' | 'all' | 'by-lga' | 'by-district' | 'by-provider' | 'by-period';

export default function ExportEnrolmentDialog({ onClose, currentFilters, options }: ExportEnrolmentDialogProps) {
  const [scope, setScope] = useState<ExportScope>('current');
  const [selectedLga, setSelectedLga] = useState('all');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [isExporting, setIsExporting] = useState(false);

  const csvCell = (value: unknown) => { 
    const text = value === undefined || value === null ? '' : String(value); 
    return `"${text.replace(/"/g, '""')}"`; 
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      let exportFilters: EnrolmentFilters = {};

      if (scope === 'current') {
        exportFilters = { ...currentFilters };
      } else if (scope === 'by-lga') {
        exportFilters = { lga: selectedLga };
      } else if (scope === 'by-district') {
        exportFilters = { senatorialDistrict: selectedDistrict };
      } else if (scope === 'by-provider') {
        exportFilters = { providerId: selectedProvider };
      } else if (scope === 'by-period') {
        exportFilters = { period: selectedPeriod };
      }
      // 'all' scope leaves exportFilters empty

      // Fetch all matching records (up to the secure contract limit of 50,000)
      const records = await enrolmentService.fetchEnrollees({
        ...exportFilters,
        page: 1,
        pageSize: 50000,
      });

      if (records.length === 0) {
        alert('No records found for the selected export scope.');
        setIsExporting(false);
        return;
      }

      const headers = [
        'Policy Number', 'Category', 'Sector', 'First Name', 'Last Name', 
        'Gender', 'Phone', 'Facility', 'Provider Code', 'LGA', 'State', 
        'Senatorial District', 'Period', 'Status'
      ];
      
      const rows = records.map(record => [
        record.policyNumber, record.category, record.sector, record.firstName, record.lastName, 
        record.gender, record.phoneNumber, record.providerName, record.providerCode, record.lga, 
        record.state, record.senatorialDistrict, record.period, record.recordStatus
      ]);

      const csv = [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `nmis-enrolment-export-${scope}-${timestamp}.csv`;
      
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export records. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const scopeOptions = [
    { value: 'current', label: 'Current Filtered View', icon: <Filter className="h-4 w-4" /> },
    { value: 'all', label: 'All Enrollees', icon: <Users className="h-4 w-4" /> },
    { value: 'by-lga', label: 'By Local Government (LGA)', icon: <MapPin className="h-4 w-4" /> },
    { value: 'by-district', label: 'By Senatorial District', icon: <MapPin className="h-4 w-4" /> },
    { value: 'by-provider', label: 'By Healthcare Provider', icon: <Building2 className="h-4 w-4" /> },
    { value: 'by-period', label: 'By Reporting Period', icon: <Calendar className="h-4 w-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-brand-border bg-brand-elevated shadow-2xl animate-in fade-in zoom-in duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-brand-divider bg-brand-surface/50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-brand-foreground">Export Enrolment Data</h3>
              <p className="text-xs text-brand-muted">Select the scope of data you wish to export</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="rounded-lg p-2 text-brand-muted hover:bg-brand-surface hover:text-brand-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {scopeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setScope(opt.value as ExportScope)}
                className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all duration-200 ${
                  scope === opt.value 
                    ? 'border-brand-blue bg-brand-blue/5 ring-1 ring-brand-blue' 
                    : 'border-brand-border bg-brand-surface hover:border-brand-muted hover:bg-brand-card'
                }`}
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  scope === opt.value ? 'bg-brand-blue text-white' : 'bg-brand-soft text-brand-secondary'
                }`}>
                  {opt.icon}
                </div>
                <span className={`text-sm font-bold ${scope === opt.value ? 'text-brand-blue' : 'text-brand-secondary'}`}>
                  {opt.label}
                </span>
              </button>
            ))}
          </div>

          <div className="rounded-xl bg-brand-surface border border-brand-divider p-4 space-y-4">
            {scope === 'by-lga' && (
              <Select 
                label="Select LGA" 
                value={selectedLga} 
                onChange={e => setSelectedLga(e.target.value)} 
                options={['all', ...options.lgas].map(l => ({ label: l === 'all' ? 'All LGAs' : l, value: l }))} 
              />
            )}
            {scope === 'by-district' && (
              <Select 
                label="Select Senatorial District" 
                value={selectedDistrict} 
                onChange={e => setSelectedDistrict(e.target.value)} 
                options={['all', ...options.districts].map(d => ({ label: d === 'all' ? 'All Districts' : d, value: d }))} 
              />
            )}
            {scope === 'by-provider' && (
              <Select 
                label="Select Facility" 
                value={selectedProvider} 
                onChange={e => setSelectedProvider(e.target.value)} 
                options={[{ label: 'All Facilities', value: 'all' }, ...options.providers.map(p => ({ label: p.name, value: p.id }))]} 
              />
            )}
            {scope === 'by-period' && (
              <Select 
                label="Select Reporting Period" 
                value={selectedPeriod} 
                onChange={e => setSelectedPeriod(e.target.value)} 
                options={['all', ...options.periods].map(p => ({ label: p === 'all' ? 'All Periods' : p, value: p }))} 
              />
            )}
            {scope === 'current' && (
              <p className="text-xs text-brand-muted italic">
                This will export all records matching your currently active search and filters.
              </p>
            )}
            {scope === 'all' && (
              <p className="text-xs text-brand-muted italic">
                This will export the entire enrolment database (up to 50,000 records).
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-brand-divider bg-brand-surface/50 px-6 py-4">
          <Button variant="secondary" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={isExporting}
            className="min-w-[140px]"
          >
            {isExporting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Preparing...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Generate CSV
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
