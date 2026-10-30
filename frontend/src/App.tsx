import React, { useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ToastContainer, ToastMessage } from './components/Toast';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { CandidateDashboard } from './pages/CandidateDashboard';
import { ResumeUploadPage } from './pages/ResumeUploadPage';
import { ResumeAnalysisPage } from './pages/ResumeAnalysisPage';
import { JobDiscoveryPage } from './pages/JobDiscoveryPage';
import { JobDetailPage } from './pages/JobDetailPage';
import { JobMatchExplanationPage } from './pages/JobMatchExplanationPage';
import { SkillGapAnalysisPage } from './pages/SkillGapAnalysisPage';
import { AICareerAssistantPage } from './pages/AICareerAssistantPage';
import { InterviewPrepPage } from './pages/InterviewPrepPage';
import { ApplicationTrackingPage } from './pages/ApplicationTrackingPage';
import { RecruiterDashboard } from './pages/RecruiterDashboard';
import { JobManagementPage } from './pages/JobManagementPage';
import { CandidateSearchPage } from './pages/CandidateSearchPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { UserProfilePage } from './pages/UserProfilePage';

const AppContent: React.FC = () => {
  const { isAuthenticated, role, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<string>('landing');
  const [viewContext, setViewContext] = useState<any>({});
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const handleNavigate = (view: string, context: any = {}) => {
    setCurrentView(view);
    setViewContext(context);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuthSuccess = () => {
    showToast('Signed in successfully! Welcome to HireWise AI.', 'success');
    if (role === 'recruiter') {
      setCurrentView('recruiter_dashboard');
    } else if (role === 'admin') {
      setCurrentView('admin_dashboard');
    } else {
      setCurrentView('candidate_dashboard');
    }
  };

  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', color: 'var(--text-muted)' }}>
        Initializing HireWise AI secure session...
      </div>
    );
  }

  // Determine active view when authenticated
  let effectiveView = currentView;
  if (effectiveView === 'landing' && isAuthenticated) {
    if (role === 'recruiter') effectiveView = 'recruiter_dashboard';
    else if (role === 'admin') effectiveView = 'admin_dashboard';
    else effectiveView = 'candidate_dashboard';
  } else if (!isAuthenticated && !['landing', 'login', 'register'].includes(effectiveView)) {
    effectiveView = 'login';
  }

  const renderActivePage = () => {
    switch (effectiveView) {
      case 'landing':
        return <LandingPage onNavigate={handleNavigate} />;
      case 'login':
        return <LoginPage onNavigate={handleNavigate} onSuccess={handleAuthSuccess} />;
      case 'register':
        return <RegisterPage onNavigate={handleNavigate} onSuccess={handleAuthSuccess} />;
      case 'candidate_dashboard':
        return <CandidateDashboard onNavigate={handleNavigate} />;
      case 'resume_upload':
        return (
          <ResumeUploadPage
            onNavigate={handleNavigate}
            onSuccess={() => showToast('Resume successfully uploaded and parsed by NLP pipeline!', 'success')}
          />
        );
      case 'resume_analysis':
        return <ResumeAnalysisPage resumeId={viewContext?.resumeId} onNavigate={handleNavigate} />;
      case 'job_discovery':
        return <JobDiscoveryPage onNavigate={handleNavigate} />;
      case 'job_detail':
        return <JobDetailPage jobId={viewContext?.jobId} onNavigate={handleNavigate} showToast={showToast} />;
      case 'job_match_explanation':
        return <JobMatchExplanationPage job={viewContext?.job} matchData={viewContext?.matchData} onNavigate={handleNavigate} />;
      case 'skill_gap':
        return <SkillGapAnalysisPage jobId={viewContext?.jobId} onNavigate={handleNavigate} />;
      case 'career_chat':
        return <AICareerAssistantPage />;
      case 'interview_prep':
        return <InterviewPrepPage />;
      case 'applications':
        return <ApplicationTrackingPage onNavigate={handleNavigate} />;
      case 'recruiter_dashboard':
        return <RecruiterDashboard onNavigate={handleNavigate} />;
      case 'job_management':
        return <JobManagementPage createNew={viewContext?.createNew} onNavigate={handleNavigate} showToast={showToast} />;
      case 'candidate_search':
        return <CandidateSearchPage filterJobId={viewContext?.filterJobId} applicationId={viewContext?.applicationId} onNavigate={handleNavigate} showToast={showToast} />;
      case 'admin_dashboard':
      case 'admin_users':
        return <AdminDashboard />;
      case 'profile':
        return <UserProfilePage showToast={showToast} />;
      default:
        return <CandidateDashboard onNavigate={handleNavigate} />;
    }
  };

  const showSidebar = isAuthenticated && !['landing', 'login', 'register'].includes(effectiveView);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar currentView={effectiveView} onNavigate={handleNavigate} />
      
      <div style={{ display: 'flex', flex: 1 }}>
        {showSidebar && <Sidebar currentView={effectiveView} onNavigate={handleNavigate} />}
        
        <main
          style={{
            flex: 1,
            padding: showSidebar ? '2rem' : '1.5rem',
            maxWidth: showSidebar ? '1400px' : '100%',
            margin: '0 auto',
            width: '100%',
          }}
        >
          {renderActivePage()}
        </main>
      </div>

      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
