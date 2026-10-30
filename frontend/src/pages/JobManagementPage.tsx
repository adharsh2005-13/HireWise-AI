import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Job } from '../types';
import { SkillBadge } from '../components/SkillBadge';
import { PlusCircle, Trash2, Edit3, Briefcase, MapPin, DollarSign, X, Check } from 'lucide-react';

interface JobManagementPageProps {
  createNew?: boolean;
  onNavigate: (view: string, context?: any) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const JobManagementPage: React.FC<JobManagementPageProps> = ({ createNew = false, onNavigate, showToast }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [showModal, setShowModal] = useState(createNew);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('CloudScale Technologies');
  const [location, setLocation] = useState('Remote');
  const [jobType, setJobType] = useState('Full-time');
  const [experienceLevel, setExperienceLevel] = useState('Mid-level');
  const [salaryRange, setSalaryRange] = useState('$110,000 - $145,000');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [requiredSkills, setRequiredSkills] = useState<string[]>(['React', 'TypeScript', 'Node.js']);
  const [preferredSkills, setPreferredSkills] = useState<string[]>(['Docker', 'PostgreSQL']);
  const [skillInput, setSkillInput] = useState('');
  const [prefSkillInput, setPrefSkillInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const data = await api.getMyJobPostings();
      setJobs(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenCreate = () => {
    setEditingJob(null);
    setTitle('');
    setDescription('');
    setRequirements('');
    setRequiredSkills(['React', 'TypeScript', 'FastAPI']);
    setPreferredSkills(['Docker', 'AWS']);
    setShowModal(true);
  };

  const handleOpenEdit = (job: Job) => {
    setEditingJob(job);
    setTitle(job.title);
    setCompany(job.company);
    setLocation(job.location);
    setJobType(job.job_type);
    setExperienceLevel(job.experience_level);
    setSalaryRange(job.salary_range);
    setDescription(job.description);
    setRequirements(job.requirements || '');
    setRequiredSkills(job.required_skills || []);
    setPreferredSkills(job.preferred_skills || []);
    setShowModal(true);
  };

  const handleAddRequiredSkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      if (!requiredSkills.includes(skillInput.trim())) {
        setRequiredSkills([...requiredSkills, skillInput.trim()]);
      }
      setSkillInput('');
    }
  };

  const handleAddPreferredSkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && prefSkillInput.trim()) {
      e.preventDefault();
      if (!preferredSkills.includes(prefSkillInput.trim())) {
        setPreferredSkills([...preferredSkills, prefSkillInput.trim()]);
      }
      setPrefSkillInput('');
    }
  };

  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;
    setSaving(true);

    try {
      const payload = {
        title,
        company,
        location,
        job_type: jobType,
        experience_level: experienceLevel,
        salary_range: salaryRange,
        description,
        requirements,
        required_skills: requiredSkills,
        preferred_skills: preferredSkills,
      };

      if (editingJob) {
        await api.updateJob(editingJob.id, payload);
        showToast('Job listing updated successfully', 'success');
      } else {
        await api.createJob(payload);
        showToast('New job posted & indexed in RAG knowledge store!', 'success');
      }

      setShowModal(false);
      loadJobs();
    } catch (err: any) {
      showToast(err.message || 'Failed to save job', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this job posting?')) return;
    try {
      await api.deleteJob(id);
      showToast('Job listing deleted', 'info');
      loadJobs();
    } catch (e) {
      showToast('Failed to delete job', 'error');
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.25rem' }}>Manage Job Listings</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Publish openings, define mandatory competencies, and track candidate pipeline
          </p>
        </div>

        <button onClick={handleOpenCreate} className="btn btn-primary" style={{ gap: '0.5rem' }}>
          <PlusCircle size={16} />
          <span>Post New Job</span>
        </button>
      </div>

      {/* Jobs Table */}
      <div className="glass-card" style={{ padding: '1.5rem', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-primary)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '0.75rem' }}>JOB TITLE</th>
              <th style={{ padding: '0.75rem' }}>EXPERIENCE</th>
              <th style={{ padding: '0.75rem' }}>LOCATION</th>
              <th style={{ padding: '0.75rem' }}>APPLICANTS</th>
              <th style={{ padding: '0.75rem' }}>REQUIRED SKILLS</th>
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                <td style={{ padding: '1rem 0.75rem' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{job.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{job.company}</div>
                </td>
                <td style={{ padding: '1rem 0.75rem' }}>
                  <span className="badge badge-blue">{job.experience_level}</span>
                </td>
                <td style={{ padding: '1rem 0.75rem', color: 'var(--text-secondary)' }}>{job.location}</td>
                <td style={{ padding: '1rem 0.75rem' }}>
                  <button
                    onClick={() => onNavigate('candidate_search', { filterJobId: job.id })}
                    style={{ background: 'none', border: 'none', color: '#60a5fa', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    {job.applicant_count || 0} Candidates
                  </button>
                </td>
                <td style={{ padding: '1rem 0.75rem' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                    {(job.required_skills || []).slice(0, 3).map((sk, i) => (
                      <SkillBadge key={i} name={sk} size="sm" />
                    ))}
                    {(job.required_skills || []).length > 3 && (
                      <span className="badge badge-gray" style={{ fontSize: '0.7rem' }}>
                        +{(job.required_skills || []).length - 3}
                      </span>
                    )}
                  </div>
                </td>
                <td style={{ padding: '1rem 0.75rem', textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                    <button onClick={() => handleOpenEdit(job)} className="btn btn-secondary btn-sm" title="Edit">
                      <Edit3 size={13} />
                    </button>
                    <button onClick={() => handleDelete(job.id)} className="btn btn-danger btn-sm" title="Delete">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal: Create/Edit Job */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1.5rem',
          }}
        >
          <div
            className="glass-card animate-fade-in"
            style={{
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                {editingJob ? 'Edit Job Posting' : 'Post New Job Opening'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveJob} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Job Title
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="e.g. Senior Full-Stack Engineer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Company Name
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Location
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Remote or City, State"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Job Type
                  </label>
                  <select className="input-field" value={jobType} onChange={(e) => setJobType(e.target.value)}>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Experience Level
                  </label>
                  <select className="input-field" value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)}>
                    <option value="Entry-level">Entry-level</option>
                    <option value="Mid-level">Mid-level</option>
                    <option value="Senior">Senior</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Salary Range
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="$120k - $160k"
                    value={salaryRange}
                    onChange={(e) => setSalaryRange(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Job Description
                </label>
                <textarea
                  required
                  rows={4}
                  className="input-field"
                  placeholder="Outline core responsibilities, team missions, and architectural stack..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Required Skills Tagging */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Mandatory Required Skills (Press Enter to add)
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Type skill (e.g. Python, React) and press Enter"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleAddRequiredSkill}
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                  {requiredSkills.map((sk) => (
                    <span key={sk} className="badge badge-blue">
                      <span>{sk}</span>
                      <X
                        size={12}
                        style={{ cursor: 'pointer', marginLeft: '3px' }}
                        onClick={() => setRequiredSkills(requiredSkills.filter(s => s !== sk))}
                      />
                    </span>
                  ))}
                </div>
              </div>

              {/* Preferred Skills Tagging */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Preferred Skills (Bonus)
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Type skill (e.g. Kubernetes, AWS) and press Enter"
                  value={prefSkillInput}
                  onChange={(e) => setPrefSkillInput(e.target.value)}
                  onKeyDown={handleAddPreferredSkill}
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                  {preferredSkills.map((sk) => (
                    <span key={sk} className="badge badge-purple">
                      <span>{sk}</span>
                      <X
                        size={12}
                        style={{ cursor: 'pointer', marginLeft: '3px' }}
                        onClick={() => setPreferredSkills(preferredSkills.filter(s => s !== sk))}
                      />
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? 'Saving...' : editingJob ? 'Update Listing' : 'Publish Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
