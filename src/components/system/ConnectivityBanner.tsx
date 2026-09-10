import { useEffect, useState } from 'react';
import { CloudOff, Wifi } from 'lucide-react';

export default function ConnectivityBanner() {
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' || navigator.onLine);

  useEffect(() => {
    const setConnection = () => setOnline(navigator.onLine);
    window.addEventListener('online', setConnection);
    window.addEventListener('offline', setConnection);
    return () => {
      window.removeEventListener('online', setConnection);
      window.removeEventListener('offline', setConnection);
    };
  }, []);

  if (online) return null;
  return (
    <div role="status" className="sticky top-0 z-50 flex items-center justify-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs font-bold text-amber-900">
      <CloudOff size={15} />
      Offline: cached pages and prepared inspection drafts remain available. Live records, privileged actions, and final submissions require reconnection.
    </div>
  );
}

export function ReconnectedNotice() {
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' || navigator.onLine);
  useEffect(() => {
    const setConnection = () => setOnline(navigator.onLine);
    window.addEventListener('online', setConnection);
    window.addEventListener('offline', setConnection);
    return () => { window.removeEventListener('online', setConnection); window.removeEventListener('offline', setConnection); };
  }, []);
  return online ? <span className="inline-flex items-center gap-1 text-xs font-bold text-status-success"><Wifi size={13} /> Online</span> : null;
}
