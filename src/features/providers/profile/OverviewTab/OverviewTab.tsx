import { InfoGrid, ProviderTabProps } from '../ProfileTabShell';
import { getProviderCategoryLabel } from '../../../../constants/providerNetwork';
import Badge from '../../../../components/ui/Badge';

export default function OverviewTab({ provider }: ProviderTabProps) {
  return (
    <div className="space-y-6">
      <InfoGrid items={[['Provider Code', provider.providerCode], ['Status', provider.status], ['Category', getProviderCategoryLabel(provider.category)], ['LGA', provider.lga], ['Ownership', provider.ownership]]} />
      
      <div className="nmis-card p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">Services Offered</h3>
        <div className="flex flex-wrap gap-2">
          {provider.services && provider.services.length > 0 ? (
            provider.services.map(service => (
              <Badge key={service} variant="info">{service}</Badge>
            ))
          ) : (
            <span className="text-sm text-slate-400 italic">No specific services registered</span>
          )}
        </div>
      </div>
    </div>
  );
}
