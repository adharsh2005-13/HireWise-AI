import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export const ToastContainer: React.FC<{ toasts: ToastMessage[]; onDismiss: (id: string) => void }> = ({
  toasts,
  onDismiss,
}) => {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        maxWidth: '400px',
      }}
    >
      {toasts.map((toast) => {
        let Icon = CheckCircle2;
        let borderColor = 'var(--success)';
        let bg = 'rgba(16, 185, 129, 0.15)';

        if (toast.type === 'error') {
          Icon = AlertCircle;
          borderColor = 'var(--danger)';
          bg = 'rgba(239, 68, 68, 0.15)';
        } else if (toast.type === 'info') {
          Icon = Info;
          borderColor = 'var(--primary)';
          bg = 'rgba(59, 130, 246, 0.15)';
        }

        return (
          <div
            key={toast.id}
            className="animate-fade-in"
            style={{
              background: 'var(--bg-secondary)',
              border: `1px solid ${borderColor}`,
              boxShadow: 'var(--shadow-lg)',
              borderRadius: 'var(--radius-md)',
              padding: '0.875rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <div style={{ color: borderColor }}>
                <Icon size={18} />
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', margin: 0 }}>
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
