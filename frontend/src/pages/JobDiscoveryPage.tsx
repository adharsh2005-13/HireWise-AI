import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Job } from '../types';
import { ScoreMeter } from '../components/ScoreMeter';
import { SkillBadge } from '../components/SkillBadge';
import { Search, MapPin, Briefcase, DollarSign, Filter, ArrowRight, Sparkles } from 'lucide-react';

interface JobDiscoveryPageProps {
  onNavigate: (view: string, context?: any) => void;
}

export const JobDiscoveryPage: React.FC<JobDiscoveryPageProps> = ({ onNavigate }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [recommendations, setRecommendations] = useState<Record<number, any>>({});
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('All');
  const [expFilter, setExpFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, [locationFilter, expFilter, typeFilter]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const [jobList, recs] = await Promise.all([
        api.listJobs({
          q: search || undefined,
          location: locationFilter !== 'All' ? locationFilter : undefined,
          experience_level: expFilter !== 'All' ? expFilter : undefined,
          job_type: typeFilter !== 'All' ? typeFilter : undefined,
        }),
        api.getRecommendations().catch(() => []),
      ]);
      setJobs(jobList);

      const recMap: Record<number, any> = {};
      recs.forEach((r: any) => {
        if (r.job?.id) recMap[r.job.id] = r;
      });
      setRecommendations(recMap);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs();
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.25rem' }}>Job Discovery Radar</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Explore open positions with real-time explainable match scoring tailored to your resume.
        </p>
      </div>

      {/* Search and Filters Bar */}
      <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '13px' }} />
            <input
              type="text"
              className="input-field"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Search by role title, company name, or technology (e.g. React, Python, Docker)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: '0 1.5rem' }}>
            Search
          </button>
        </form>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            <Filter size={14} /> Filter by:
          </div>

          <select
            className="input-field"
            style={{ width: 'auto', padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
            value={expFilter}
            onChange={(e) => setExpFilter(e.target.value)}
          >
            <option value="All">All Experience Levels</option>
            <option value="Entry">Entry-level</option>
            <option value="Mid-level">Mid-level</option>
            <option value="Senior">Senior</option>
          </select>

          <select
            className="input-field"
            style={{ width: 'auto', padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="All">All Job Types</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
          </select>

          <select
            className="input-field"
            style={{ width: 'auto', padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          >
            <option value="All">All Locations</option>
            <option value="Remote">Remote</option>
            <option value="New York">New York</option>
            <option value="San Francisco">San Francisco</option>
            <option value="Austin">Austin</option>
          </select>
        </div>
      </div>

      {/* Jobs Grid */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Searching active openings and calculating multi-factor match weights...
        </div>
      ) : jobs.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.25rem' }}>
          {jobs.map((job) => {
            const rec = recommendations[job.id];
            const score = rec ? rec.total_score : 0;

            return (
              <div
                key={job.id}
                className="glass-card"
                style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1.25rem' }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.75rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {job.title}
                      </h3>
                      <p style={{ fontSize: '0.875rem', color: '#60a5fa', fontWeight: 600 }}>
                        {job.company}
                      </p>
                    </div>

                    <ScoreMeter score={score} size={68} />
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <MapPin size={13} /> {job.location}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Briefcase size={13} /> {job.job_type}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <DollarSign size={13} /> {job.salary_range}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {job.description}
                  </p>

                  <div>
                    <p style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>
                      Required Technologies:
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {(job.required_skills || []).map((sk, idx) => {
                        const isMatch = rec?.matching_skills?.includes(sk);
                        return (
                          <SkillBadge key={idx} name={sk} variant={isMatch ? 'matching' : 'neutral'} size="sm" />
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-primary)' }}>
                  <button
                    onClick={() => onNavigate('job_match_explanation', { job, matchData: rec })}
                    className="btn btn-outline btn-sm"
                    style={{ flex: 1 }}
                  >
                    Match Analysis
                  </button>
                  <button
                    onClick={() => onNavigate('skill_gap', { jobId: job.id })}
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1 }}
                  >
                    Skill Gaps
                  </button>
                  <button
                    onClick={() => onNavigate('job_detail', { jobId: job.id })}
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1 }}
                  >
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>No jobs found matching your search parameters.</p>
        </div>
      )}
    </div>
  );
};
