import { useMockData, fetchTable } from '../common';
import { getInspectionsMock } from '../../mocks/inspectionsMocks';
import { providerDirectory } from '../../mocks/providersMocks';
import { getProviderDirectory } from '../providers/providersRepository';

export interface PerformanceStats {
  averageScore: number;
  aboveTargetCount: number;
  underperformingCount: number;
  totalMonitored: number;
}

export interface ProviderPerformance {
  providerId: string;
  providerName: string;
  providerCode: string;
  score: number;
  compliance: number;
  rating: string;
  lastInspection: string;
  trend: 'up' | 'down' | 'stable';
}

export async function getPerformanceStats(): Promise<PerformanceStats> {
  if (!useMockData) {
    try {
      const inspections = await fetchTable<any>('inspections');
      const providers = await getProviderDirectory({ pageSize: -1 });
      const completed = inspections.filter(i => (i.status === 'completed' || i.status === 'submitted') && i.overall_score !== null);
      const scores = completed.map(i => i.overall_score as number);
      const average = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      const aboveTarget = scores.filter(s => s >= 75).length;
      const underperforming = scores.filter(s => s < 60).length;

      return {
        averageScore: average,
        aboveTargetCount: aboveTarget,
        underperformingCount: underperforming,
        totalMonitored: providers.length
      };
    } catch (error) {
      throw error instanceof Error ? error : new Error('Performance statistics could not be loaded.');
    }
  }

  const inspections = await getInspectionsMock();
  const completed = inspections.filter(i => i.status === 'completed' && i.score !== null);
  const scores = completed.map(i => i.score as number);
  const average = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const aboveTarget = scores.filter(s => s >= 85).length;
  const underperforming = scores.filter(s => s < 70).length;

  return {
    averageScore: average,
    aboveTargetCount: aboveTarget,
    underperformingCount: underperforming,
    totalMonitored: providerDirectory.length
  };
}

export async function getProviderRankings(): Promise<ProviderPerformance[]> {
  if (!useMockData) {
    try {
      const inspections = await fetchTable<any>('inspections');
      const completed = inspections.filter(i => i.status === 'completed' || i.status === 'submitted');

      return completed.map(i => ({
        providerId: i.provider_id,
        providerName: i.provider_name,
        providerCode: i.provider_code,
        score: i.overall_score || 0,
        compliance: (i.overall_score || 0),
        rating: i.overall_score >= 75 ? 'Excellent' : i.overall_score >= 60 ? 'Good' : 'Poor',
        lastInspection: i.updated_at || i.created_at,
        trend: 'stable' as const
      })).sort((a, b) => b.score - a.score);
    } catch (error) {
      throw error instanceof Error ? error : new Error('Provider rankings could not be loaded.');
    }
  }

  const inspections = await getInspectionsMock();
  const completed = inspections.filter(i => i.status === 'completed');

  return completed.map(i => ({
    providerId: i.providerId,
    providerName: i.providerName,
    providerCode: i.providerCode,
    score: i.score || 0,
    compliance: (i.score || 0) - 2,
    rating: i.rating || 'N/A',
    lastInspection: i.completedAt || i.scheduledAt,
    trend: ((i.score || 0) >= 90 ? 'up' : (i.score || 0) <= 75 ? 'down' : 'stable') as 'up' | 'down' | 'stable'
  })).sort((a, b) => b.score - a.score);
}
