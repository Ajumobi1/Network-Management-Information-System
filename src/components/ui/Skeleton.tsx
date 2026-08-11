import { HTMLAttributes } from 'react';

export default function Skeleton({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={`animate-pulse rounded-3xl bg-slate-200/80 ${className}`.trim()} />;
}
