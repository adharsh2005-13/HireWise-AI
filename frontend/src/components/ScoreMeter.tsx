import React from 'react';

interface ScoreMeterProps {
  score: number;
  size?: number;
  label?: string;
  showBreakdown?: boolean;
}

export const ScoreMeter: React.FC<ScoreMeterProps> = ({ score, size = 96, label, showBreakdown = false }) => {
  const normalized = Math.max(0, Math.min(100, score));
  
  // Color determination
  let color = '#3b82f6';
  let statusText = 'Fair Match';
  if (normalized >= 80) {
    color = '#10b981';
    statusText = 'Excellent Match';
  } else if (normalized >= 60) {
    color = '#3b82f6';
    statusText = 'Good Match';
  } else if (normalized >= 40) {
    color = '#f59e0b';
    statusText = 'Moderate Gap';
  } else {
    color = '#ef4444';
    statusText = 'Skill Gap';
  }

  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (normalized / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="var(--bg-surface)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
            style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
          />
        </svg>

        {/* Center label */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: size > 80 ? '1.5rem' : '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {Math.round(normalized)}%
          </span>
          {size > 80 && (
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              MATCH
            </span>
          )}
        </div>
      </div>

      {label && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color }}>{statusText}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{label}</div>
        </div>
      )}
    </div>
  );
};
