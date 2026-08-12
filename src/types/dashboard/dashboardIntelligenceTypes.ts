import { EnrolmentSector } from '../enrolment/enrolmentTypes';

export interface DashboardFilters {
  year?: number;
  month?: number;
  state?: string;
  lga?: string;
  facilityType?: string;
  ownership?: string;
  sector?: EnrolmentSector | 'all';
}

export interface DashboardBreakdown {
  name: string;
  value: number;
  secondaryValue?: number;
}

export type DashboardAttentionLevel = 'critical' | 'warning' | 'info';

export interface DashboardAttentionItem {
  id: string;
  level: DashboardAttentionLevel;
  title: string;
  subject: string;
  detail: string;
  href?: string;
}

export interface DashboardActivityItem {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  badge: string;
  href?: string;
}

export interface DashboardFilterOptions {
  years: number[];
  months: number[];
  states: string[];
  lgas: string[];
  facilityTypes: string[];
  ownerships: string[];
}

export interface Dashboard2Intelligence {
  reportingPeriod: string;
  lastUpdatedAt?: string;
  provider: {
    total: number;
    active: number;
    inactive: number;
    byLga: DashboardBreakdown[];
    byFacilityType: DashboardBreakdown[];
    byOwnership: DashboardBreakdown[];
    byLifecycle: DashboardBreakdown[];
  };
  population: {
    total: number;
    formal: number;
    informal: number;
    principal: number;
    dependant: number;
    bySector: DashboardBreakdown[];
    byCategory: DashboardBreakdown[];
    byLga: DashboardBreakdown[];
    topFacilities: DashboardBreakdown[];
    monthlyTrend: DashboardBreakdown[];
    growthPercentage?: number;
  };
  financial: {
    totalExpenditure: number;
    claims: number;
    capitation: number;
    ffs: number;
    byFundingType: DashboardBreakdown[];
    monthlyTrend: DashboardBreakdown[];
    topLgas: DashboardBreakdown[];
    topProviders: DashboardBreakdown[];
    growthPercentage?: number;
  };
  efficiency: {
    networkPepm: number;
    bySector: DashboardBreakdown[];
    byLga: DashboardBreakdown[];
    byProvider: DashboardBreakdown[];
    trend: DashboardBreakdown[];
  };
  managementAttention: DashboardAttentionItem[];
  recentActivity: DashboardActivityItem[];
  filterOptions: DashboardFilterOptions;
  matchedFinancialRecords: number;
  unmatchedProviderCount: number;
}
