import { MapPin, Phone, Mail, ShieldCheck, FileText, Activity, Star } from 'lucide-react';
import { ProviderDirectoryItem } from '../../types';
import ProviderStatusBadge, { formatProviderLabel } from '../ProviderStatusBadge';
import ProviderQuickActions from '../ProviderQuickActions';
import Badge from '../../../../components/ui/Badge';
import { getProviderCategoryLabel } from '../../../../constants/providerNetwork';

interface ProviderCardProps {
  provider: ProviderDirectoryItem;
  onSelect: (providerId: string) => void;
}

export default function ProviderCard({ provider, onSelect }: ProviderCardProps) {
  return (
    <div 
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white transition-all hover:border-brand-blue/30 hover:shadow-xl hover:shadow-brand-blue/5"
      onClick={() => onSelect(provider.id)}
    >
      {/* Top Status Bar */}
      <div className="flex items-center justify-between border-b border-slate-50 bg-slate-50/50 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-blue/10 text-[10px] font-black text-brand-blue">
            {provider.providerCode}
          </span>
          <Badge variant="info" className="text-[10px] uppercase tracking-wider">
            {getProviderCategoryLabel(provider.category)}
          </Badge>
        </div>
        <ProviderStatusBadge status={provider.status} />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-black leading-tight text-slate-900 group-hover:text-brand-blue transition-colors">
              {provider.providerName}
            </h3>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              {formatProviderLabel(provider.ownership)}
            </p>
          </div>
          <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
            <ProviderQuickActions providerId={provider.id} status={provider.status} onSelect={onSelect} />
          </div>
        </div>

        {/* Info Grid */}
        <div className="mt-6 grid grid-cols-1 gap-4 border-y border-slate-50 py-5">
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
              <MapPin size={16} />
            </div>
            <span className="truncate">{provider.lga}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
              <Phone size={16} />
            </div>
            <span>{provider.phone || 'No phone supplied'}</span>
          </div>
        </div>

        {/* Operational Badges */}
        <div className="mt-6 flex flex-wrap gap-2">
          <OperationalBadge icon={<ShieldCheck size={12} />} label="Contract" status={provider.contractStatus} />
          <OperationalBadge icon={<FileText size={12} />} label="Credential" status={provider.credentialStatus} />
          <OperationalBadge icon={<Activity size={12} />} label="Capitation" status={provider.capitationStatus} />
        </div>
      </div>

      {/* Footer / Rating */}
      <div className="flex items-center justify-between border-t border-slate-50 px-6 py-4 bg-slate-50/30">
        <div className="flex items-center gap-1.5">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          <span className="text-sm font-bold text-slate-700">{provider.inspectionRating || '0.0'}</span>
          <span className="text-xs text-slate-400">Rating</span>
        </div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Last Insp: {provider.lastInspectionDate || 'Never'}
        </div>
      </div>
    </div>
  );
}

function OperationalBadge({ icon, label, status }: { icon: React.ReactNode; label: string; status: string }) {
  const isSuccess = status === 'active' || status === 'approved' || status === 'verified';
  const isWarning = status === 'pending' || status === 'review';
  
  return (
    <div className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-tight transition-colors ${
      isSuccess ? 'bg-emerald-50 text-emerald-700' : 
      isWarning ? 'bg-amber-50 text-amber-700' : 
      'bg-slate-50 text-slate-500'
    }`}>
      {icon}
      <span>{label}</span>
    </div>
  );
}
