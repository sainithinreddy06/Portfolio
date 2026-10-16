import React from 'react';
import { usePortfolio } from '../../content';
import { Terminal } from 'lucide-react';

interface EngineeringModeBadgeProps {
  componentName: string;
  notes?: string;
  className?: string;
}

export const EngineeringModeBadge: React.FC<EngineeringModeBadgeProps> = ({
  componentName,
  notes,
  className = '',
}) => {
  const { engineeringMode } = usePortfolio();

  if (!engineeringMode) return null;

  return (
    <div
      aria-hidden="true"
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-[#151B24]/90 border border-[#7C5CFF]/30 text-[10px] font-mono text-[#22D3EE] select-none backdrop-blur-xs ${className}`}
    >
      <Terminal className="w-2.5 h-2.5 text-[#7C5CFF]" />
      <span>&lt;{componentName} /&gt;</span>
      {notes && <span className="text-[#98A2B3]">[{notes}]</span>}
    </div>
  );
};
