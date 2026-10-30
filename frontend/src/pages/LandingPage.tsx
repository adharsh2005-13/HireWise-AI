import React from 'react';
import { Sparkles, ArrowRight, ShieldCheck, CheckCircle2, Zap, FileText, Cpu, Target } from 'lucide-react';

interface LandingPageProps {
  onNavigate: (view: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '3rem 1rem 4rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem', borderRadius: '9999px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.25)', color: '#60a5fa', fontSize: '0.825rem', fontWeight: 600, marginBottom: '1.5rem' }}>
          <Sparkles size={15} /> Next-Gen AI Recruitment & Career Intelligence
        </div>

        <h1 style={{ fontSize: '3.25rem', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.03em', maxWidth: '850px', margin: '0 auto 1.5rem' }}>
          Bridging Talent and Opportunity with{' '}
          <span style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Explainable AI
          </span>
        </h1>

        <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', maxWidth: '680px', margin: '0 auto 2.5rem', lineHeight: 1.6 }}>
          HireWise AI analyzes resumes using NLP, matches candidates to jobs using transparent multi-factor scoring, identifies skill gaps with verified resources, and powers interview preparation.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button onClick={() => onNavigate('register')} className="btn btn-primary btn-lg" style={{ gap: '0.65rem' }}>
            <span>Get Started Free</span>
            <ArrowRight size={18} />
          </button>
          <button onClick={() => onNavigate('login')} className="btn btn-secondary btn-lg">
            Demo Login
          </button>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa', marginBottom: '1.25rem' }}>
            <FileText size={24} />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>NLP Resume Intelligence</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Upload PDF or DOCX documents to extract structured skills, work experience, projects, education, and resume completeness scores.
          </p>
        </div>

        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399', marginBottom: '1.25rem' }}>
            <Target size={24} />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>Explainable Job Matching</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Normalized 0–100 match scoring based on required skills (40%), semantic text similarity (30%), project experience (20%), and preferred skills (10%).
          </p>
        </div>

        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc', marginBottom: '1.25rem' }}>
            <Cpu size={24} />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>RAG Career Assistant</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Ask career, resume, and technical questions grounded in verified documentation with transparent citation attribution and deterministic fallback.
          </p>
        </div>

        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24', marginBottom: '1.25rem' }}>
            <Zap size={24} />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>AI Interview Simulator</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Practice technical, coding, and HR questions tailored by role and difficulty with instant rubric evaluation, feedback, and scoring.
          </p>
        </div>
      </div>

      {/* Roles Section */}
      <div className="glass-card" style={{ padding: '2.5rem', textAlign: 'center', border: '1px solid var(--border-accent)' }}>
        <h2 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '1rem' }}>Built for Candidates, Recruiters & Leaders</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 2rem' }}>
          Dedicated role workflows engineered with security, privacy isolation, and fair recruitment ethics.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', textAlign: 'left' }}>
          <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
            <h4 style={{ color: '#60a5fa', fontWeight: 700, marginBottom: '0.5rem' }}>Candidates</h4>
            <ul style={{ listStyle: 'none', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <li>✓ Upload & parse multiple resumes</li>
              <li>✓ Inspect match percentages & missing skills</li>
              <li>✓ Explore verified learning roadmaps</li>
              <li>✓ Interactive mock interview practice</li>
            </ul>
          </div>

          <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
            <h4 style={{ color: '#34d399', fontWeight: 700, marginBottom: '0.5rem' }}>Recruiters</h4>
            <ul style={{ listStyle: 'none', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <li>✓ Post & manage job requirements</li>
              <li>✓ Review explainable candidate scores</li>
              <li>✓ AI evidence-based qualification summaries</li>
              <li>✓ Shortlist or reject with candidate feedback</li>
            </ul>
          </div>

          <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
            <h4 style={{ color: '#c084fc', fontWeight: 700, marginBottom: '0.5rem' }}>Administrators</h4>
            <ul style={{ listStyle: 'none', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <li>✓ System-wide recruitment telemetry</li>
              <li>✓ User role management & account security</li>
              <li>✓ Tamper-evident audit logging</li>
              <li>✓ Skill demand market intelligence</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
