import { fetchFinancialAnalytics, fetchFinancialRecords, FinancialFilters } from '../../repositories/financial-data/financialDataRepository';
import { fetchEnrolmentAnalyticsWithFinance, fetchEnrollees } from '../../repositories/enrolment/enrolmentRepository';
import { EnrolleeRecord, EnrolmentFilters } from '../../types/enrolment/enrolmentTypes';
import { FinancialRecord } from '../../types/financial-data';
import { FinancialIntelligenceFilters, FinancialIntelligenceBreakdown, FinancialIntelligenceSummary } from '../../types/financial-intelligence';
import { useMockData } from '../../repositories/common';
import { invokeSecureRpc } from '../../repositories/contracts/secureRpcRepository';

function amountForRecord(record: FinancialRecord): number {
  return record.netAmountPaid ?? record.amountPaid ?? record.amountApproved ?? record.netAmount ?? record.amount ?? 0;
}

function groupAmount(records: FinancialRecord[], key: (record: FinancialRecord) => string): FinancialIntelligenceBreakdown[] {
  const grouped = records.reduce<Record<string, number>>((accumulator, record) => {
    const name = key(record) || 'Unknown';
    accumulator[name] = (accumulator[name] || 0) + amountForRecord(record);
    return accumulator;
  }, {});
  return Object.entries(grouped).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

function mapFinancialFilters(filters: FinancialIntelligenceFilters): FinancialFilters {
  return {
    year: filters.year,
    month: filters.month,
    period: filters.period,
    state: filters.state,
    lga: filters.lga,
    providerId: filters.providerId,
    facilityType: filters.facilityType,
    ownership: filters.ownership,
    dataType: filters.dataType && filters.dataType !== 'all' ? filters.dataType : undefined,
  };
}

function mapEnrolmentFilters(filters: FinancialIntelligenceFilters): EnrolmentFilters {
  return {
    year: filters.year,
    month: filters.month,
    period: filters.period,
    state: filters.state,
    lga: filters.lga,
    providerId: filters.providerId,
    sector: filters.sector,
  };
}

function providerKey(record: { providerId?: string; providerCode?: string; providerName: string }): string {
  return record.providerId || record.providerCode || record.providerName;
}

function allocateBySector(records: FinancialRecord[], enrollees: EnrolleeRecord[], sector?: 'formal' | 'informal'): FinancialRecord[] {
  if (!sector) return records;

  const sectorCounts = new Map<string, number>();
  const totalCounts = new Map<string, number>();
  enrollees.forEach(enrollee => {
    const key = `${providerKey(enrollee)}|${enrollee.period}`;
    totalCounts.set(key, (totalCounts.get(key) || 0) + 1);
    if (enrollee.sector === sector) sectorCounts.set(key, (sectorCounts.get(key) || 0) + 1);
  });

  return records.map(record => {
    const key = `${providerKey(record)}|${record.period}`;
    const total = totalCounts.get(key) || 0;
    const sectorCount = sectorCounts.get(key) || 0;
    const share = total > 0 ? sectorCount / total : 0;
    return {
      ...record,
      amountPaid: amountForRecord(record) * share,
      netAmountPaid: amountForRecord(record) * share,
      amount: amountForRecord(record) * share,
    };
  });
}

export async function fetchFinancialIntelligence(filters: FinancialIntelligenceFilters = {}): Promise<FinancialIntelligenceSummary> {
  if (!useMockData) {
    return invokeSecureRpc<FinancialIntelligenceSummary>('nmis_financial_intelligence', {
      p_year: filters.year ?? null,
      p_month: filters.month ?? null,
      p_period: filters.period ?? null,
      p_sector: filters.sector && filters.sector !== 'all' ? filters.sector : null,
      p_state: filters.state ?? null,
      p_lga: filters.lga ?? null,
      p_provider_id: filters.providerId ?? null,
      p_facility_type: filters.facilityType ?? null,
      p_ownership: filters.ownership ?? null,
      p_data_type: filters.dataType && filters.dataType !== 'all' ? filters.dataType : null,
    });
  }

  const financialFilters = mapFinancialFilters(filters);
  const enrolmentFilters = mapEnrolmentFilters(filters);
  const [financialAnalytics, financialRecords, enrolmentAnalytics, enrollees] = await Promise.all([
    fetchFinancialAnalytics(financialFilters),
    fetchFinancialRecords(financialFilters),
    fetchEnrolmentAnalyticsWithFinance(enrolmentFilters),
    fetchEnrollees(enrolmentFilters),
  ]);

  const allocatedRecords = allocateBySector(financialRecords, enrollees, filters.sector && filters.sector !== 'all' ? filters.sector : undefined);
  const totalExpenditure = allocatedRecords.reduce((sum, record) => sum + amountForRecord(record), 0);
  const byType = groupAmount(allocatedRecords, record => record.dataType);
  const claimsExpenditure = byType.find(item => item.name === 'claims')?.value || 0;
  const capitationExpenditure = byType.find(item => item.name === 'capitation')?.value || 0;
  const ffsExpenditure = byType.find(item => item.name === 'ffs')?.value || 0;

  // Derive Phase 12 distributions
  const byFacilityType = groupAmount(allocatedRecords, record => record.facilityType || 'Other');
  const byOwnership = groupAmount(allocatedRecords, record => record.ownership || 'Unknown');
  const byState = groupAmount(allocatedRecords, record => record.state || 'Unknown');

  // Derive Phase 12 exceptions (Mock anomalies)
  const exceptions = allocatedRecords
    .filter(r => amountForRecord(r) > 5000000) // Arbitrary threshold for mock variance
    .slice(0, 3)
    .map(r => ({
      id: `exc-${r.id}`,
      type: 'variance' as const,
      severity: 'medium' as const,
      providerName: r.providerName,
      providerCode: r.providerCode || 'N/A',
      description: `Expenditure variance of ${Math.round((amountForRecord(r) / 1000000))}M detected in ${r.period}.`,
      detectedAt: new Date().toISOString(),
    }));

  return {
    totalExpenditure,
    claimsExpenditure,
    capitationExpenditure,
    ffsExpenditure,
    totalEnrolment: enrolmentAnalytics.totalEnrollees,
    formalEnrolment: enrolmentAnalytics.formalCount,
    informalEnrolment: enrolmentAnalytics.informalCount,
    pepm: enrolmentAnalytics.totalEnrollees > 0 ? totalExpenditure / enrolmentAnalytics.totalEnrollees : 0,
    providerCount: financialAnalytics.providerCount,
    financialRecordCount: allocatedRecords.length,
    providerRanking: groupAmount(allocatedRecords, record => record.providerName).slice(0, 10),
    lgaRanking: groupAmount(allocatedRecords, record => record.lga || 'Unknown').slice(0, 10),
    monthlyTrend: groupAmount(allocatedRecords, record => record.period).sort((a, b) => a.name.localeCompare(b.name)),
    expenditureMix: byType,
    byFacilityType,
    byOwnership,
    byState,
    exceptions,
    comparison: {
      amountChange: totalExpenditure * 0.05,
      percentageChange: 5.2,
      pepmChange: 2.1,
      enrolmentChange: 12000,
    }
  };
}

export const financialIntelligenceService = {
  fetchFinancialIntelligence,
};
