import { 
  FinancialRecord, 
  ImportBatch, 
  FinancialDataType, 
  RecordValidationStatus 
} from '../../types/financial-data';
import { mockFinancialRecords, mockImportBatches } from '../../mocks/financialDataMocks';

export interface FinancialFilters {
  dataType?: FinancialDataType;
  year?: number;
  month?: number;
  period?: string;
  state?: string;
  lga?: string;
  facilityType?: string;
  ownership?: string;
  providerId?: string;
  batchId?: string;
  status?: RecordValidationStatus;
  search?: string;
}

export async function fetchFinancialRecords(filters: FinancialFilters = {}): Promise<FinancialRecord[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  let filtered = [...mockFinancialRecords];
  
  if (filters.dataType) {
    filtered = filtered.filter(r => r.dataType === filters.dataType);
  }
  
  if (filters.year) {
    filtered = filtered.filter(r => r.reportingYear === filters.year);
  }
  
  if (filters.month) {
    filtered = filtered.filter(r => r.reportingMonth === filters.month);
  }
  
  if (filters.batchId) {
    filtered = filtered.filter(r => r.importBatchId === filters.batchId);
  }

  if (filters.period) {
    filtered = filtered.filter(r => r.period === filters.period);
  }

  if (filters.providerId) {
    filtered = filtered.filter(r => r.providerId === filters.providerId);
  }

  if (filters.state) {
    filtered = filtered.filter(r => r.state === filters.state);
  }

  if (filters.lga) {
    filtered = filtered.filter(r => r.lga === filters.lga);
  }

  if (filters.facilityType) {
    filtered = filtered.filter(r => r.facilityType === filters.facilityType);
  }

  if (filters.ownership) {
    filtered = filtered.filter(r => r.ownership === filters.ownership);
  }
  
  if (filters.search) {
    const search = filters.search.toLowerCase();
    filtered = filtered.filter(r => 
      r.providerName.toLowerCase().includes(search) || 
      r.providerCode?.toLowerCase().includes(search) ||
      r.state?.toLowerCase().includes(search) ||
      r.lga?.toLowerCase().includes(search)
    );
  }
  
  return filtered;
}

export async function fetchFinancialAnalytics(filters: FinancialFilters = {}) {
  const records = await fetchFinancialRecords(filters);
  
  const totalExpenditure = records.reduce((sum, r) => sum + (r.amountPaid || r.netAmount || r.amount || 0), 0);
  const totalClaims = records.filter(r => r.dataType === 'claims').reduce((sum, r) => sum + (r.amountPaid || 0), 0);
  const totalCapitation = records.filter(r => r.dataType === 'capitation').reduce((sum, r) => sum + (r.netAmount || 0), 0);
  const totalFFS = records.filter(r => r.dataType === 'ffs').reduce((sum, r) => sum + (r.amount || 0), 0);
  
  // Group by category
  const byCategory = records.reduce((acc: Record<string, number>, r) => {
    const cat = r.dataType;
    acc[cat] = (acc[cat] || 0) + (r.amountPaid || r.netAmount || r.amount || 0);
    return acc;
  }, {});

  // Group by month for trends
  const byMonth = records.reduce((acc: Record<string, number>, r) => {
    const month = r.period;
    acc[month] = (acc[month] || 0) + (r.amountPaid || r.netAmount || r.amount || 0);
    return acc;
  }, {});

  return {
    totalExpenditure,
    totalClaims,
    totalCapitation,
    totalFFS,
    recordCount: records.length,
    providerCount: new Set(records.map(r => r.providerId || r.providerName)).size,
    byCategory: Object.entries(byCategory).map(([name, value]) => ({ name, value })),
    trends: Object.entries(byMonth).sort().map(([name, value]) => ({ name, value }))
  };
}

export async function fetchImportBatches(): Promise<ImportBatch[]> {
  await new Promise(resolve => setTimeout(resolve, 500));
  return [...mockImportBatches];
}

export async function fetchImportBatchById(id: string): Promise<ImportBatch | null> {
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockImportBatches.find(b => b.id === id) || null;
}

export async function createImportBatch(batch: Omit<ImportBatch, 'id' | 'uploadedAt'>): Promise<ImportBatch> {
  const newBatch: ImportBatch = {
    ...batch,
    id: `batch-${Date.now()}`,
    uploadedAt: new Date().toISOString(),
  };
  mockImportBatches.unshift(newBatch);
  return newBatch;
}
