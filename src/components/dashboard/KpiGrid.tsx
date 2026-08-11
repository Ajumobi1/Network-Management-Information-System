import { ArrowDownRight, ArrowUpRight, Hospital, MessageCircleMore, ClipboardList, ClipboardCheck, Files, FileText, Eye, Microscope, Pill, ShieldCheck, Sparkles, Stethoscope, Users, CircleDollarSign, Clock } from 'lucide-react';
import { useKpiMetrics } from '../../hooks/dashboard/dashboardHooks';
import Badge from '../ui/Badge';

const iconMap = {
  Users: Users,
  ShieldCheck: ShieldCheck,
  BuildingHospital: Hospital,
  HomeHospital: Hospital,
  Pill: Pill,
  Microscope: Microscope,
  Tooth: Eye,
  Eye: Eye,
  Stethoscope: Stethoscope,
  Identification: ShieldCheck,
  DocumentText: FileText,
  DocumentDuplicate: Files,
  ClipboardList: ClipboardList,
  ClipboardChecklist: ClipboardCheck,
  CurrencyNaira: CircleDollarSign,
  Clock: Clock,
  ChatBubbleOvalLeftEllipsis: MessageCircleMore,
  Sparkles: Sparkles,
};

const colorClasses = {
  emerald: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  rose: 'bg-rose-50 text-rose-700',
  sky: 'bg-sky-50 text-sky-700',
  indigo: 'bg-indigo-50 text-indigo-700',
  slate: 'bg-slate-50 text-slate-700',
};

export default function KpiGrid() {
  const { data: metrics = [] } = useKpiMetrics();

  return (
    <section className="grid gap-6 xl:grid-cols-4">
      {metrics.map(metric => {
        const Icon = iconMap[metric.icon as keyof typeof iconMap] ?? Users;
        const trendClass = metric.trend === 'up' ? 'text-emerald-600' : metric.trend === 'down' ? 'text-rose-600' : 'text-slate-600';

        return (
          <div key={metric.id} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-soft transition hover:-translate-y-0.5 hover:shadow-elevated">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-400">{metric.label}</p>
                <p className="mt-4 text-3xl font-semibold text-slate-900">{metric.value}</p>
                <p className="mt-2 text-sm text-slate-500">{metric.subtitle}</p>
              </div>
              <div className={`inline-flex h-14 w-14 items-center justify-center rounded-3xl ${colorClasses[metric.color]}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between gap-4 text-sm">
              <div className={`flex items-center gap-2 font-semibold ${trendClass}`}>
                {metric.trend === 'up' ? <ArrowUpRight className="h-4 w-4" /> : metric.trend === 'down' ? <ArrowDownRight className="h-4 w-4" /> : null}
                <span>{metric.delta}</span>
              </div>
              <Badge variant={metric.color === 'rose' || metric.color === 'amber' ? 'warning' : 'success'}>
                {metric.trend === 'up' ? 'Positive' : metric.trend === 'down' ? 'Risk' : 'Stable'}
              </Badge>
            </div>
          </div>
        );
      })}
    </section>
  );
}
