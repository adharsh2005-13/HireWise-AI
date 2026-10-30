import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Sparkles, Sun, Moon, LogOut, User as UserIcon, Shield, Briefcase, FileText } from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  const { user, role, logout, theme, toggleTheme } = useAuth();

  const getRoleBadge = () => {
    if (role === 'admin') return <span className="badge badge-purple"><Shield size={12} /> Admin</span>;
    if (role === 'recruiter') return <span className="badge badge-blue"><Briefcase size={12} /> Recruiter</span>;
    return <span className="badge badge-green"><FileText size={12} /> Candidate</span>;
  };

  return (
    <header
      style={{
        height: '68px',
        borderBottom: '1px solid var(--border-primary)',
        background: 'var(--bg-secondary)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
      }}
    >
      {/* Brand logo & title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }} onClick={() => onNavigate('dashboard')}>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.35)',
          }}
        >
          <Sparkles size={20} color="#ffffff" />
        </div>
        <div>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            HireWise AI
          </span>
          <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginLeft: '0.5rem', fontWeight: 600 }}>
            v1.0
          </span>
        </div>
      </div>

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {user ? (
          <>
            {getRoleBadge()}
            
            <button
              onClick={toggleTheme}
              className="btn btn-outline btn-sm"
              style={{ width: '36px', height: '36px', padding: 0, borderRadius: '50%' }}
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <button
              onClick={() => onNavigate('profile')}
              className="btn btn-secondary btn-sm"
              style={{ gap: '0.5rem' }}
            >
              <UserIcon size={14} />
              <span>{user.full_name}</span>
            </button>

            <button
              onClick={logout}
              className="btn btn-danger btn-sm"
              title="Logout"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={toggleTheme}
              className="btn btn-outline btn-sm"
              style={{ width: '36px', height: '36px', padding: 0, borderRadius: '50%' }}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button onClick={() => onNavigate('login')} className="btn btn-outline btn-sm">
              Sign In
            </button>
            <button onClick={() => onNavigate('register')} className="btn btn-primary btn-sm">
              Get Started
            </button>
          </>
        )}
      </div>
    </header>
  );
};
