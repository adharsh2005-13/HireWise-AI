import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { JobApplication } from '../types';
import { ScoreMeter } from '../components/ScoreMeter';
import { Briefcase, Calendar, CheckCircle2, Clock, XCircle, ArrowRight, MapPin } from 'lucide-react';

interface ApplicationTrackingPageProps {
  onNavigate: (view: string, context?: any) => void;
}

export const ApplicationTrackingPage: React.FC<ApplicationTrackingPageProps> = ({ onNavigate }) => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const data = await api.listApplications();
      setApplications(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'shortlisted':
        return <span className="badge badge-green"><CheckCircle2 size={12} /> Shortlisted</span>;
      case 'interview_scheduled':
        return <span className="badge badge-purple"><Clock size={12} /> Interview Scheduled</span>;
      case 'under_review':
        return <span className="badge badge-blue"><Clock size={12} /> Under Review</span>;
      case 'rejected':
        return <span className="badge badge-red"><XCircle size={12} /> Closed</span>;
      case 'hired':
        return <span className="badge badge-green"><CheckCircle2 size={12} /> Hired 🎉</span>;
      default:
        return <span className="badge badge-gray"><Clock size={12} /> Applied</span>;
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.25rem' }}>My Applications Pipeline</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Track the status of your submitted job applications and recruiter review updates
        </p>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading your applications...
        </div>
      ) : applications.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {applications.map((app) => (
            <div
              key={app.id}
              className="glass-card"
              style={{
                padding: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <ScoreMeter score={app.match_score} size={70} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{app.job?.title || 'Job Opening'}</h3>
                    {getStatusBadge(app.status)}
                  </div>
                  <p style={{ fontSize: '0.9rem', color: '#60a5fa', fontWeight: 600 }}>
                    {app.job?.company} • {app.job?.location}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                    Applied on {new Date(app.applied_at).toLocaleDateString()}
                  </p>

                  {app.recruiter_notes && (
                    <div style={{ marginTop: '0.5rem', background: 'var(--bg-surface)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <strong>Recruiter Note:</strong> {app.recruiter_notes}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {app.job_id && (
                  <button
                    onClick={() => onNavigate('job_detail', { jobId: app.job_id })}
                    className="btn btn-outline btn-sm"
                  >
                    View Job
                  </button>
                )}
                {app.job_id && (
                  <button
                    onClick={() => onNavigate('skill_gap', { jobId: app.job_id })}
                    className="btn btn-secondary btn-sm"
                  >
                    Check Skill Gaps
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <Briefcase size={44} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>No Applications Submitted Yet</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Browse open positions on the Job Discovery Radar and submit your resume with one click!
          </p>
          <button onClick={() => onNavigate('job_discovery')} className="btn btn-primary">
            Explore Openings
          </button>
        </div>
      )}
    </div>
  );
};
