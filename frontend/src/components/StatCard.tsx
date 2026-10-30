import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  color?: string;
  trend?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'var(--primary)',
  trend,
}) => {
  return (
    <div className="glass-card" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '0.25rem' }}>
            {title}
          </p>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {value}
          </h3>
          {subtitle && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              {subtitle}
            </p>
          )}
          {trend && (
            <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600, display: 'inline-block', marginTop: '0.25rem' }}>
              {trend}
            </span>
          )}
        </div>

        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: `rgba(59, 130, 246, 0.1)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: color,
            border: `1px solid rgba(59, 130, 246, 0.2)`
          }}
        >
          <Icon size={22} color={color} />
        </div>
      </div>
    </div>
  );
};
