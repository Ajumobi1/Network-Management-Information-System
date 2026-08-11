
export default function ProviderBulkActions({ selectedCount }: { selectedCount: number }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm font-semibold text-slate-900">Enterprise provider directory</p>
      <p className="text-sm text-slate-500">{selectedCount} selected</p>
    </div>
  );
}
