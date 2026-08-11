import { InfoGrid, ProviderTabProps } from '../ProfileTabShell';

export default function FinancialTab({ provider }: ProviderTabProps) {
  return <InfoGrid items={[['Bank Name', provider.bankName], ['Account Name', provider.accountName], ['Account Number', provider.accountNumber], ['Capitation Trend', provider.performance.capitationTrend]]} />;
}
