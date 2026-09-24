import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button';
import { supabase } from '../lib/supabase/supabaseClient';
import { DEPLOYMENT_TAG, supabaseRuntimeConfig } from '../lib/runtime';

/**
 * The ODCHC checklist app is the source of truth for this workflow.
 * It is served as a bundled static page so its checklist labels, field types,
 * quarter/month tables, score controls, recommendation controls, validation,
 * local draft persistence, and PDF export remain exactly the same as the APK.
 */
export default function ODCHCChecklistPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const editSubmissionRef = useRef<Record<string, unknown> | null>(null);
  const editId = searchParams.get('editId');
  const [editReady, setEditReady] = useState(!editId);

  const sendSupabaseSession = useCallback(async () => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow || !supabaseRuntimeConfig.url || !supabaseRuntimeConfig.anonKey) return;
    const { data } = await supabase.auth.getSession();
    iframe.contentWindow.postMessage({
      type: 'ODCHC_SUPABASE_SESSION',
      url: supabaseRuntimeConfig.url,
      anonKey: supabaseRuntimeConfig.anonKey,
      accessToken: data.session?.access_token ?? null,
    }, window.location.origin);
  }, []);

  const sendEditSubmission = useCallback(() => {
    const iframe = iframeRef.current;
    if (iframe?.contentWindow && editSubmissionRef.current) {
      iframe.contentWindow.postMessage({ type: 'ODCHC_LOAD_SUBMISSION', submission: editSubmissionRef.current }, window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (!editId) {
      setEditReady(true);
      try { sessionStorage.removeItem('odchc_edit_submission'); } catch { /* storage is optional */ }
      return;
    }
    setEditReady(false);
    void supabase.auth.getSession().then(() => supabase.rpc('nmis_get_odchc_checklist_submission', { p_submission_id: editId })).then(({ data, error }) => {
      if (error) { setEditReady(true); window.alert(`Unable to load this submission for editing.\n\n${error.message}`); }
      else {
        const submission = data as Record<string, unknown>;
        let rawPayload = submission.raw_payload;
        if (typeof rawPayload === 'string') {
          try { rawPayload = JSON.parse(rawPayload); } catch { rawPayload = {}; }
        }
        editSubmissionRef.current = {
          ...submission,
          raw_payload: rawPayload,
          profile_data: submission.profile_data || {},
          responses: submission.responses || {},
        };
        try { sessionStorage.setItem('odchc_edit_submission', JSON.stringify(editSubmissionRef.current)); } catch { /* storage is optional */ }
        setEditReady(true);
        sendEditSubmission();
      }
    });
  }, [editId, sendEditSubmission]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin === window.location.origin && event.data?.type === 'ODCHC_CHECKLIST_READY') {
        void sendSupabaseSession();
        sendEditSubmission();
      }
    };
    window.addEventListener('message', onMessage);
    const { data: listener } = supabase.auth.onAuthStateChange(() => { void sendSupabaseSession(); });
    return () => {
      window.removeEventListener('message', onMessage);
      listener.subscription.unsubscribe();
    };
  }, [sendSupabaseSession, sendEditSubmission]);

  const checklistAssetVersion = encodeURIComponent(DEPLOYMENT_TAG || 'current');

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
      {editId && !editReady ? (
        <div className="flex h-[calc(100dvh-4rem)] min-h-[760px] items-center justify-center bg-white text-sm font-semibold text-[#072f6b]">
          Loading saved checklist for editing...
        </div>
      ) : (
        <iframe
          ref={iframeRef}
          title="ODCHC Accreditation Checklist"
          src={`/odchc-checklist/index.html?v=${checklistAssetVersion}`}
          onLoad={() => { void sendSupabaseSession(); sendEditSubmission(); }}
          className="block h-[calc(100dvh-4rem)] min-h-[760px] w-full border-0 bg-white"
          allow="download"
        />
      )}
    </main>
  );
}
