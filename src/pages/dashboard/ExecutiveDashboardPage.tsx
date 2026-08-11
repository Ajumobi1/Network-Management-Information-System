import ExecutiveHeader from '../../components/dashboard/ExecutiveHeader';
import KpiGrid from '../../components/dashboard/KpiGrid';
import DashboardCharts from '../../components/dashboard/charts/DashboardCharts';
import TaskCenter from '../../components/dashboard/TaskCenter';
import ActivityTimeline from '../../components/dashboard/ActivityTimeline';
import NotificationCenter from '../../components/dashboard/NotificationCenter';
import AiInsightsPanel from '../../components/dashboard/AiInsightsPanel';
import PerformancePanel from '../../components/dashboard/PerformancePanel';
import ProviderCoverageMap from '../../components/dashboard/ProviderCoverageMap';
import UpcomingActivities from '../../components/dashboard/UpcomingActivities';
import ExecutiveSummaryCard from '../../components/dashboard/ExecutiveSummaryCard';
import QuickActionCards from '../../components/dashboard/QuickActionCards';
import PopulationSnapshotPanel from '../../components/dashboard/PopulationSnapshotPanel';

export default function ExecutiveDashboardPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <ExecutiveHeader />
        <KpiGrid />
        <PopulationSnapshotPanel />

        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
          <DashboardCharts />
          <div className="space-y-6">
            <ExecutiveSummaryCard />
            <NotificationCenter />
            <QuickActionCards />
          </div>
        </div>

        <ProviderCoverageMap />

        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="space-y-6">
            <TaskCenter />
            <ActivityTimeline />
            <UpcomingActivities />
          </div>
          <div className="space-y-6">
            <AiInsightsPanel />
            <PerformancePanel />
          </div>
        </div>
      </div>
    </main>
  );
}
