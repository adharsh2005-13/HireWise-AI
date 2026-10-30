import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Resume, Job } from '../types';
import { StatCard } from '../components/StatCard';
import { ScoreMeter } from '../components/ScoreMeter';
import { SkillBadge } from '../components/SkillBadge';
import { 
  FileText, Briefcase, CheckCircle2, TrendingUp, Upload, 
  ArrowRight, Compass, Bot, HelpCircle, AlertCircle 
} from 'lucide-react';

interface CandidateDashboardProps {
  onNavigate: (view: string, context?: any) => void;
}

export const CandidateDashboard: React.FC<CandidateDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resList, recs, apps] = await Promise.all([
        api.listResumes(),
        api.getRecommendations(),
        api.listApplications(),
      ]);
      setResumes(resList);
      setRecommendations(recs);
      setApplications(apps);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const primaryResume = resumes.find(r => r.is_primary) || resumes[0];
  const avgScore = recommendations.length > 0 
    ? Math.round(recommendations.reduce((acc, r) => acc + r.total_score, 0) / recommendations.length)
    : 0;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Welcome Banner */}
      <div
        className="glass-card"
        style={{
          padding: '1.75rem 2rem',
          background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.4) 0%, rgba(30, 27, 75, 0.4) 100%)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            Welcome back, {user?.full_name}! 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            {primaryResume 
              ? `Your resume (${primaryResume.filename}) is active with a completeness score of ${primaryResume.completeness_score}%.` 
              : 'Upload your resume to unlock AI job matching, skill gap roadmaps, and mock interviews.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => onNavigate('resume_upload')} className="btn btn-primary" style={{ gap: '0.5rem' }}>
            <Upload size={16} />
            <span>Upload Resume</span>
          </button>
          <button onClick={() => onNavigate('career_chat')} className="btn btn-secondary" style={{ gap: '0.5rem' }}>
            <Bot size={16} />
            <span>Career Assistant</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <StatCard
          title="Active Resumes"
          value={resumes.length}
          subtitle={primaryResume ? 'Primary Active' : 'None uploaded'}
          icon={FileText}
          color="#3b82f6"
        />
        <StatCard
          title="Avg Matching Score"
          value={avgScore > 0 ? `${avgScore}%` : 'N/A'}
          subtitle="Across active listings"
          icon={TrendingUp}
          color="#10b981"
        />
        <StatCard
          title="Job Recommendations"
          value={recommendations.length}
          subtitle="Ranked by relevance"
          icon={Compass}
          color="#8b5cf6"
        />
        <StatCard
          title="Submitted Applications"
          value={applications.length}
          subtitle="Active pipeline"
          icon={Briefcase}
          color="#f59e0b"
        />
      </div>

      {/* Main Grid: Resume Overview + Top Recommendations */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Primary Resume Intelligence Card */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={18} color="#3b82f6" /> Resume Intelligence
            </h3>
            {primaryResume && (
              <button onClick={() => onNavigate('resume_analysis', { resumeId: primaryResume.id })} className="btn btn-outline btn-sm">
                Full Analysis
              </button>
            )}
          </div>

          {primaryResume ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.25rem' }}>
                <ScoreMeter score={primaryResume.completeness_score} size={84} label="Completeness" />
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>{primaryResume.filename}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Uploaded on {new Date(primaryResume.created_at).toLocaleDateString()}
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <span className="badge badge-green">
                      <CheckCircle2 size={12} /> {primaryResume.parsed_data?.skills?.length || 0} Skills Extracted
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Extracted Skills Preview:
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {(primaryResume.parsed_data?.skills || []).slice(0, 10).map((s: any, idx: number) => (
                    <SkillBadge key={idx} name={s.name} category={s.category} size="sm" />
                  ))}
                  {(primaryResume.parsed_data?.skills || []).length > 10 && (
                    <span className="badge badge-gray" style={{ fontSize: '0.7rem' }}>
                      +{(primaryResume.parsed_data?.skills || []).length - 10} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <AlertCircle size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                You haven't uploaded a resume yet. Upload one to get started!
              </p>
              <button onClick={() => onNavigate('resume_upload')} className="btn btn-primary btn-sm">
                Upload Resume Now
              </button>
            </div>
          )}
        </div>

        {/* Quick Career Tools Card */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>AI Career Acceleration Tools</h3>
          
          <div
            onClick={() => onNavigate('career_chat')}
            className="glass-card-interactive"
            style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
                <Bot size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>RAG Career Advisor</h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Ask questions grounded in verified career guides</p>
              </div>
            </div>
            <ArrowRight size={16} color="var(--text-muted)" />
          </div>

          <div
            onClick={() => onNavigate('interview_prep')}
            className="glass-card-interactive"
            style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24' }}>
                <HelpCircle size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Interview Prep & Scoring</h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Role-tailored technical & HR mock sessions</p>
              </div>
            </div>
            <ArrowRight size={16} color="var(--text-muted)" />
          </div>

          <div
            onClick={() => onNavigate('job_discovery')}
            className="glass-card-interactive"
            style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
                <Compass size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Job Discovery & Match Radar</h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Explore openings with explainable scores</p>
              </div>
            </div>
            <ArrowRight size={16} color="var(--text-muted)" />
          </div>
        </div>
      </div>

      {/* Top Job Recommendations Preview */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Top Recommended Jobs for You</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Ranked dynamically by your required skill overlap and semantic match
            </p>
          </div>
          <button onClick={() => onNavigate('job_discovery')} className="btn btn-secondary btn-sm" style={{ gap: '0.4rem' }}>
            <span>Explore All</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {recommendations.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {recommendations.slice(0, 3).map((rec, index) => (
              <div
                key={index}
                style={{
                  padding: '1.25rem',
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <ScoreMeter score={rec.total_score} size={70} />
                  <div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{rec.job.title}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {rec.job.company} • {rec.job.location} • {rec.job.salary_range}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.5rem' }}>
                      {rec.matching_skills.slice(0, 4).map((s: string, sIdx: number) => (
                        <SkillBadge key={sIdx} name={s} variant="matching" size="sm" />
                      ))}
                      {rec.missing_skills.slice(0, 2).map((s: string, sIdx: number) => (
                        <SkillBadge key={sIdx} name={s} variant="missing" size="sm" />
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => onNavigate('job_match_explanation', { job: rec.job, matchData: rec })}
                    className="btn btn-outline btn-sm"
                  >
                    Score Breakdown
                  </button>
                  <button
                    onClick={() => onNavigate('skill_gap', { jobId: rec.job.id })}
                    className="btn btn-secondary btn-sm"
                  >
                    Skill Gaps
                  </button>
                  <button
                    onClick={() => onNavigate('job_detail', { jobId: rec.job.id })}
                    className="btn btn-primary btn-sm"
                  >
                    View Job
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ color: 'var(--text-muted)' }}>No jobs currently available.</p>
          </div>
        )}
      </div>
    </div>
  );
};
