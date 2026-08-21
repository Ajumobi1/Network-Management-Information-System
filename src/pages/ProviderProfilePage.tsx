import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2 } from 'lucide-react';
import Button from '../components/ui/Button';
import ProviderProfile from '../features/providers/profile/ProviderProfile';

export default function ProviderProfilePage() {
  const { providerId } = useParams<{ providerId: string }>();
  const navigate = useNavigate();

  if (!providerId) {
    return (
      <main className="nmis-page">
        <div className="text-center py-12">
          <p className="text-slate-500">Provider ID not specified.</p>
          <Button className="mt-4" onClick={() => navigate('/providers')}>Return to Directory</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="nmis-page">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/providers')}
            className="gap-2 text-brand-secondary hover:text-brand-foreground"
          >
            <ArrowLeft size={16} /> Back to Provider Directory
          </Button>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-muted">
            <Building2 size={14} /> Enterprise Provider Record
          </div>
        </div>

        <ProviderProfile providerId={providerId} />
      </div>
    </main>
  );
}
