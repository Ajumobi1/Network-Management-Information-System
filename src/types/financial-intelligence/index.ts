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
  providerRanking: FinancialIntelligenceBreakdown[];
  lgaRanking: FinancialIntelligenceBreakdown[];
  monthlyTrend: FinancialIntelligenceBreakdown[];
  expenditureMix: FinancialIntelligenceBreakdown[];
}
