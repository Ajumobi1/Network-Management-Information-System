import { CalendarDays, Clock3, MapPin } from 'lucide-react';
import { useUpcomingActivities } from '../../hooks/dashboard/dashboardHooks';
import Button from '../ui/Button';
import EmptyState from './EmptyState';
import LoadingSkeletons from './LoadingSkeletons';

export default function UpcomingActivities() {
  const { data: activities, isLoading } = useUpcomingActivities();

  return (
    <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-400">Upcoming activities</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">Schedule and deadlines</h2>
        </div>
        <Button variant="secondary" className="text-sm">View calendar</Button>
      </div>

      {isLoading ? (
        <LoadingSkeletons rows={4} className="mt-6" />
      ) : activities?.length ? (
        <div className="mt-6 space-y-4">
          {activities.map(activity => (
            <div key={activity.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <CalendarDays className="h-4 w-4" />
                    <span>{activity.date}</span>
                    <Clock3 className="h-4 w-4" />
                    <span>{activity.time}</span>
                  </div>
                  <p className="text-base font-semibold text-slate-900">{activity.title}</p>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                    <MapPin className="h-4 w-4" />
                    <span>{activity.location}</span>
                  </div>
                </div>
                <div className="rounded-3xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm">
                  {activity.status}
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-600">Owner: {activity.owner} · Category: {activity.category}</p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No upcoming activities"
          description="All scheduled events are complete. New activities appear as inspections, renewals, and schedules are confirmed."
          actionLabel="Add event"
        />
      )}
    </div>
  );
}
