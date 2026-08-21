import { useDashboardTasks } from '../../hooks/dashboard/dashboardHooks';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import EmptyState from './EmptyState';
import LoadingSkeletons from './LoadingSkeletons';

const priorityStyles = {
  High: 'bg-rose-500/10 text-rose-700',
  Medium: 'bg-amber-500/10 text-amber-700',
  Low: 'bg-slate-100 text-slate-700',
};

export default function TaskCenter() {
  const { data: tasks, isLoading } = useDashboardTasks();

  return (
    <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-400">Task center</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">Claims, approvals and inspections</h2>
        </div>
        <Button variant="secondary" className="text-sm">View all tasks</Button>
      </div>

      {isLoading ? (
        <LoadingSkeletons rows={4} className="mt-6" />
      ) : tasks?.length ? (
        <div className="mt-6 space-y-4">
          {tasks.map(task => (
            <div key={task.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={priorityStyles[task.priority]}>{task.priority}</Badge>
                    <span className="text-sm text-slate-600">{task.category}</span>
                  </div>
                  <p className="text-base font-semibold text-slate-900">{task.title}</p>
                  <p className="text-sm text-slate-600">Assigned to {task.officer}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-4 xl:items-center xl:justify-end">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Due</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{task.dueDate}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Status</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{task.status}</p>
                  </div>
                  <Button variant="primary" className="w-full text-sm">View</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No tasks available"
          description="Your task queue is clear. New provider approvals, inspections, and compliance reviews will appear here when available."
          actionLabel="Refresh status"
        />
      )}
    </div>
  );
}
