import { useState } from 'react';
import { Bell, CheckCircle2, AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { useNotifications, useMarkNotificationRead } from '../hooks/notifications/notificationHooks';
import { SystemNotification } from '../types/notifications/notificationTypes';
import { Link } from 'react-router-dom';

const severityIcons: Record<string, React.ReactNode> = {
  info: <Info className="text-blue-600" size={20} />,
  warning: <AlertTriangle className="text-amber-600" size={20} />,
  critical: <ShieldAlert className="text-rose-600" size={20} />,
};

const severityClasses: Record<string, string> = {
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  critical: 'bg-rose-50 border-rose-200 text-rose-800',
};

export default function NotificationsPage() {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const { data: notifications = [], isLoading } = useNotifications(unreadOnly);
  const markReadMutation = useMarkNotificationRead();

  const handleMarkRead = async (id: string) => {
    try {
      await markReadMutation.mutateAsync(id);
    } catch (err: any) {
      alert(err.message || 'Failed to update notification');
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <PageHeader
          title="System notifications & alerts"
          description="Real-time alerts for credential expirations, facility inspection findings, and financial milestone approvals."
          actions={[{
            label: unreadOnly ? 'Show All Notifications' : 'Show Unread Only',
            onClick: () => setUnreadOnly(!unreadOnly),
          }]}
        />

        <div className="rounded-3xl border border-slate-200 bg-white shadow-soft overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="text-indigo-600" size={20} />
              <h2 className="text-lg font-semibold text-slate-900">Alert Center</h2>
            </div>
            <span className="text-xs font-semibold text-slate-500">{notifications.length} notifications</span>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-slate-500">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No active notifications.</div>
          ) : (
            <div className="divide-y divide-slate-200">
              {notifications.map((n: SystemNotification) => (
                <div key={n.id} className={`p-6 flex items-start justify-between gap-4 transition-colors ${n.isRead ? 'bg-white' : 'bg-indigo-50/30'}`}>
                  <div className="flex items-start gap-4">
                    <div className="mt-1 p-2 rounded-2xl bg-white border border-slate-200 shadow-sm">
                      {severityIcons[n.severity]}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{n.title}</h3>
                        <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full border uppercase ${severityClasses[n.severity]}`}>
                          {n.severity}
                        </span>
                        {!n.isRead && (
                          <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-600 text-white">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600">{n.message}</p>
                      <p className="text-xs text-slate-400">{new Date(n.createdAt).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {n.linkUrl && (
                      <Link
                        to={n.linkUrl}
                        className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        View
                      </Link>
                    )}
                    {!n.isRead && (
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 inline-flex items-center gap-1.5"
                      >
                        <CheckCircle2 size={14} /> Mark Read
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
