import { MessageCircle } from 'lucide-react';

export default function FloatingAssistantButton() {
  return (
    <button
      type="button"
      className="fixed bottom-6 right-6 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand-blue text-white shadow-elevated transition hover:bg-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-blue/50"
      aria-label="Open assistant"
    >
      <MessageCircle className="h-6 w-6" />
    </button>
  );
}
