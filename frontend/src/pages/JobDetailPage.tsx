import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Job, MatchResult } from '../types';
import { ScoreMeter } from '../components/ScoreMeter';
import { SkillBadge } from '../components/SkillBadge';
import { 
  Briefcase, MapPin, DollarSign, Calendar, CheckCircle2, 
  ArrowLeft, Send, Sparkles, AlertCircle, GitCompare 
} from 'lucide-react';

interface JobDetailPageProps {
  jobId: number;
  onNavigate: (view: string, context?: any) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const JobDetailPage: React.FC<JobDetailPageProps> = ({ jobId, onNavigate, showToast }) => {
  const [job, setJob] = useState<Job | null>(null);
  const [matchData, setMatchData] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    loadJobDetails();
  }, [jobId]);

  const loadJobDetails = async () => {
    setLoading(true);
    try {
      const j = await api.getJob(jobId);
      setJob(j);
      try {
        const m = await api.analyzeMatch(jobId);
        setMatchData(m);
      } catch (_) {}
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    setApplying(true);
    try {
      await api.applyToJob(jobId);
      setApplied(true);
      showToast('Application successfully submitted to recruiter!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Application failed', 'error');
    } finally {
      setApplying(false);
    }
  };

  if (loading || !job) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading job details...</div>;
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <button onClick={() => onNavigate('job_discovery')} className="btn btn-outline btn-sm" style={{ alignSelf: 'flex-start', gap: '0.4rem' }}>
        <ArrowLeft size={15} /> Back to Job Radar
      </button>

      {/* Hero Header */}
      <div className="glass-card" style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <span className="badge badge-blue" style={{ marginBottom: '0.5rem' }}>{job.experience_level}</span>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.35rem' }}>{job.title}</h1>
          <p style={{ fontSize: '1.1rem', color: '#60a5fa', fontWeight: 600 }}>{job.company}</p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <MapPin size={16} /> {job.location}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Briefcase size={16} /> {job.job_type}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <DollarSign size={16} /> {job.salary_range}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Calendar size={16} /> Posted {new Date(job.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {matchData && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <ScoreMeter score={matchData.total_score} size={88} label="Resume Match" />
            <button
              onClick={() => onNavigate('job_match_explanation', { job, matchData })}
              className="btn btn-outline btn-sm"
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
            >
              Explain Match
            </button>
          </div>
        )}
      </div>

      {/* Description & Requirements */}
      <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem' }}>Role Overview</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
            {job.description}
          </p>
        </div>

        {job.requirements && (
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem' }}>Requirements</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
              {job.requirements}
            </p>
          </div>
        )}

        {/* Required Skills */}
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.65rem' }}>
            Mandatory Required Skills ({job.required_skills?.length || 0})
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {(job.required_skills || []).map((sk, idx) => {
              const isMatch = matchData?.matching_skills?.includes(sk);
              return <SkillBadge key={idx} name={sk} variant={isMatch ? 'matching' : 'missing'} />;
            })}
          </div>
        </div>

        {/* Preferred Skills */}
        {(job.preferred_skills || []).length > 0 && (
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.65rem' }}>
              Preferred / Nice-to-Have Skills ({job.preferred_skills.length})
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {job.preferred_skills.map((sk, idx) => (
                <SkillBadge key={idx} name={sk} variant="preferred" />
              ))}
            </div>
          </div>
        )}

        {/* Actions Bar */}
        <div style={{ display: 'flex', gap: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-primary)', flexWrap: 'wrap' }}>
          <button
            onClick={handleApply}
            disabled={applying || applied}
            className="btn btn-primary btn-lg"
            style={{ gap: '0.5rem' }}
          >
            {applied ? <CheckCircle2 size={18} /> : <Send size={18} />}
            <span>{applied ? 'Application Submitted' : applying ? 'Submitting...' : 'Apply for this Position'}</span>
          </button>

          <button
            onClick={() => onNavigate('skill_gap', { jobId: job.id })}
            className="btn btn-secondary btn-lg"
            style={{ gap: '0.5rem' }}
          >
            <GitCompare size={18} />
            <span>Analyze Skill Gap</span>
          </button>
        </div>
      </div>
    </div>
  );
};
