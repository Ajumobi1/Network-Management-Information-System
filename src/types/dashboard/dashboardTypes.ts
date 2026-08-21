export type ExecutiveSummary = {
  greeting: string;
  userName: string;
  organization: string;
  dateLabel: string;
  todayFocus: string;
  quickActions: DashboardAction[];
};

export type DashboardAction = {
  label: string;
  icon: string;
  variant?: 'primary' | 'secondary' | 'ghost';
};

export type KpiMetric = {
  id: string;
  label: string;
  value: string;
  delta: string;
  trend: 'up' | 'down' | 'steady';
  color: 'emerald' | 'amber' | 'rose' | 'sky' | 'indigo' | 'slate';
  icon: string;
  subtitle: string;
};

export type DistributionPoint = {
  category: string;
  value: number;
};

export type GrowthPoint = {
  period: string;
  providers: number;
  inspections: number;
  capitation: number;
};

export type CompletionPoint = {
  label: string;
  completed: number;
  pending: number;
};

export type PerformancePoint = {
  metric: string;
  score: number;
};

export type TrendPoint = {
  period: string;
  value: number;
};

export type CoverageLocation = {
  id: string;
  name: string;
  region: string;
  status: 'stable' | 'risk' | 'watch';
  coverage: number;
};

export type DashboardTask = {
  id: string;
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  dueDate: string;
  officer: string;
  category: string;
  status: 'Pending' | 'Urgent' | 'Review' | 'Scheduled';
};

export type ActivityItem = {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  badge: string;
};

export type UpcomingActivity = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  owner: string;
  category: string;
  status: string;
};

export type NotificationSummary = {
  unread: number;
  alerts: number;
  urgent: number;
  items: NotificationItem[];
};

export type NotificationItem = {
  id: string;
  title: string;
  detail: string;
  level: 'info' | 'warning' | 'critical';
};

export type AiInsight = {
  id: string;
  title: string;
  detail: string;
  insight: string;
  badge: string;
};

export type PerformanceGauge = {
  id: string;
  label: string;
  value: number;
  suffix: string;
  description: string;
  color: 'emerald' | 'amber' | 'cyan' | 'rose';
};
