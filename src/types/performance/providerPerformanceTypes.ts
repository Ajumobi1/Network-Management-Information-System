import { ProviderCategory, ProviderOwnership } from '../providers/providerTypes';

export type PerformanceRating = 'Excellent' | 'Good' | 'Satisfactory' | 'Needs Improvement' | 'Critical';

export interface ProviderPerformanceRecord {
  providerId: string;
  providerName: string;
  providerCode: string;
  category: ProviderCategory;
  state: string;
  lga: string;
  ownership: ProviderOwnership;
  compositeScore: number;
  rating: PerformanceRating;
  inspectionScore: number;
  credentialingScore: number;
  complaintScore: number;
  financialScore: number;
  enrolleeDenominator: number;
  attentionFlag: boolean;
  attentionReason: string | null;
  period: string;
  updatedAt: string;
}

export interface PerformanceFilters {
  search: string;
  period: string;
  rating: 'all' | PerformanceRating;
  category: 'all' | ProviderCategory;
  ownership: 'all' | ProviderOwnership;
  state: 'all' | string;
  attentionOnly: boolean;
}

export interface PerformanceSummaryStats {
  totalEvaluated: number;
  averageScore: number;
  ratingDistribution: Record<PerformanceRating, number>;
  attentionCount: number;
  inspectionComplianceRate: number;
  credentialingComplianceRate: number;
}
