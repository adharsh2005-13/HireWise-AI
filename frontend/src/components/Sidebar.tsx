import React from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard,
  Upload,
  FileSearch,
  Compass,
  GitCompare,
  Bot,
  HelpCircle,
  FileCheck,
  PlusCircle,
  Users,
  ShieldCheck,
  UserCheck,
  Settings
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  const { role } = useAuth();

  const candidateNav = [
    { id: 'candidate_dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'resume_upload', label: 'Upload Resume', icon: Upload },
    { id: 'resume_analysis', label: 'Resume Analysis', icon: FileSearch },
    { id: 'job_discovery', label: 'Job Discovery', icon: Compass },
    { id: 'skill_gap', label: 'Skill Gap & Roadmap', icon: GitCompare },
    { id: 'career_chat', label: 'AI Career Assistant', icon: Bot },
    { id: 'interview_prep', label: 'Interview Prep', icon: HelpCircle },
    { id: 'applications', label: 'My Applications', icon: FileCheck },
    { id: 'profile', label: 'Profile & Settings', icon: Settings },
  ];

  const recruiterNav = [
    { id: 'recruiter_dashboard', label: 'Recruiter Dashboard', icon: LayoutDashboard },
    { id: 'job_management', label: 'Manage Job Listings', icon: PlusCircle },
    { id: 'candidate_search', label: 'Candidate Review & Search', icon: Users },
    { id: 'applications', label: 'Applications Pipeline', icon: FileCheck },
    { id: 'profile', label: 'Company Profile', icon: Settings },
  ];

  const adminNav = [
    { id: 'admin_dashboard', label: 'Platform Analytics', icon: ShieldCheck },
    { id: 'admin_users', label: 'User & System Control', icon: UserCheck },
    { id: 'job_discovery', label: 'Inspect Jobs', icon: Compass },
    { id: 'candidate_dashboard', label: 'Candidate Preview', icon: LayoutDashboard },
    { id: 'recruiter_dashboard', label: 'Recruiter Preview', icon: Users },
  ];

  let items = candidateNav;
  if (role === 'recruiter') items = recruiterNav;
  if (role === 'admin') items = adminNav;

  return (
    <aside
      style={{
        width: '240px',
        borderRight: '1px solid var(--border-primary)',
        background: 'var(--bg-secondary)',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.25rem 0.75rem',
        gap: '0.4rem',
        minHeight: 'calc(100vh - 68px)',
      }}
    >
      <div style={{ padding: '0 0.5rem 0.75rem', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.08em', fontWeight: 700 }}>
        Navigation
      </div>

      {items.map((item) => {
        const Icon = item.icon;
        const isActive = currentView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: isActive ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(99, 102, 241, 0.15) 100%)' : 'transparent',
              color: isActive ? '#60a5fa' : 'var(--text-secondary)',
              fontWeight: isActive ? 600 : 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease',
              borderLeft: isActive ? '3px solid #3b82f6' : '3px solid transparent',
            }}
          >
            <Icon size={18} color={isActive ? '#60a5fa' : 'currentColor'} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </aside>
  );
};
