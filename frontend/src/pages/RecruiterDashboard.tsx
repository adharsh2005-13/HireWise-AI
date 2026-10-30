import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Job, JobApplication } from '../types';
import { StatCard } from '../components/StatCard';
import { ScoreMeter } from '../components/ScoreMeter';
import { 
  Briefcase, Users, CheckCircle2, TrendingUp, PlusCircle, 
  ArrowRight, Clock, MapPin, Eye, FileText 
} from 'lucide-react';

interface RecruiterDashboardProps {
  onNavigate: (view: string, context?: any) => void;
}

export const RecruiterDashboard: React.FC<RecruiterDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecruiterData();
  }, []);

  const loadRecruiterData = async () => {
    setLoading(true);
    try {
      const [jobList, appList] = await Promise.all([
        api.getMyJobPostings(),
        api.listApplications(),
      ]);
      setJobs(jobList);
      setApplications(appList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const shortlistedCount = applications.filter(a => a.status === 'shortlisted' || a.status === 'hired').length;
  const avgMatch = applications.length > 0
    ? Math.round(applications.reduce((acc, a) => acc + a.match_score, 0) / applications.length)
    : 0;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Welcome Banner */}
      <div
        className="glass-card"
        style={{
          padding: '1.75rem 2rem',
          background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.4) 0%, rgba(17, 24, 39, 0.4) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            Recruiter Portal — {user?.profile?.company_name || 'CloudScale Technologies'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Manage active job listings, review explainable AI candidate matches, and streamline shortlisting.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => onNavigate('job_management', { createNew: true })} className="btn btn-primary" style={{ gap: '0.5rem' }}>
            <PlusCircle size={16} />
            <span>Post New Job</span>
          </button>
          <button onClick={() => onNavigate('candidate_search')} className="btn btn-secondary" style={{ gap: '0.5rem' }}>
            <Users size={16} />
            <span>Review Applicants</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <StatCard
          title="Active Postings"
          value={jobs.length}
          subtitle="Currently published"
          icon={Briefcase}
          color="#3b82f6"
        />
        <StatCard
          title="Total Applicants"
          value={applications.length}
          subtitle="Inbound candidates"
          icon={Users}
          color="#10b981"
        />
        <StatCard
          title="Shortlisted Candidates"
          value={shortlistedCount}
          subtitle={`${applications.length > 0 ? Math.round((shortlistedCount / applications.length) * 100) : 0}% acceptance rate`}
          icon={CheckCircle2}
          color="#8b5cf6"
        />
        <StatCard
          title="Avg Candidate Match"
          value={avgMatch > 0 ? `${avgMatch}%` : 'N/A'}
          subtitle="Across all submissions"
          icon={TrendingUp}
          color="#f59e0b"
        />
      </div>

      {/* Recent Applications Pipeline */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Recent Candidate Submissions</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Candidates scored deterministically by skill overlap and experience relevance
            </p>
          </div>
          <button onClick={() => onNavigate('candidate_search')} className="btn btn-secondary btn-sm" style={{ gap: '0.4rem' }}>
            <span>View All Applicants</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {applications.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {applications.slice(0, 5).map((app) => (
              <div
                key={app.id}
                style={{
                  padding: '1rem 1.25rem',
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <ScoreMeter score={app.match_score} size={64} />
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>
                      {app.candidate?.name || 'Applicant'}
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: '#60a5fa' }}>
                      Applied for: <strong>{app.job?.title || 'Job Opening'}</strong>
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {app.candidate?.headline || 'Candidate'} • Applied {new Date(app.applied_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span className={`badge ${app.status === 'shortlisted' ? 'badge-green' : app.status === 'rejected' ? 'badge-red' : 'badge-blue'}`}>
                    {app.status.toUpperCase()}
                  </span>
                  <button
                    onClick={() => onNavigate('candidate_search', { applicationId: app.id })}
                    className="btn btn-primary btn-sm"
                    style={{ gap: '0.4rem' }}
                  >
                    <Eye size={13} />
                    <span>Review Candidate</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2.5rem' }}>
            <p style={{ color: 'var(--text-muted)' }}>No candidate applications received yet.</p>
          </div>
        )}
      </div>

      {/* Active Job Postings List */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Your Active Job Postings</h3>
          <button onClick={() => onNavigate('job_management')} className="btn btn-outline btn-sm">
            Manage Listings
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {jobs.map((job) => (
            <div key={job.id} style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{job.title}</h4>
                <span className="badge badge-green">Active</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.35rem 0 0.75rem' }}>
                {job.location} • {job.salary_range}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border-primary)' }}>
                <span style={{ fontSize: '0.8rem', color: '#60a5fa', fontWeight: 600 }}>
                  {job.applicant_count || 0} Applicants
                </span>
                <button
                  onClick={() => onNavigate('candidate_search', { filterJobId: job.id })}
                  className="btn btn-secondary btn-sm"
                >
                  View Applicants
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
