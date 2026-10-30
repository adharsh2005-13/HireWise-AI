import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { User, Shield, Lock, Trash2, CheckCircle2, Save, ExternalLink } from 'lucide-react';

interface UserProfilePageProps {
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const UserProfilePage: React.FC<UserProfilePageProps> = ({ showToast }) => {
  const { user, role, refreshUser } = useAuth();
  
  // Candidate profile fields
  const [headline, setHeadline] = useState(user?.profile?.headline || '');
  const [phone, setPhone] = useState(user?.profile?.phone || '');
  const [location, setLocation] = useState(user?.profile?.location || '');
  const [bio, setBio] = useState(user?.profile?.bio || '');
  const [githubUrl, setGithubUrl] = useState(user?.profile?.github_url || '');
  const [linkedinUrl, setLinkedinUrl] = useState(user?.profile?.linkedin_url || '');
  const [yearsExperience, setYearsExperience] = useState(user?.profile?.years_experience || 0);

  // Recruiter profile fields
  const [companyName, setCompanyName] = useState(user?.profile?.company_name || '');
  const [companyWebsite, setCompanyWebsite] = useState(user?.profile?.company_website || '');
  const [designation, setDesignation] = useState(user?.profile?.designation || '');
  const [department, setDepartment] = useState(user?.profile?.department || '');

  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (role === 'candidate') {
        await api.updateCandidateProfile({
          headline,
          phone,
          location,
          bio,
          github_url: githubUrl,
          linkedin_url: linkedinUrl,
          years_experience: Number(yearsExperience),
        });
      } else if (role === 'recruiter') {
        await api.updateRecruiterProfile({
          company_name: companyName,
          company_website: companyWebsite,
          designation,
          department,
        });
      }
      await refreshUser();
      showToast('Profile information successfully saved!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.25rem' }}>
          Profile & Security Settings
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Manage your personal information, technical background, and data privacy
        </p>
      </div>

      <div className="glass-card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-primary)', marginBottom: '1.5rem' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '1.5rem', fontWeight: 800 }}>
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{user?.full_name}</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{user?.email}</p>
            <span className="badge badge-blue" style={{ marginTop: '0.35rem' }}>
              Role: {user?.role.toUpperCase()}
            </span>
          </div>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {role === 'candidate' && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Professional Headline
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Senior Full-Stack Engineer | React, Python, PostgreSQL"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Phone Number
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Location
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="City, State (or Remote)"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    className="input-field"
                    value={yearsExperience}
                    onChange={(e) => setYearsExperience(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    GitHub URL
                  </label>
                  <input
                    type="url"
                    className="input-field"
                    placeholder="https://github.com/..."
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    LinkedIn URL
                  </label>
                  <input
                    type="url"
                    className="input-field"
                    placeholder="https://linkedin.com/in/..."
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Professional Bio / Summary
                </label>
                <textarea
                  rows={4}
                  className="input-field"
                  placeholder="Summarize your engineering journey, architectural specialties, and target responsibilities..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>
            </>
          )}

          {role === 'recruiter' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Company Name
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Company Website
                  </label>
                  <input
                    type="url"
                    className="input-field"
                    placeholder="https://company.example.com"
                    value={companyWebsite}
                    onChange={(e) => setCompanyWebsite(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Designation / Title
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Talent Acquisition Lead"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Department
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Engineering & Technology"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--border-primary)' }}>
            <button type="submit" disabled={saving} className="btn btn-primary" style={{ gap: '0.5rem' }}>
              <Save size={16} />
              <span>{saving ? 'Saving Profile...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Privacy & Data Retention Guarantee (Section 13) */}
      <div className="glass-card" style={{ padding: '1.75rem', border: '1px solid var(--border-primary)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', marginBottom: '0.5rem' }}>
          <Shield size={18} /> Data Retention & Privacy Rights
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>
          Under HireWise AI retention compliance, your uploaded resumes and personal profile data are strictly isolated. No candidate data is shared with unauthorized third parties or exposed through public links.
        </p>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          To purge your uploaded resumes, visit your <strong>Resume Analysis</strong> page and select the delete option for each document.
        </p>
      </div>
    </div>
  );
};
