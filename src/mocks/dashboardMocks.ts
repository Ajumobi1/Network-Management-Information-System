import {
  AiInsight,
  ActivityItem,
  CompletionPoint,
  DashboardAction,
  DashboardTask,
  ExecutiveSummary,
  GrowthPoint,
  KpiMetric,
  NotificationSummary,
  PerformanceGauge,
  PerformancePoint,
  TrendPoint,
  CoverageLocation,
  UpcomingActivity,
  DistributionPoint,
} from '../types/dashboard/dashboardTypes';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function getExecutiveSummary(): Promise<ExecutiveSummary> {
  await delay(180);
  return {
    greeting: 'Good morning',
    userName: 'Dr. Amina Bello',
    organization: 'NMIS Health Network',
    dateLabel: new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }),
    todayFocus: '18 provider contracts require review and 8 inspections need approval today.',
    quickActions: [
      { label: 'Add provider', icon: 'PlusCircle', variant: 'primary' },
      { label: 'Schedule inspection', icon: 'CalendarDays', variant: 'secondary' },
      { label: 'Upload capitation', icon: 'CloudArrowUp', variant: 'secondary' },
      { label: 'Generate report', icon: 'DocumentChartBar', variant: 'ghost' },
    ],
  };
}

export async function getKpiMetrics(): Promise<KpiMetric[]> {
  await delay(220);
  return [
    {
      id: 'total-providers',
      label: 'Total providers',
      value: '4,872',
      delta: '+7.4%',
      trend: 'up',
      color: 'indigo',
      icon: 'Users',
      subtitle: 'Across all network facilities',
    },
    {
      id: 'active-providers',
      label: 'Active providers',
      value: '3,960',
      delta: '+3.8%',
      trend: 'up',
      color: 'emerald',
      icon: 'ShieldCheck',
      subtitle: 'Engaged in care delivery today',
    },
    {
      id: 'hospitals',
      label: 'Hospitals',
      value: '612',
      delta: '+1.8%',
      trend: 'up',
      color: 'sky',
      icon: 'BuildingHospital',
      subtitle: 'Licensed acute care sites',
    },
    {
      id: 'phcs',
      label: 'Primary health centres',
      value: '1,118',
      delta: '+2.0%',
      trend: 'up',
      color: 'emerald',
      icon: 'HomeHospital',
      subtitle: 'Community first-response units',
    },
    {
      id: 'pharmacies',
      label: 'Pharmacies',
      value: '842',
      delta: '+0.4%',
      trend: 'up',
      color: 'amber',
      icon: 'Pill',
      subtitle: 'Retail and hospital dispensaries',
    },
    {
      id: 'laboratories',
      label: 'Laboratories',
      value: '354',
      delta: '−1.2%',
      trend: 'down',
      color: 'rose',
      icon: 'Microscope',
      subtitle: 'Diagnostic and reference labs',
    },
    {
      id: 'dental-clinics',
      label: 'Dental clinics',
      value: '232',
      delta: '+0.9%',
      trend: 'up',
      color: 'sky',
      icon: 'Tooth',
      subtitle: 'Oral health service locations',
    },
    {
      id: 'eye-clinics',
      label: 'Eye clinics',
      value: '174',
      delta: '+0.6%',
      trend: 'up',
      color: 'indigo',
      icon: 'Eye',
      subtitle: 'Vision and ophthalmology centers',
    },
    {
      id: 'specialist',
      label: 'Specialist providers',
      value: '519',
      delta: '+5.1%',
      trend: 'up',
      color: 'emerald',
      icon: 'Stethoscope',
      subtitle: 'Cardiology, oncology and more',
    },
    {
      id: 'pending-credentialing',
      label: 'Pending credentialing',
      value: '42',
      delta: '+1.6%',
      trend: 'up',
      color: 'amber',
      icon: 'Identification',
      subtitle: 'Providers awaiting review',
    },
    {
      id: 'expiring-licenses',
      label: 'Expiring licenses',
      value: '37',
      delta: '+9.1%',
      trend: 'up',
      color: 'rose',
      icon: 'DocumentText',
      subtitle: 'Expiring within 30 days',
    },
    {
      id: 'expiring-contracts',
      label: 'Expiring contracts',
      value: '28',
      delta: '+5.7%',
      trend: 'up',
      color: 'amber',
      icon: 'DocumentDuplicate',
      subtitle: 'Contracts closing soon',
    },
    {
      id: 'pending-inspections',
      label: 'Pending inspections',
      value: '18',
      delta: '−4.3%',
      trend: 'down',
      color: 'sky',
      icon: 'ClipboardList',
      subtitle: 'Scheduled for today',
    },
    {
      id: 'pending-complaints',
      label: 'Pending complaints',
      value: '12',
      delta: '+2.9%',
      trend: 'up',
      color: 'rose',
      icon: 'ChatBubbleOvalLeftEllipsis',
      subtitle: 'Awaiting response',
    },
    {
      id: 'monthly-capitation',
      label: 'Monthly capitation amount',
      value: '₦1.82B',
      delta: '+8.4%',
      trend: 'up',
      color: 'indigo',
      icon: 'CurrencyNaira',
      subtitle: 'Net payables this month',
    },
    {
      id: 'todays-activities',
      label: 'Today’s activities',
      value: '52',
      delta: '+6.2%',
      trend: 'up',
      color: 'emerald',
      icon: 'Clock',
      subtitle: 'High-priority interventions',
    },
  ];
}

export async function getProviderDistribution(): Promise<DistributionPoint[]> {
  await delay(150);
  return [
    { category: 'North region', value: 1420 },
    { category: 'South region', value: 1058 },
    { category: 'East region', value: 882 },
    { category: 'West region', value: 735 },
    { category: 'Central region', value: 777 },
  ];
}

export async function getProviderCategories(): Promise<DistributionPoint[]> {
  await delay(150);
  return [
    { category: 'Hospitals', value: 612 },
    { category: 'Primary health centres', value: 1118 },
    { category: 'Pharmacies', value: 842 },
    { category: 'Laboratories', value: 354 },
    { category: 'Specialists', value: 519 },
  ];
}

export async function getMonthlyGrowth(): Promise<GrowthPoint[]> {
  await delay(180);
  return [
    { period: 'Jan', providers: 280, inspections: 125, capitation: 140 },
    { period: 'Feb', providers: 312, inspections: 140, capitation: 165 },
    { period: 'Mar', providers: 333, inspections: 153, capitation: 175 },
    { period: 'Apr', providers: 367, inspections: 160, capitation: 190 },
    { period: 'May', providers: 389, inspections: 177, capitation: 210 },
    { period: 'Jun', providers: 412, inspections: 190, capitation: 230 },
  ];
}

export async function getInspectionCompletion(): Promise<CompletionPoint[]> {
  await delay(150);
  return [
    { label: 'Hospitals', completed: 80, pending: 20 },
    { label: 'PHCs', completed: 72, pending: 28 },
    { label: 'Labs', completed: 88, pending: 12 },
    { label: 'Pharmacies', completed: 65, pending: 35 },
    { label: 'Specialists', completed: 77, pending: 23 },
  ];
}

export async function getPerformanceRating(): Promise<PerformancePoint[]> {
  await delay(140);
  return [
    { metric: 'Timeliness', score: 92 },
    { metric: 'Compliance', score: 86 },
    { metric: 'Quality', score: 78 },
    { metric: 'Safety', score: 84 },
    { metric: 'Satisfaction', score: 88 },
  ];
}

export async function getCapitationTrend(): Promise<TrendPoint[]> {
  await delay(160);
  return [
    { period: 'Jan', value: 125 },
    { period: 'Feb', value: 138 },
    { period: 'Mar', value: 146 },
    { period: 'Apr', value: 153 },
    { period: 'May', value: 169 },
    { period: 'Jun', value: 186 },
  ];
}

export async function getUtilizationTrend(): Promise<TrendPoint[]> {
  await delay(160);
  return [
    { period: 'Jan', value: 68 },
    { period: 'Feb', value: 72 },
    { period: 'Mar', value: 75 },
    { period: 'Apr', value: 78 },
    { period: 'May', value: 82 },
    { period: 'Jun', value: 85 },
  ];
}

export async function getCoverageLocations(): Promise<CoverageLocation[]> {
  await delay(160);
  return [
    { id: 'loc-1', name: 'Kwara Regional Hospital', region: 'North', status: 'stable', coverage: 94 },
    { id: 'loc-2', name: 'Ikeja Primary Health Centre', region: 'South', status: 'watch', coverage: 78 },
    { id: 'loc-3', name: 'Abeokuta Diagnostic Lab', region: 'West', status: 'risk', coverage: 66 },
    { id: 'loc-4', name: 'Port Harcourt Specialist Clinic', region: 'East', status: 'stable', coverage: 88 },
    { id: 'loc-5', name: 'Jos Community Hospital', region: 'Central', status: 'stable', coverage: 91 },
  ];
}

export async function getDashboardTasks(): Promise<DashboardTask[]> {
  await delay(170);
  return [
    {
      id: 'task-1',
      title: 'Review expiring provider contracts',
      priority: 'High',
      dueDate: 'Today',
      officer: 'Nkechi Okafor',
      category: 'Contracts',
      status: 'Urgent',
    },
    {
      id: 'task-2',
      title: 'Validate new credentialing profiles',
      priority: 'Medium',
      dueDate: 'Tomorrow',
      officer: 'Ibrahim Musa',
      category: 'Credentialing',
      status: 'Review',
    },
    {
      id: 'task-3',
      title: 'Authorize site inspection reports',
      priority: 'High',
      dueDate: '2 days',
      officer: 'Joy Ajayi',
      category: 'Inspections',
      status: 'Pending',
    },
    {
      id: 'task-4',
      title: 'Approve capitation payments',
      priority: 'Medium',
      dueDate: '1 week',
      officer: 'Tunde Balogun',
      category: 'Finance',
      status: 'Scheduled',
    },
  ];
}

export async function getDashboardActivities(): Promise<ActivityItem[]> {
  await delay(190);
  return [
    {
      id: 'activity-1',
      timestamp: '2 hours ago',
      title: 'Contract renewal submitted',
      description: 'A central network facility submitted contract renewal documents for review.',
      badge: 'Contracts',
    },
    {
      id: 'activity-2',
      timestamp: '4 hours ago',
      title: 'Inspection scheduled',
      description: 'An inspection team was assigned to a PHC in the East region.',
      badge: 'Inspections',
    },
    {
      id: 'activity-3',
      timestamp: 'Yesterday',
      title: 'Credentialing status updated',
      description: 'Latest provider credentials were moved to in-review by the verification team.',
      badge: 'Credentialing',
    },
    {
      id: 'activity-4',
      timestamp: '2 days ago',
      title: 'Capitation payment approved',
      description: 'A portion of this month’s capitation payables was cleared for disbursement.',
      badge: 'Capitation',
    },
  ];
}

export async function getUpcomingActivities(): Promise<UpcomingActivity[]> {
  await delay(170);
  return [
    {
      id: 'upcoming-1',
      title: 'Regional pharmacy inspection',
      date: 'Aug 10',
      time: '09:00 AM',
      location: 'Lagos',
      owner: 'Ahmed Bello',
      category: 'Inspections',
      status: 'Scheduled',
    },
    {
      id: 'upcoming-2',
      title: 'Provider network review',
      date: 'Aug 12',
      time: '01:30 PM',
      location: 'Abuja',
      owner: 'Chinwe Nwosu',
      category: 'Strategy',
      status: 'Confirmed',
    },
    {
      id: 'upcoming-3',
      title: 'Claims reconciliation',
      date: 'Aug 14',
      time: '11:00 AM',
      location: 'Port Harcourt',
      owner: 'Mary Johnson',
      category: 'Finance',
      status: 'Confirmed',
    },
  ];
}

export async function getDashboardNotifications(): Promise<NotificationSummary> {
  await delay(160);
  return {
    unread: 14,
    alerts: 7,
    urgent: 3,
    items: [
      {
        id: 'notification-1',
        title: 'New provider profile requires approval',
        detail: 'A provider in the South region submitted updated registration documents.',
        level: 'info',
      },
      {
        id: 'notification-2',
        title: 'Contract expiration warning',
        detail: 'Three high-priority contracts expire within 14 days.',
        level: 'warning',
      },
      {
        id: 'notification-3',
        title: 'Inspection report overdue',
        detail: 'One site visit report is pending submission from an active team.',
        level: 'critical',
      },
    ],
  };
}

export async function getAiInsights(): Promise<AiInsight[]> {
  await delay(180);
  return [
    {
      id: 'insight-1',
      title: 'Provider coverage expansion',
      detail: 'Northern clinics show a 14% increase in credentialing throughput.',
      insight: 'Prioritize additional inspection resources in the North region to maintain quality.',
      badge: 'Coverage',
    },
    {
      id: 'insight-2',
      title: 'Capitation cashflow forecast',
      detail: 'Projected reimbursement is trending above budget for the next quarter.',
      insight: 'Review provider payment schedules to optimize liquidity across sites.',
      badge: 'Finance',
    },
    {
      id: 'insight-3',
      title: 'Quality assurance alert',
      detail: 'Laboratory compliance scores dropped 7% since last quarter.',
      insight: 'Schedule targeted audits for underperforming labs before month-end.',
      badge: 'Quality',
    },
  ];
}

export async function getPerformanceGauges(): Promise<PerformanceGauge[]> {
  await delay(150);
  return [
    {
      id: 'gauge-1',
      label: 'Provider satisfaction',
      value: 88,
      suffix: '%',
      description: 'Network satisfaction from recent provider surveys.',
      color: 'emerald',
    },
    {
      id: 'gauge-2',
      label: 'Contract compliance',
      value: 82,
      suffix: '%',
      description: 'Contracts meeting performance benchmarks across the network.',
      color: 'cyan',
    },
    {
      id: 'gauge-3',
      label: 'Inspection success',
      value: 76,
      suffix: '%',
      description: 'Completed inspections that met quality requirements.',
      color: 'amber',
    },
    {
      id: 'gauge-4',
      label: 'Credentialing velocity',
      value: 91,
      suffix: '%',
      description: 'Speed of credentialing completion relative to target.',
      color: 'rose',
    },
  ];
}
