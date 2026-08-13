import { MessageSquare, ShieldCheck, ClipboardCheck, AlertCircle, CreditCard, FileText } from 'lucide-react';
import { ProviderTabProps } from '../ProfileTabShell';
import { useCommunications } from '../../../../hooks/communication/communicationHooks';

const iconMap: Record<string, React.ReactNode> = {
  registration: <ShieldCheck className="text-blue-600" size={16} />,
  credentialing: <FileText className="text-indigo-600" size={16} />,
  inspection: <ClipboardCheck className="text-emerald-600" size={16} />,
  complaint: <AlertCircle className="text-rose-600" size={16} />,
  financial: <CreditCard className="text-amber-600" size={16} />,
  communication: <MessageSquare className="text-slate-600" size={16} />,
};

export default function TimelineTab({ provider }: ProviderTabProps) {
  const { data: communications = [] } = useCommunications({
    search: '',
    providerId: provider.id,
    type: 'all',
    status: 'all',
    priority: 'all',
  });

  // Combine static timeline with dynamic communication events
  const timelineEvents = [
    ...provider.timeline.map(item => ({
      id: item.id,
      title: item.title,
      date: item.date,
      actor: item.actor,
      description: item.description,
      type: item.title.toLowerCase().includes('inspection') ? 'inspection' : 
            item.title.toLowerCase().includes('complaint') ? 'complaint' : 
            item.title.toLowerCase().includes('credential') ? 'credentialing' : 'registration'
    })),
    ...communications.map(comm => ({
      id: comm.id,
      title: comm.subject,
      date: new Date(comm.communicationDate).toLocaleDateString(),
      actor: comm.assignedOfficer || 'System',
      description: comm.message,
      type: 'communication'
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
      {timelineEvents.map((event, idx) => (
        <div key={event.id} className="relative flex items-start gap-6 pl-2 group">
          <div className="absolute left-0 mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-sm z-10 group-hover:border-indigo-300 transition-colors">
            {iconMap[event.type] || <MessageSquare size={16} />}
          </div>
          <div className="flex-1 pt-1 ml-10">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-bold text-slate-900">{event.title}</h4>
              <time className="text-[10px] font-black uppercase tracking-widest text-slate-400">{event.date}</time>
            </div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter mb-2">By {event.actor}</p>
            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 text-sm text-slate-600 leading-relaxed">
              {event.description}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
