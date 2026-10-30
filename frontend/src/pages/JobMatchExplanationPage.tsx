import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Job, MatchResult } from '../types';
import { ScoreMeter } from '../components/ScoreMeter';
import { SkillBadge } from '../components/SkillBadge';
import { ArrowLeft, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, Sparkles, BookOpen } from 'lucide-react';

interface JobMatchExplanationPageProps {
  job?: Job;
  matchData?: MatchResult;
  onNavigate: (view: string, context?: any) => void;
}

export const JobMatchExplanationPage: React.FC<JobMatchExplanationPageProps> = ({ job, matchData, onNavigate }) => {
  const [data, setData] = useState<MatchResult | null>(matchData || null);
  const [currentJob, setCurrentJob] = useState<Job | null>(job || null);
  const [loading, setLoading] = useState(!matchData);

  useEffect(() => {
    if (!matchData && job?.id) {
      api.analyzeMatch(job.id).then(m => {
        setData(m);
        setCurrentJob(m.job || job);
        setLoading(false);
      }).catch(err => {
        console.error(err);
        setLoading(false);
      });
    }
  }, [job, matchData]);

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center' }}>Calculating explainable match breakdown...</div>;
  }

  if (!data || !currentJob) {
    return (
      <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>No match data available. Please select a job from Job Discovery.</p>
        <button onClick={() => onNavigate('job_discovery')} className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Back to Jobs
        </button>
      </div>
    );
  }

  const breakdown = data.breakdown || {
    required_skill_score: 0,
    semantic_score: 0,
    experience_score: 0,
    preferred_skill_score: 0
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <button onClick={() => onNavigate('job_discovery')} className="btn btn-outline btn-sm" style={{ alignSelf: 'flex-start', gap: '0.4rem' }}>
        <ArrowLeft size={15} /> Back to Job Discovery
      </button>

      {/* Hero Overview */}
      <div className="glass-card" style={{ padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <span className="badge badge-purple" style={{ marginBottom: '0.5rem' }}>Explainable AI Audit</span>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.25rem' }}>Match Breakdown: {currentJob.title}</h1>
          <p style={{ color: '#60a5fa', fontWeight: 600 }}>{currentJob.company} • {currentJob.location}</p>
        </div>

        <ScoreMeter score={data.total_score} size={96} label="Overall Match" />
      </div>

      {/* Multi-Factor Weight Formula Card */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Weighted Multi-Factor Formula</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Configurable Default Model</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          <div style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: 'var(--radius-md)', borderTop: '3px solid #3b82f6' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>REQUIRED SKILLS (40%)</p>
            <h4 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#60a5fa', margin: '0.25rem 0' }}>
              {breakdown.required_skill_score}%
            </h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Overlap with mandatory requirements</p>
          </div>

          <div style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: 'var(--radius-md)', borderTop: '3px solid #10b981' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>SEMANTIC SIMILARITY (30%)</p>
            <h4 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399', margin: '0.25rem 0' }}>
              {breakdown.semantic_score}%
            </h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Resume vs job vector relevance</p>
          </div>

          <div style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: 'var(--radius-md)', borderTop: '3px solid #8b5cf6' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>EXPERIENCE & PROJECTS (20%)</p>
            <h4 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#c084fc', margin: '0.25rem 0' }}>
              {breakdown.experience_score}%
            </h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Tenure and demonstrated projects</p>
          </div>

          <div style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: 'var(--radius-md)', borderTop: '3px solid #f59e0b' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>PREFERRED SKILLS (10%)</p>
            <h4 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fbbf24', margin: '0.25rem 0' }}>
              {breakdown.preferred_skill_score}%
            </h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Bonus nice-to-have competencies</p>
          </div>
        </div>
      </div>

      {/* Skills Audit: Demonstrated vs Gaps */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#34d399' }}>
            <CheckCircle2 size={18} /> Demonstrated Matching Skills ({data.matching_skills.length})
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {data.matching_skills.length > 0 ? (
              data.matching_skills.map((sk, idx) => (
                <SkillBadge key={idx} name={sk} variant="matching" />
              ))
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No direct skill overlaps identified.</p>
            )}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#f87171' }}>
            <AlertTriangle size={18} /> Missing or Unsubstantiated Skills ({data.missing_skills.length})
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {data.missing_skills.length > 0 ? (
              data.missing_skills.map((sk, idx) => (
                <SkillBadge key={idx} name={sk} variant="missing" />
              ))
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>All required skills are substantiated on your resume!</p>
            )}
          </div>
        </div>
      </div>

      {/* Narrative Explanation & Recommended Next Steps */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.75rem' }}>AI Matching Explanation</h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.95rem', marginBottom: '1.5rem' }}>
          {data.explanation}
        </p>

        <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', color: '#60a5fa' }}>
          Recommended Next Steps
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {data.recommended_steps.map((step, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              <ArrowRight size={15} color="#3b82f6" style={{ marginTop: '3px', flexShrink: 0 }} />
              <span>{step}</span>
            </div>
          ))}
        </div>

        {/* Ethical Non-Discriminatory Notice */}
        <div style={{ background: 'var(--bg-surface)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', borderLeft: '3px solid #10b981', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <ShieldCheck size={20} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h5 style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
              Ethical AI & Non-Discriminatory Hiring Compliance
            </h5>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              HireWise AI scores candidates based on documented technical qualifications, skill overlap, and verified project evidence only. No protected demographic characteristics (race, gender, religion, age, or photographs) are collected or used in score calculation. This score is an alignment indicator and does not represent an absolute probability or guarantee of employment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
