import { useMockData } from '../common';
import { apiMocks } from '../../mocks';
import { getInspectionsMock } from '../../mocks/inspectionsMocks';
import { providerDirectory } from '../../mocks/providersMocks';

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
  if (useMockData) {
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

  // Real implementation would aggregate from DB
  return { averageScore: 0, aboveTargetCount: 0, underperformingCount: 0, totalMonitored: 0 };
}

export async function getProviderRankings(): Promise<ProviderPerformance[]> {
  if (useMockData) {
    const inspections = await getInspectionsMock();
    const completed = inspections.filter(i => i.status === 'completed');

    return completed.map(i => ({
      providerId: i.providerId,
      providerName: i.providerName,
      providerCode: i.providerCode,
      score: i.score || 0,
      compliance: (i.score || 0) - 2, // Mock compliance score
      rating: i.rating || 'N/A',
      lastInspection: i.completedAt || i.scheduledAt,
      trend: ((i.score || 0) >= 90 ? 'up' : (i.score || 0) <= 75 ? 'down' : 'stable') as 'up' | 'down' | 'stable'
    })).sort((a, b) => b.score - a.score);
  }

  return [];
}
