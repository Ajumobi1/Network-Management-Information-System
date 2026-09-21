import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button';

/**
 * The ODCHC checklist app is the source of truth for this workflow.
 * It is served as a bundled static page so its checklist labels, field types,
 * quarter/month tables, score controls, recommendation controls, validation,
 * local draft persistence, and PDF export remain exactly the same as the APK.
 */
export default function ODCHCChecklistPage() {
  const navigate = useNavigate();

  return (
    <main className="relative min-h-[calc(100dvh-4rem)] bg-[#072f6b]">
      <div className="absolute left-3 top-3 z-10 sm:left-5 sm:top-5">
        <Button
          variant="secondary"
          className="border-white/20 bg-white/95 text-[#072f6b] shadow-xl hover:bg-white"
          onClick={() => navigate('/inspections')}
        >
          <ArrowLeft size={16} /> Back to NMIS
        </Button>
      </div>
      <iframe
        title="ODCHC Accreditation Checklist"
        src="/odchc-checklist/index.html"
        className="block h-[calc(100dvh-4rem)] min-h-[760px] w-full border-0 bg-white"
        allow="download"
      />
    </main>
  );
}
