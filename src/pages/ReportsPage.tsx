import { useState, useMemo } from 'react';
import { 
  Download, FileText, PieChart, Users, Calendar, 
  CheckCircle2, Clock, Settings, FileSpreadsheet,
  ArrowUpRight, ShieldCheck, Filter, Search, BarChart3
} from 'lucide-react';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';
import { SectionHeader } from '../components/ui/LayoutComponents';
import * as reportsService from '../services/reports/reportsService';

export default function ReportsPage() {
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<'all' | 'network' | 'financial' | 'quality'>('all');

  const handleDownload = async (id: string, action: () => Promise<any>) => {
    setIsGenerating(id);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Professional delay
      await action();
    } finally {
      setIsGenerating(null);
    }
  };

  const reports = [
    {
      id: 'provider-network',
      category: 'network',
      title: 'Provider Network Registry',
      description: 'Authoritative registry of all accredited healthcare facilities, including detailed classification and compliance tiering.',
      icon: <Users size={20} />,
      type: 'Registry',
      action: () => reportsService.generateProviderReport()
    },
    {
      id: 'inspections',
      category: 'quality',
      title: 'QA & Compliance Audit',
      description: 'Consolidated inspection outcomes with breakdown of Credentialing and Accreditation scores across the network.',
      icon: <CheckCircle2 size={20} />,
      type: 'Audit',
      action: () => reportsService.generateInspectionReport(),
      pdfAction: () => reportsService.generateInspectionPdfReport()
    },
    {
      id: 'financial-summary',
      category: 'financial',
      title: 'Expenditure Summary',
      description: 'Comprehensive financial report covering Claims, Capitation, and Fee-for-Service disbursements for management review.',
      icon: <PieChart size={20} />,
      type: 'Financial',
      action: async () => { alert('Financial report generation initialized.'); }
    },
    {
      id: 'enrolment-demographics',
      category: 'network',
      title: 'Population Demographics',
      description: 'Detailed analysis of beneficiary enrolment across LGAs, age groups, and program types (AMCHIS/ORANGHIS).',
      icon: <Users size={20} />,
      type: 'Demographics',
      action: async () => { alert('Demographic report generation initialized.'); }
    },
  ];

  const filteredReports = useMemo(() => {
    return activeCategory === 'all' 
      ? reports 
      : reports.filter(r => r.category === activeCategory);
  }, [activeCategory]);

  return (
    <main className="nmis-page">
      <PageHeader
        eyebrow="Intelligence & Governance"
        title="Reporting Centre"
        subtitle="Access high-fidelity operational data, financial summaries, and compliance audits with export-ready outputs."
        actions={
          <Button variant="secondary"><Settings size={16} /> Automation Settings</Button>
        }
      />

      {/* Analytics Overview */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="relative overflow-hidden group hover:border-brand-blue/30 transition-all">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted mb-2">Total Reports</p>
          <p className="text-2xl font-black text-brand-foreground">12</p>
          <BarChart3 size={40} className="absolute -right-2 -bottom-2 opacity-5 group-hover:opacity-10 transition-opacity" />
        </Card>
        <Card className="relative overflow-hidden group hover:border-brand-blue/30 transition-all">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted mb-2">Recent Exports</p>
          <p className="text-2xl font-black text-brand-foreground">48</p>
          <Download size={40} className="absolute -right-2 -bottom-2 opacity-5 group-hover:opacity-10 transition-opacity" />
        </Card>
        <Card className="relative overflow-hidden group hover:border-brand-blue/30 transition-all">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted mb-2">Data Freshness</p>
          <p className="text-2xl font-black text-status-success">Real-time</p>
          <Clock size={40} className="absolute -right-2 -bottom-2 opacity-5 group-hover:opacity-10 transition-opacity" />
        </Card>
        <Card className="relative overflow-hidden group hover:border-brand-blue/30 transition-all">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted mb-2">Security Level</p>
          <p className="text-2xl font-black text-brand-blue">Tier 3</p>
          <ShieldCheck size={40} className="absolute -right-2 -bottom-2 opacity-5 group-hover:opacity-10 transition-opacity" />
        </Card>
      </div>

      {/* Filter Hub */}
      <div className="flex items-center justify-between gap-4 py-2">
        <div className="flex gap-2">
          {['all', 'network', 'financial', 'quality'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat as any)}
              className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20' : 'bg-brand-soft text-brand-muted hover:bg-brand-divider'}`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-subtle" size={16} />
          <input type="text" placeholder="Search reports..." className="nmis-control pl-10 h-9 text-xs" />
        </div>
      </div>

      {/* Report Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {filteredReports.map(report => (
          <Card key={report.id} className="group hover:shadow-xl transition-all duration-300 border-l-4 border-l-brand-blue flex flex-col">
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-brand-soft text-brand-blue group-hover:bg-brand-blue group-hover:text-white transition-all">
                    {report.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-brand-foreground group-hover:text-brand-blue transition-colors">{report.title}</h3>
                    <p className="text-[10px] font-bold text-brand-muted uppercase tracking-[0.2em]">{report.type}</p>
                  </div>
                </div>
                <Badge variant="default" className="bg-brand-soft text-brand-blue border-none font-black text-[10px]">VERIFIED</Badge>
              </div>
              <p className="text-sm leading-relaxed text-brand-secondary">{report.description}</p>
            </div>
            
            <div className="mt-8 pt-6 border-t border-brand-divider flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-2 font-black text-[10px] uppercase tracking-widest"
                  onClick={() => handleDownload(report.id, report.action)}
                  disabled={isGenerating !== null}
                >
                  {isGenerating === report.id ? (
                    'Processing...'
                  ) : (
                    <><FileSpreadsheet size={14} /> Export CSV</>
                  )}
                </Button>
                {report.pdfAction && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 font-black text-[10px] uppercase tracking-widest border-brand-divider"
                    onClick={() => handleDownload(`${report.id}-pdf`, report.pdfAction)}
                    disabled={isGenerating !== null}
                  >
                    {isGenerating === `${report.id}-pdf` ? 'Preparing...' : <><FileText size={14} /> PDF Report</>}
                  </Button>
                )}
              </div>
              <button className="text-brand-muted hover:text-brand-blue transition-colors">
                <ArrowUpRight size={18} />
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Automated Schedules Section */}
      <Card className="bg-slate-900 border-none p-8 overflow-hidden relative">
        <div className="relative z-10 grid lg:grid-cols-[1fr_auto] gap-8 items-center">
          <div>
            <div className="flex items-center gap-2 text-brand-orange mb-4">
              <ShieldCheck size={20} />
              <h3 className="text-xs font-black uppercase tracking-[0.3em]">Governance Module</h3>
            </div>
            <h3 className="text-2xl font-black text-white leading-tight">Automated Delivery Protocol</h3>
            <p className="mt-2 text-white/60 max-w-xl text-sm leading-relaxed">
              Configure secure automated delivery of mission-critical reports directly to authorized personnel. 
              Supports encrypted SFTP, secure email dispatch, and portal-integrated notifications.
            </p>
            <div className="mt-8 flex gap-4">
              <Button className="bg-brand-blue hover:bg-brand-blue/90 border-none px-8 font-black text-xs uppercase tracking-widest">
                Configure Protocol
              </Button>
              <Button variant="ghost" className="text-white hover:bg-white/10 px-8 font-black text-xs uppercase tracking-widest">
                View Schedules
              </Button>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="h-40 w-40 rounded-full border-8 border-white/5 flex items-center justify-center relative">
              <div className="h-24 w-24 rounded-full border-4 border-brand-blue/20 flex items-center justify-center animate-pulse">
                <FileText size={40} className="text-brand-blue" />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute -right-20 -top-20 opacity-5 text-white pointer-events-none">
          <Calendar size={400} />
        </div>
      </Card>
    </main>
  );
}
