import { ReactNode } from 'react';

type CardProps = {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
};

export default function Card({ children, className = '', interactive = false }: CardProps) {
  return <div className={`nmis-card ${interactive ? 'nmis-card-interactive' : ''} p-5 sm:p-6 ${className}`.trim()}>{children}</div>;
}
