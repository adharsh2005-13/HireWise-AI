import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Resume } from '../types';
import { ScoreMeter } from '../components/ScoreMeter';
import { SkillBadge } from '../components/SkillBadge';
import { 
  FileText, CheckCircle2, AlertTriangle, Lightbulb, GraduationCap, 
  Briefcase, FolderGit2, Trash2, ArrowRight, User 
} from 'lucide-react';

interface ResumeAnalysisPageProps {
  resumeId?: number;
  onNavigate: (view: string, context?: any) => void;
}

export const ResumeAnalysisPage: React.FC<ResumeAnalysisPageProps> = ({ resumeId, onNavigate }) => {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResumes();
  }, [resumeId]);

  const loadResumes = async () => {
    setLoading(true);
    try {
      const list = await api.listResumes();
      setResumes(list);
      if (resumeId) {
        const found = list.find(r => r.id === resumeId);
        setSelectedResume(found || list[0] || null);
      } else {
        setSelectedResume(list.find(r => r.is_primary) || list[0] || null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this resume?')) return;
    try {
      await api.deleteResume(id);
      loadResumes();
    } catch (e) {
      alert('Failed to delete resume');
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading resume analysis...</div>;
  }

  if (!selectedResume) {
    return (
      <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
        <FileText size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>No Resume Found</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Upload your resume to view AI-extracted skills, categories, and completeness indicators.
        </p>
        <button onClick={() => onNavigate('resume_upload')} className="btn btn-primary">
          Upload Resume
        </button>
      </div>
    );
  }

  const parsed = selectedResume.parsed_data || {};
  const categories = parsed.technical_categories || {};

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header and Resume Selector */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.25rem' }}>Resume Intelligence Analysis</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Structured breakdown of qualifications, skills, and ATS optimization suggestions
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {resumes.length > 1 && (
            <select
              className="input-field"
              style={{ width: 'auto' }}
              value={selectedResume.id}
              onChange={(e) => {
                const target = resumes.find(r => r.id === parseInt(e.target.value));
                if (target) setSelectedResume(target);
              }}
            >
              {resumes.map(r => (
                <option key={r.id} value={r.id}>
                  {r.filename} {r.is_primary ? '(Primary)' : ''}
                </option>
              ))}
            </select>
          )}

          <button onClick={() => handleDelete(selectedResume.id)} className="btn btn-danger btn-sm" title="Delete Resume">
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Top Banner: Overview & Completeness */}
      <div className="glass-card" style={{ padding: '1.75rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <ScoreMeter score={selectedResume.completeness_score} size={90} label="Completeness" />
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              {parsed.candidate_name || 'Candidate Profile'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {parsed.email || 'Email not detected'} • {parsed.phone || 'Phone not detected'}
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.65rem' }}>
              <span className="badge badge-blue">
                {parsed.skills?.length || 0} Total Skills Identified
              </span>
              <span className="badge badge-green">
                ATS Formatted
              </span>
            </div>
          </div>
        </div>

        {/* Completeness Checklist */}
        <div style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.65rem', letterSpacing: '0.05em' }}>
            Completeness Checklist
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.78rem' }}>
            {Object.entries(parsed.completeness_breakdown || {}).map(([key, val]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: val ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {val ? <CheckCircle2 size={13} color="var(--success)" /> : <AlertTriangle size={13} color="var(--warning)" />}
                <span>{key.replace('has_', '').replace('_', ' ').toUpperCase()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Categorized Skills Section */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem' }}>
          Extracted Technical Taxonomy
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {Object.entries(categories).map(([category, skillList]: [string, any]) => (
            <div key={category} style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#60a5fa', marginBottom: '0.75rem' }}>
                {category} ({skillList.length})
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {skillList.map((skill: string, idx: number) => (
                  <SkillBadge key={idx} name={skill} variant="neutral" size="sm" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Experience, Projects & Education Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Experience */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Briefcase size={18} color="#3b82f6" /> Experience History
          </h3>
          {(parsed.experience || []).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {(parsed.experience || []).map((exp: any, i: number) => (
                <div key={i} style={{ borderLeft: '2px solid var(--border-accent)', paddingLeft: '0.85rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{exp.role}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{exp.company} • {exp.duration}</p>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No explicit work history parsed.</p>
          )}
        </div>

        {/* Projects */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <FolderGit2 size={18} color="#10b981" /> Projects & Architecture
          </h3>
          {(parsed.projects || []).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {(parsed.projects || []).map((proj: any, i: number) => (
                <div key={i} style={{ borderLeft: '2px solid rgba(16, 185, 129, 0.4)', paddingLeft: '0.85rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{proj.title}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{proj.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No projects parsed.</p>
          )}
        </div>

        {/* Education */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <GraduationCap size={18} color="#8b5cf6" /> Academic Credentials
          </h3>
          {(parsed.education || []).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {(parsed.education || []).map((edu: any, i: number) => (
                <div key={i} style={{ borderLeft: '2px solid rgba(139, 92, 246, 0.4)', paddingLeft: '0.85rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{edu.degree}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{edu.institution} ({edu.year})</p>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Education details unavailable.</p>
          )}
        </div>
      </div>

      {/* Improvement Suggestions */}
      {(parsed.improvement_suggestions || []).length > 0 && (
        <div className="glass-card" style={{ padding: '1.5rem', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#fbbf24' }}>
            <Lightbulb size={20} /> Actionable Resume Improvements
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {(parsed.improvement_suggestions || []).map((sug: string, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <span style={{ color: '#fbbf24', fontWeight: 700 }}>•</span>
                <span>{sug}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
