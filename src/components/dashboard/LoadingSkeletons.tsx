type LoadingSkeletonsProps = {
  rows?: number;
  className?: string;
};

export default function LoadingSkeletons({ rows = 3, className = '' }: LoadingSkeletonsProps) {
  return (
    <div className={`${className} space-y-4`}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="animate-pulse rounded-[24px] bg-slate-100 p-6" />
      ))}
    </div>
  );
}
