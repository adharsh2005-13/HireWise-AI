import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { JobApplication, Job } from '../types';
import { ScoreMeter } from '../components/ScoreMeter';
import { SkillBadge } from '../components/SkillBadge';
import { 
  Users, Search, Filter, CheckCircle2, XCircle, Clock, 
  FileText, Sparkles, Shield, ChevronRight, X 
} from 'lucide-react';

interface CandidateSearchPageProps {
  filterJobId?: number;
  applicationId?: number;
  onNavigate: (view: string, context?: any) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const CandidateSearchPage: React.FC<CandidateSearchPageProps> = ({ filterJobId, applicationId, onNavigate, showToast }) => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);
  const [aiSummary, setAiSummary] = useState<any | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [recruiterNote, setRecruiterNote] = useState('');

  useEffect(() => {
    loadApplications();
  }, [filterJobId]);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const data = await api.listApplications(filterJobId);
      setApplications(data);
      if (applicationId) {
        const found = data.find(a => a.id === applicationId);
        if (found) selectApplication(found);
      } else if (data.length > 0) {
        selectApplication(data[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const selectApplication = async (app: JobApplication) => {
    setSelectedApp(app);
    setRecruiterNote(app.recruiter_notes || '');
    setAiSummary(null);
    setLoadingSummary(true);

    try {
      const summary = await api.getRecruiterSummary(app.id);
      setAiSummary(summary);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedApp) return;
    try {
      await api.updateApplicationStatus(selectedApp.id, newStatus, recruiterNote);
      showToast(`Candidate status updated to ${newStatus.toUpperCase()}`, 'success');
      // Update local state
      setSelectedApp({ ...selectedApp, status: newStatus as any, recruiter_notes: recruiterNote });
      setApplications(prev => prev.map(a => a.id === selectedApp.id ? { ...a, status: newStatus as any, recruiter_notes: recruiterNote } : a));
    } catch (e: any) {
      showToast(e.message || 'Failed to update status', 'error');
    }
  };

  const filtered = applications.filter((app) => {
    const nameMatch = app.candidate?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const jobMatch = app.job?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const statusMatch = statusFilter === 'All' || app.status === statusFilter;
    return (nameMatch || jobMatch) && statusMatch;
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.25rem' }}>
          Candidate Review & Search
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Inspect candidate qualifications, explainable match breakdown, and AI evidence summaries
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '13px' }} />
          <input
            type="text"
            className="input-field"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search applicants by name or target role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="input-field"
          style={{ width: 'auto' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Pipeline Stages</option>
          <option value="applied">Applied</option>
          <option value="under_review">Under Review</option>
          <option value="shortlisted">Shortlisted</option>
          <option value="interview_scheduled">Interview Scheduled</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Two-Column Master / Detail Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.35fr', gap: '1.5rem' }}>
        {/* Left: Applicant List */}
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '780px', overflowY: 'auto' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-primary)' }}>
            Applicants ({filtered.length})
          </h3>

          {filtered.length > 0 ? (
            filtered.map((app) => {
              const isSelected = selectedApp?.id === app.id;
              return (
                <div
                  key={app.id}
                  onClick={() => selectApplication(app)}
                  className="glass-card-interactive"
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-primary)',
                    background: isSelected ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-surface)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{app.candidate?.name || 'Applicant'}</h4>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: app.match_score >= 75 ? 'var(--success)' : '#60a5fa' }}>
                      {Math.round(app.match_score)}%
                    </span>
                  </div>
                  <p style={{ fontSize: '0.825rem', color: '#60a5fa', fontWeight: 600 }}>{app.job?.title}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    {app.candidate?.headline || 'Candidate'} • Applied {new Date(app.applied_at).toLocaleDateString()}
                  </p>
                </div>
              );
            })
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1rem' }}>No candidates match filters.</p>
          )}
        </div>

        {/* Right: Selected Candidate Detail & AI Summary */}
        {selectedApp ? (
          <div className="glass-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '780px', overflowY: 'auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <span className={`badge ${selectedApp.status === 'shortlisted' ? 'badge-green' : selectedApp.status === 'rejected' ? 'badge-red' : 'badge-blue'}`} style={{ marginBottom: '0.4rem' }}>
                  {selectedApp.status.toUpperCase()}
                </span>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{selectedApp.candidate?.name}</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {selectedApp.candidate?.email} • {selectedApp.candidate?.headline}
                </p>
                <p style={{ fontSize: '0.85rem', color: '#60a5fa', marginTop: '0.25rem' }}>
                  Applying for: <strong>{selectedApp.job?.title}</strong>
                </p>
              </div>

              <ScoreMeter score={selectedApp.match_score} size={84} label="Match Score" />
            </div>

            {/* AI Recruitment Summary Module (Section 8.E) */}
            <div style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: 'var(--radius-md)', borderLeft: '3px solid #8b5cf6' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#c084fc', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Sparkles size={16} /> AI Evidence-Based Candidate Summary
                </h4>
                <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>AI Agent Verified</span>
              </div>

              {loadingSummary ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Generating qualification synthesis...</p>
              ) : aiSummary ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {aiSummary.executive_summary}
                  </p>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#34d399' }}>Demonstrated Required Skills: </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {(aiSummary.demonstrated_core_skills || []).join(', ') || 'None verified'}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f87171' }}>Missing / Unverified: </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {(aiSummary.unverified_or_missing_skills || []).join(', ') || 'None'}
                    </span>
                  </div>
                  <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', color: '#60a5fa' }}>
                    <strong>Agent Recommendation:</strong> {aiSummary.recruiter_recommendation}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Human Recruiter Decision Actions */}
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Recruiter Evaluation & Pipeline Action
              </h4>
              <textarea
                className="input-field"
                rows={3}
                placeholder="Add private recruiter interview notes or screening feedback..."
                value={recruiterNote}
                onChange={(e) => setRecruiterNote(e.target.value)}
                style={{ marginBottom: '0.75rem' }}
              />

              <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleUpdateStatus('shortlisted')}
                  className="btn btn-primary btn-sm"
                  style={{ gap: '0.35rem' }}
                >
                  <CheckCircle2 size={14} />
                  <span>Shortlist for Interview</span>
                </button>
                <button
                  onClick={() => handleUpdateStatus('interview_scheduled')}
                  className="btn btn-secondary btn-sm"
                  style={{ gap: '0.35rem' }}
                >
                  <Clock size={14} />
                  <span>Schedule Technical Screen</span>
                </button>
                <button
                  onClick={() => handleUpdateStatus('rejected')}
                  className="btn btn-danger btn-sm"
                  style={{ gap: '0.35rem' }}
                >
                  <XCircle size={14} />
                  <span>Reject Candidate</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Select an applicant to review qualifications.
          </div>
        )}
      </div>
    </div>
  );
};
