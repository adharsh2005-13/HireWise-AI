import React from 'react';
import { Check, X, Sparkles, BookOpen } from 'lucide-react';

interface SkillBadgeProps {
  name: string;
  variant?: 'matching' | 'missing' | 'preferred' | 'neutral' | 'category';
  category?: string;
  size?: 'sm' | 'md';
}

export const SkillBadge: React.FC<SkillBadgeProps> = ({ name, variant = 'neutral', category, size = 'md' }) => {
  let badgeClass = 'badge-gray';
  let Icon = null;

  if (variant === 'matching') {
    badgeClass = 'badge-green';
    Icon = Check;
  } else if (variant === 'missing') {
    badgeClass = 'badge-red';
    Icon = X;
  } else if (variant === 'preferred') {
    badgeClass = 'badge-purple';
    Icon = Sparkles;
  } else if (variant === 'category') {
    badgeClass = 'badge-blue';
    Icon = BookOpen;
  }

  const isSmall = size === 'sm';

  return (
    <span
      className={`badge ${badgeClass}`}
      style={{
        fontSize: isSmall ? '0.7rem' : '0.78rem',
        padding: isSmall ? '0.2rem 0.5rem' : '0.3rem 0.65rem',
      }}
    >
      {Icon && <Icon size={isSmall ? 11 : 13} />}
      <span>{name}</span>
      {category && (
        <span style={{ opacity: 0.65, fontSize: '0.68rem', marginLeft: '0.2rem' }}>
          • {category}
        </span>
      )}
    </span>
  );
};
