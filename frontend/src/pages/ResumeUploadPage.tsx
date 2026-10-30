import React, { useState, useRef } from 'react';
import { api } from '../services/api';
import { Upload, FileText, CheckCircle2, AlertCircle, Sparkles, ArrowRight, X } from 'lucide-react';

interface ResumeUploadPageProps {
  onNavigate: (view: string, context?: any) => void;
  onSuccess: (resume: any) => void;
}

export const ResumeUploadPage: React.FC<ResumeUploadPageProps> = ({ onNavigate, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progressStage, setProgressStage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError('');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (f: File) => {
    const validExts = ['.pdf', '.docx'];
    const ext = f.name.substring(f.name.lastIndexOf('.')).toLowerCase();
    if (!validExts.includes(ext)) {
      setError(`Invalid file type '${ext}'. Please upload a PDF or DOCX file.`);
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('File size exceeds the 10MB limit. Please upload a smaller document.');
      return;
    }
    setFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setError('');
    setUploading(true);

    try {
      setProgressStage('Extracting document text...');
      await new Promise(r => setTimeout(r, 400));
      
      setProgressStage('Running NLP entity & skill taxonomy extraction...');
      const uploadedResume = await api.uploadResume(file);
      
      setProgressStage('Indexing resume in RAG vector database...');
      await new Promise(r => setTimeout(r, 300));

      onSuccess(uploadedResume);
      onNavigate('resume_analysis', { resumeId: uploadedResume.id });
    } catch (err: any) {
      setError(err.message || 'Failed to process resume. Please try again.');
    } finally {
      setUploading(false);
      setProgressStage('');
    }
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.25rem' }}>Upload Your Resume</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Our NLP pipeline extracts your technical skills, experience, and completeness score automatically.
        </p>
      </div>

      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--danger-bg)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--danger)',
            fontSize: '0.85rem',
          }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Drag & Drop Zone */}
      <div
        className="glass-card"
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleFileDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          padding: '3rem 2rem',
          textAlign: 'center',
          cursor: 'pointer',
          border: isDragging ? '2px dashed #3b82f6' : '2px dashed var(--border-primary)',
          background: isDragging ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-card)',
          transition: 'all 0.2s ease',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'rgba(59, 130, 246, 0.12)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#3b82f6',
            marginBottom: '1rem',
          }}
        >
          <Upload size={32} />
        </div>

        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.35rem' }}>
          Drag and drop your resume file here
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Supported formats: <strong style={{ color: 'var(--text-primary)' }}>PDF, DOCX</strong> (Up to 10MB)
        </p>

        <button type="button" className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
          Browse Files
        </button>
      </div>

      {/* Selected File Details */}
      {file && (
        <div className="glass-card animate-fade-in" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <FileText size={22} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{file.name}</h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to analyze
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {!uploading && (
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="btn btn-outline btn-sm"
                title="Remove file"
              >
                <X size={15} />
              </button>
            )}
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="btn btn-primary"
              style={{ gap: '0.5rem' }}
            >
              <Sparkles size={16} />
              <span>{uploading ? 'Processing...' : 'Analyze Resume'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Progress animation banner */}
      {uploading && (
        <div className="glass-card animate-fade-in" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid rgba(59, 130, 246, 0.2)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '0.75rem' }} />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#60a5fa' }}>{progressStage}</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Applying NLP heuristics and technical taxonomy classification...
          </p>
        </div>
      )}

      {/* Privacy Notice */}
      <div style={{ background: 'var(--bg-surface)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', borderLeft: '3px solid #3b82f6', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        <strong style={{ color: 'var(--text-primary)' }}>Data Privacy Guarantee:</strong> Your uploaded resume is private. Only you and recruiters of jobs you explicitly apply to can view your qualifications. Resumes can be permanently deleted at any time from your settings.
      </div>
    </div>
  );
};
