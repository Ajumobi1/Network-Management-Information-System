import { FinancialDataType } from '../financial-data';
import { EnrolmentSector } from '../enrolment/enrolmentTypes';

export interface FinancialIntelligenceFilters {
  year?: number;
  month?: number;
  period?: string;
  lga?: string;
  state?: string;
  providerId?: string;
  facilityType?: string;
  ownership?: string;
  dataType?: FinancialDataType | 'all';
  sector?: EnrolmentSector | 'all';
}

export interface FinancialIntelligenceBreakdown {
  name: string;
  value: number;
  secondaryValue?: number;
}

export interface FinancialException {
  id: string;
  type: 'variance' | 'missing-data' | 'anomalous-pepm' | 'data-quality';
  severity: 'low' | 'medium' | 'high' | 'critical';
  providerName: string;
  providerCode: string;
  description: string;
  detectedAt: string;
}

export interface FinancialIntelligenceSummary {
  totalExpenditure: number;
  claimsExpenditure: number;
  capitationExpenditure: number;
  ffsExpenditure: number;
  totalEnrolment: number;
  formalEnrolment: number;
  informalEnrolment: number;
  pepm: number;
  providerCount: number;
  financialRecordCount: number;
  
  // Rankings & Trends
  providerRanking: FinancialIntelligenceBreakdown[];
  lgaRanking: FinancialIntelligenceBreakdown[];
  monthlyTrend: FinancialIntelligenceBreakdown[];
  expenditureMix: FinancialIntelligenceBreakdown[];
  
  // Phase 12 Distributions
  byFacilityType: FinancialIntelligenceBreakdown[];
  byOwnership: FinancialIntelligenceBreakdown[];
  byState: FinancialIntelligenceBreakdown[];
  
  // Phase 12 Exceptions
  exceptions: FinancialException[];
  
  // Period Comparison (Current vs Previous)
  comparison?: {
    amountChange: number;
    percentageChange: number;
    pepmChange: number;
    enrolmentChange: number;
  };
}
