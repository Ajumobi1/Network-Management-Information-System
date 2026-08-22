import { supabase } from '../../lib/supabase/supabaseClient';
import { useMockData } from '../common';
import { PerformanceFilters, ProviderPerformanceRecord, PerformanceSummaryStats, PerformanceRating } from '../../types/performance/providerPerformanceTypes';
import { providerDirectory } from '../../mocks/providersMocks';
import { ProviderCategory, ProviderOwnership } from '../../types/providers/providerTypes';

let mockPerformanceCache: ProviderPerformanceRecord[] | null = null;

function generateMockPerformanceData(): ProviderPerformanceRecord[] {
  if (mockPerformanceCache) return mockPerformanceCache;

  mockPerformanceCache = providerDirectory.map((p, idx) => {
    const insp = 70 + ((idx * 7) % 28);
    const cred = 80 + ((idx * 5) % 20);
    const comp = 75 + ((idx * 9) % 25);
    const fin = 82 + ((idx * 3) % 18);
    const composite = Number(((insp * 0.35) + (cred * 0.25) + (comp * 0.20) + (fin * 0.20)).toFixed(1));
    
    let rating: PerformanceRating = 'Satisfactory';
    if (composite >= 90) rating = 'Excellent';
    else if (composite >= 80) rating = 'Good';
    else if (composite >= 70) rating = 'Satisfactory';
    else if (composite >= 60) rating = 'Needs Improvement';
    else rating = 'Critical';

    const attentionFlag = composite < 72 || insp < 72;

    return {
      providerId: p.id,
      providerName: p.providerName,
      providerCode: p.providerCode,
      category: p.category,
      state: p.state,
      lga: p.lga,
      ownership: p.ownership,
      compositeScore: composite,
      rating,
      inspectionScore: insp,
      credentialingScore: cred,
      complaintScore: comp,
      financialScore: fin,
      enrolleeDenominator: 500 + (idx * 250) % 3500,
      attentionFlag,
      attentionReason: attentionFlag ? (insp < 72 ? 'Critical inspection score below threshold' : 'Low composite performance rating') : null,
      period: '2026-Q3',
      updatedAt: new Date().toISOString(),
    };
  });

  return mockPerformanceCache;
}

interface DbPerformanceRecord {
  provider_id: string;
  provider_name: string;
  provider_code: string;
  category: ProviderCategory;
  state: string;
  lga: string;
  ownership: ProviderOwnership;
  composite_score: number;
  rating: PerformanceRating;
  inspection_score: number;
  credentialing_score: number;
  complaint_score: number;
  financial_score: number;
  enrollee_denominator: number;
  attention_flag: boolean;
  attention_reason: string | null;
  period: string;
  updated_at: string;
}

export const providerPerformanceRepository = {
  async fetchPerformanceRecords(filters: PerformanceFilters): Promise<ProviderPerformanceRecord[]> {
    if (useMockData) {
      const records = generateMockPerformanceData();
      const q = filters.search.trim().toLowerCase();
      return records.filter(r => {
        const matchesSearch = !q || r.providerName.toLowerCase().includes(q) || r.providerCode.toLowerCase().includes(q) || r.lga.toLowerCase().includes(q);
        const matchesPeriod = !filters.period || r.period === filters.period;
        const matchesRating = filters.rating === 'all' || r.rating === filters.rating;
        const matchesCategory = filters.category === 'all' || r.category === filters.category;
        const matchesOwnership = filters.ownership === 'all' || r.ownership === filters.ownership;
        const matchesState = filters.state === 'all' || r.state === filters.state;
        const matchesAttention = !filters.attentionOnly || r.attentionFlag;
        return matchesSearch && matchesPeriod && matchesRating && matchesCategory && matchesOwnership && matchesState && matchesAttention;
      });
    }

    try {
      const { data, error } = await supabase.rpc('nmis_list_provider_performance', {
        p_period: filters.period || null,
        p_rating: filters.rating === 'all' ? null : filters.rating,
        p_search: filters.search.trim() || null,
      });

      if (error) {
        console.warn('Performance RPC failed, using mock fallback:', error.message);
        return generateMockPerformanceData();
      }

      return (data || []).map((r: DbPerformanceRecord) => ({
        providerId: r.provider_id,
        providerName: r.provider_name,
        providerCode: r.provider_code,
        category: r.category,
        state: r.state,
        lga: r.lga,
        ownership: r.ownership,
        compositeScore: Number(r.composite_score),
        rating: r.rating,
        inspectionScore: Number(r.inspection_score),
        credentialingScore: Number(r.credentialing_score),
        complaintScore: Number(r.complaint_score),
        financialScore: Number(r.financial_score),
        enrolleeDenominator: r.enrollee_denominator,
        attentionFlag: r.attention_flag,
        attentionReason: r.attention_reason,
        period: r.period,
        updatedAt: r.updated_at,
      }));
    } catch (err) {
      console.warn('Performance fetch error, using mock fallback');
      return generateMockPerformanceData();
    }
  },

  async fetchSummaryStats(): Promise<PerformanceSummaryStats> {
    try {
      const records = await this.fetchPerformanceRecords({
        search: '',
        period: '',
        rating: 'all',
        category: 'all',
        ownership: 'all',
        state: 'all',
        attentionOnly: false,
      });

      const totalEvaluated = records.length;
      const averageScore = totalEvaluated ? Math.round(records.reduce((acc, r) => acc + r.compositeScore, 0) / totalEvaluated) : 0;
      
      const ratingDistribution: Record<PerformanceRating, number> = {
        'Excellent': records.filter(r => r.rating === 'Excellent').length,
        'Good': records.filter(r => r.rating === 'Good').length,
        'Satisfactory': records.filter(r => r.rating === 'Satisfactory').length,
        'Needs Improvement': records.filter(r => r.rating === 'Needs Improvement').length,
        'Critical': records.filter(r => r.rating === 'Critical').length,
      };

      const attentionCount = records.filter(r => r.attentionFlag).length;
      const inspectionComplianceRate = totalEvaluated ? Math.round((records.filter(r => r.inspectionScore >= 75).length / totalEvaluated) * 100) : 0;
      const credentialingComplianceRate = totalEvaluated ? Math.round((records.filter(r => r.credentialingScore >= 80).length / totalEvaluated) * 100) : 0;

      return {
        totalEvaluated,
        averageScore,
        ratingDistribution,
        attentionCount,
        inspectionComplianceRate,
        credentialingComplianceRate,
      };
    } catch (err) {
      return {
        totalEvaluated: 0,
        averageScore: 0,
        ratingDistribution: { 'Excellent': 0, 'Good': 0, 'Satisfactory': 0, 'Needs Improvement': 0, 'Critical': 0 },
        attentionCount: 0,
        inspectionComplianceRate: 0,
        credentialingComplianceRate: 0,
      };
    }
  }
};
