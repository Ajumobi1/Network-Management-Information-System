import React, { useState } from 'react';
import { Download, FileText, PieChart, Users, Calendar, CheckCircle2, Clock, Settings } from 'lucide-react';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';
import { SectionHeader } from '../components/ui/LayoutComponents';
import * as reportsService from '../services/reports/reportsService';

export default function ReportsPage() {
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  const handleDownload = async (id: string, action: () => Promise<any>) => {
    setIsGenerating(id);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate generation delay
      await action();
    } finally {
      setIsGenerating(null);
    }
  };

  const reports = [
    {
      id: 'provider-network',
      title: 'Provider Network Report',
      description: 'Comprehensive registry of all healthcare facilities, including classification and current compliance status.',
      icon: <Users size={20} className="text-brand-blue" />,
      action: () => reportsService.generateProviderReport()
    },
    {
      id: 'inspections',
      title: 'Inspection & Compliance',
      description: 'Historical and scheduled inspection records with quality scores and follow-up requirements.',
      icon: <CheckCircle2 size={20} className="text-status-success" />,
      action: () => reportsService.generateInspectionReport()
    },
    {
      id: 'financial-summary',
      title: 'Financial Summary',
      description: 'Consolidated view of Claims, Capitation, and FFS expenditure across reporting periods.',
      icon: <PieChart size={20} className="text-brand-secondary" />,
      action: async () => { alert('Financial report generation planned.'); }
    },
  ];

  const templates: any[] = [];

  return (
    <main className="nmis-page">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Analytics & Reports"
          title="Reporting Centre"
          subtitle="Generate operational, financial, and provider reports with export-ready output for management review."
          actions={<Button disabled className="gap-2"><Settings size={16} /> Manage Automations (Soon)</Button>}
        />

        <div className="grid gap-6 md:grid-cols-3">
          {reports.map(report => (
            <Card key={report.id} className="flex flex-col">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-brand-surface border border-brand-divider">
                    {report.icon}
                  </div>
                  <Badge variant="default" className="text-[10px] uppercase">Standard</Badge>
                </div>
                <h2 className="text-lg font-black text-brand-foreground">{report.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-brand-secondary">{report.description}</p>
              </div>
              <div className="mt-8 pt-6 border-t border-brand-divider">
                <Button
                  variant="secondary"
                  className="w-full gap-2"
                  onClick={() => handleDownload(report.id, report.action)}
                  disabled={isGenerating !== null}
                >
                  {isGenerating === report.id ? (
                    <>Generating...</>
                  ) : (
                    <><Download size={16} /> Download CSV</>
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <SectionHeader title="Saved Report Templates" subtitle="Pre-defined report configurations for recurring operational reviews." />
            <Button variant="secondary" size="sm" disabled>New Template (Soon)</Button>
          </div>

          <div className="mt-6">
            {templates.length === 0 ? (
              <div className="p-12 text-center text-slate-500 font-medium bg-brand-surface rounded-control border border-dashed border-brand-divider">
                No saved templates found.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {templates.map(item => (
                  <div key={item.name} className="flex items-center justify-between p-4 rounded-control border border-brand-divider bg-brand-surface hover:border-brand-blue/30 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-brand-soft text-brand-blue">
                        <FileText size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-brand-foreground group-hover:text-brand-blue transition-colors">{item.name}</p>
                        <div className="mt-1 flex items-center gap-3">
                          <span className="text-[10px] font-bold uppercase text-brand-muted flex items-center gap-1">
                            <Clock size={10} /> {item.lastUsed}
                          </span>
                          <Badge variant={item.status === 'Active' ? 'success' : 'default'} size="sm">{item.status}</Badge>
                        </div>
                      </div>
                    </div>
                    <button className="text-brand-muted hover:text-brand-blue transition-colors"><Settings size={14} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card className="bg-brand-navy border-brand-navy p-8 overflow-hidden relative">
          <div className="relative z-10">
            <h3 className="text-xl font-black text-white uppercase tracking-wider">Scheduled Reports</h3>
            <p className="mt-2 text-brand-subtle max-w-xl">
              Automate your reporting workflow. Configure reports to be delivered to your email or a shared workspace on a daily, weekly, or monthly basis.
            </p>
            <Button className="mt-6 bg-white text-brand-navy hover:bg-brand-surface border-none" disabled>
              Configure Schedule (Coming Soon)
            </Button>
          </div>
          <div className="absolute -right-12 -bottom-12 opacity-10 text-white rotate-12 pointer-events-none">
            <Calendar size={240} />
          </div>
        </Card>
      </div>
    </main>
  );
}
