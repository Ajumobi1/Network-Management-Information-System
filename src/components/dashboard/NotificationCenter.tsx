import { Bell, AlertOctagon, Info, CheckCircle2 } from 'lucide-react';
import { useNotifications } from '../../hooks/dashboard/dashboardHooks';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import EmptyState from './EmptyState';
import LoadingSkeletons from './LoadingSkeletons';

const iconMap = {
  info: Info,
  warning: AlertOctagon,
  critical: Bell,
};

const badgeMap = {
  info: 'Info',
  warning: 'Warning',
  critical: 'Critical',
};

export default function NotificationCenter() {
  const { data, isLoading } = useNotifications();

  return (
    <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-400">Notification center</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">Alerts and inbox</h2>
        </div>
        <div className="flex flex-wrap gap-3 text-sm text-slate-600">
          <span className="rounded-2xl bg-slate-100 px-3 py-2">Unread {data?.unread ?? 0}</span>
          <span className="rounded-2xl bg-slate-100 px-3 py-2">Alerts {data?.alerts ?? 0}</span>
          <span className="rounded-2xl bg-slate-100 px-3 py-2">Critical {data?.urgent ?? 0}</span>
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeletons rows={3} className="mt-6" />
      ) : data?.items?.length ? (
        <div className="mt-6 space-y-4">
          {data.items.map(item => {
            const Icon = iconMap[item.level as keyof typeof iconMap] ?? CheckCircle2;
            return (
              <div key={item.id} className="flex flex-col gap-4 rounded-[24px] border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-white shadow-sm">
                    <Icon className="h-5 w-5 text-slate-700" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-semibold text-slate-900">{item.title}</p>
                      <Badge variant={item.level === 'critical' ? 'error' : item.level === 'warning' ? 'warning' : 'info'}>
                        {badgeMap[item.level as keyof typeof badgeMap]}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{item.detail}</p>
                  </div>
                </div>
                <Button variant="outline" className="text-sm">Mark read</Button>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No notifications"
          description="Your notification feed is clear. Critical system alerts will appear here for immediate action."
          actionLabel="Recheck alerts"
        />
      )}
    </div>
  );
}
