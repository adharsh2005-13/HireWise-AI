import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Job, SkillGapData, LearningResource } from '../types';
import { SkillBadge } from '../components/SkillBadge';
import { 
  GitCompare, ExternalLink, BookOpen, Layers, CheckCircle2, 
  AlertTriangle, Milestone, FolderGit2, ArrowRight, Compass 
} from 'lucide-react';

interface SkillGapAnalysisPageProps {
  jobId?: number;
  onNavigate: (view: string, context?: any) => void;
}

export const SkillGapAnalysisPage: React.FC<SkillGapAnalysisPageProps> = ({ jobId, onNavigate }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number>(jobId || 0);
  const [gapData, setGapData] = useState<SkillGapData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    if (selectedJobId > 0) {
      loadGapAnalysis(selectedJobId);
    }
  }, [selectedJobId]);

  const loadJobs = async () => {
    try {
      const list = await api.listJobs();
      setJobs(list);
      if (list.length > 0 && !selectedJobId) {
        setSelectedJobId(jobId || list[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadGapAnalysis = async (id: number) => {
    setLoading(true);
    try {
      const data = await api.analyzeSkillGap(id);
      setGapData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header & Target Role Selector */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.25rem' }}>Targeted Skill Gap Analysis</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Identify specific skill deficiencies against target roles with curated, verified learning resources
          </p>
        </div>

        {jobs.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Target Job:</span>
            <select
              className="input-field"
              style={{ width: 'auto', fontWeight: 600 }}
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(parseInt(e.target.value))}
            >
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} ({j.company})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Comparing your resume profile against target job prerequisites...
        </div>
      ) : gapData ? (
        <>
          {/* Top Readiness Score Card */}
          <div className="glass-card" style={{ padding: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div>
              <span className="badge badge-blue" style={{ marginBottom: '0.4rem' }}>Target Role Alignment</span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{gapData.job_title}</h2>
              <p style={{ color: '#60a5fa', fontWeight: 600 }}>{gapData.company}</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                You have demonstrated {gapData.demonstrated_skills.length} skills. {gapData.missing_required_skills.length} mandatory and {gapData.missing_preferred_skills.length} preferred skills remain.
              </p>
            </div>

            <div style={{ textAlign: 'center', padding: '0 1rem' }}>
              <div style={{ fontSize: '2.25rem', fontWeight: 800, color: gapData.readiness_percentage >= 70 ? 'var(--success)' : '#60a5fa' }}>
                {Math.round(gapData.readiness_percentage)}%
              </div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', fontWeight: 600 }}>
                Role Readiness
              </div>
            </div>
          </div>

          {/* Skill Breakdown Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.85rem' }}>
                <CheckCircle2 size={16} /> Skills Already Demonstrated ({gapData.demonstrated_skills.length})
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {gapData.demonstrated_skills.map((s, i) => (
                  <SkillBadge key={i} name={s} variant="matching" />
                ))}
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.85rem' }}>
                <AlertTriangle size={16} /> Missing Required Skills ({gapData.missing_required_skills.length})
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {gapData.missing_required_skills.length > 0 ? (
                  gapData.missing_required_skills.map((s, i) => (
                    <SkillBadge key={i} name={s} variant="missing" />
                  ))
                ) : (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>None! You satisfy all required skills.</p>
                )}
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#c084fc', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.85rem' }}>
                <Layers size={16} /> Preferred Skills to Acquire ({gapData.missing_preferred_skills.length})
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {gapData.missing_preferred_skills.length > 0 ? (
                  gapData.missing_preferred_skills.map((s, i) => (
                    <SkillBadge key={i} name={s} variant="preferred" />
                  ))
                ) : (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>None remaining.</p>
                )}
              </div>
            </div>
          </div>

          {/* Verified Learning Resources Catalog */}
          <div className="glass-card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={20} color="#3b82f6" /> Verified Learning Catalog
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Official documentation and structured courses to close identified gaps effectively.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {gapData.curated_resources.map((res, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'var(--bg-surface)',
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <span className="badge badge-blue">{res.skill_name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{res.difficulty}</span>
                    </div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {res.title}
                    </h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      Provider: {res.provider} • {res.resource_type}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem', lineHeight: 1.5 }}>
                      {res.description}
                    </p>
                  </div>

                  <a
                    href={res.url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-outline btn-sm"
                    style={{ alignSelf: 'flex-start', gap: '0.4rem' }}
                  >
                    <span>Open Documentation</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Practice Project Ideas */}
          <div className="glass-card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FolderGit2 size={20} color="#10b981" /> Portfolio Practice Project Ideas
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Concrete project architectures to build and showcase on GitHub to substantiate missing skills.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
              {gapData.practice_project_ideas.map((proj, idx) => (
                <div key={idx} style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{proj.title}</h4>
                    <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>{proj.duration}</span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#60a5fa', fontWeight: 600, marginBottom: '0.5rem' }}>
                    Technologies: {proj.skills_involved}
                  </p>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {proj.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Step-by-Step Learning Roadmap */}
          <div className="glass-card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Milestone size={20} color="#8b5cf6" /> Step-by-Step Roadmap Milestones
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {gapData.roadmap_milestones.map((ms, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    padding: '1rem',
                    background: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-md)',
                    borderLeft: '4px solid #8b5cf6',
                  }}
                >
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc', fontWeight: 700, fontSize: '0.85rem' }}>
                    {idx + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{ms.phase}</h4>
                      <span className="badge badge-gray">{ms.duration}</span>
                    </div>
                    <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      {ms.goal}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
