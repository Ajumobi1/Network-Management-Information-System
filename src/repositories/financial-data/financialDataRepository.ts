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
  await new Promise(resolve => setTimeout(resolve, 500));
  
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
