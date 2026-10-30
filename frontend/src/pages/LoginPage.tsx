import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Sparkles, ArrowRight, Lock, Mail, AlertCircle, User, Briefcase, Shield } from 'lucide-react';

interface LoginPageProps {
  onNavigate: (view: string) => void;
  onSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate, onSuccess }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
  };

  return (
    <div style={{ maxWidth: '440px', margin: '3rem auto', padding: '0 1rem' }}>
      <div className="glass-card animate-fade-in" style={{ padding: '2.25rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.35)',
              marginBottom: '0.75rem',
            }}
          >
            <Sparkles size={22} color="#ffffff" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Sign In to HireWise AI</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Access your AI career and recruitment portal
          </p>
        </div>

        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--danger-bg)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: 'var(--danger)',
              fontSize: '0.825rem',
              marginBottom: '1.25rem',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '13px' }} />
              <input
                type="email"
                required
                className="input-field"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '13px' }} />
              <input
                type="password"
                required
                className="input-field"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-lg"
            style={{ marginTop: '0.5rem', width: '100%' }}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Demo Fast Login Buttons */}
        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-primary)' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.75rem', textAlign: 'center' }}>
            Quick Demo Auto-Fill
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => fillDemo('alex@developer.io', 'Candidate123!')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', flexDirection: 'column', padding: '0.6rem 0.2rem', gap: '0.25rem' }}
            >
              <User size={14} color="#34d399" />
              <span>Candidate</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemo('recruiter@techventures.com', 'Recruiter123!')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', flexDirection: 'column', padding: '0.6rem 0.2rem', gap: '0.25rem' }}
            >
              <Briefcase size={14} color="#60a5fa" />
              <span>Recruiter</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemo('admin@hirewise.ai', 'Admin123!')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', flexDirection: 'column', padding: '0.6rem 0.2rem', gap: '0.25rem' }}
            >
              <Shield size={14} color="#c084fc" />
              <span>Admin</span>
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <button
              onClick={() => onNavigate('register')}
              style={{ background: 'none', border: 'none', color: '#60a5fa', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
            >
              Create an account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
