import React, { useState } from 'react';
import { api } from '../services/api';
import { InterviewSession, InterviewQuestion } from '../types';
import { HelpCircle, CheckCircle2, Sparkles, Send, ArrowRight, Award, RefreshCw, AlertCircle } from 'lucide-react';

export const InterviewPrepPage: React.FC = () => {
  const [role, setRole] = useState('Full Stack Developer');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [topic, setTopic] = useState('Full Stack Web Architecture');
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showSampleAnswer, setShowSampleAnswer] = useState(false);

  const startSession = async () => {
    setGenerating(true);
    try {
      const sess = await api.startInterview({
        role,
        difficulty,
        topic,
        question_count: 5,
      });
      setSession(sess);
      setActiveQuestionIndex(0);
      setUserAnswer('');
      setShowSampleAnswer(false);
    } catch (e) {
      console.error(e);
      alert('Failed to generate interview questions.');
    } finally {
      setGenerating(false);
    }
  };

  const handleAnswerSubmit = async () => {
    if (!session || !userAnswer.trim()) return;
    const currentQ = session.questions[activeQuestionIndex];
    setEvaluating(true);

    try {
      const result = await api.submitInterviewAnswer(currentQ.id, userAnswer);
      // Update local question state
      const updatedQuestions = [...session.questions];
      updatedQuestions[activeQuestionIndex] = {
        ...currentQ,
        user_answer: userAnswer,
        score: result.score,
        feedback: result.feedback,
        evaluation_breakdown: result.breakdown,
      };
      setSession({ ...session, questions: updatedQuestions });
    } catch (e) {
      alert('Error evaluating answer');
    } finally {
      setEvaluating(false);
    }
  };

  const currentQ = session?.questions[activeQuestionIndex];

  return (
    <div className="animate-fade-in" style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.25rem' }}>AI Mock Interview Simulator</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Role-tailored technical, coding, project, and HR questions with rubric-based constructive evaluation
        </p>
      </div>

      {/* Role & Configuration Card */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Configure Interview Session</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Target Role
            </label>
            <select className="input-field" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="Full Stack Developer">Full Stack Developer</option>
              <option value="Backend Engineer">Backend Engineer</option>
              <option value="Frontend Engineer">Frontend Engineer</option>
              <option value="AI Engineer">AI / ML Engineer</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Interview Difficulty
            </label>
            <select className="input-field" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="Junior">Junior (Fundamentals)</option>
              <option value="Intermediate">Intermediate (Core Practice)</option>
              <option value="Senior">Senior (Architecture & Scale)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Focus Subject
            </label>
            <input
              type="text"
              className="input-field"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Distributed Systems, React"
            />
          </div>
        </div>

        <button
          onClick={startSession}
          disabled={generating}
          className="btn btn-primary"
          style={{ gap: '0.5rem' }}
        >
          <Sparkles size={16} />
          <span>{generating ? 'Synthesizing Session...' : 'Generate New Interview Session'}</span>
        </button>
      </div>

      {/* Active Session Question & Practice Mode */}
      {session && currentQ && (
        <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Progress Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-primary)' }}>
            {session.questions.map((q, idx) => {
              const isDone = q.score !== undefined && q.score > 0;
              const isCurrent = idx === activeQuestionIndex;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveQuestionIndex(idx);
                    setUserAnswer(session.questions[idx].user_answer || '');
                    setShowSampleAnswer(false);
                  }}
                  className={`btn btn-sm ${isCurrent ? 'btn-primary' : isDone ? 'btn-secondary' : 'btn-outline'}`}
                  style={{ gap: '0.35rem' }}
                >
                  {isDone ? <CheckCircle2 size={13} color="var(--success)" /> : <span>Q{idx + 1}</span>}
                  <span>{q.question_type}</span>
                  {q.score ? `(${q.score}/10)` : ''}
                </button>
              );
            })}
          </div>

          {/* Question Box */}
          <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span className="badge badge-purple">{currentQ.question_type} Question</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Question {activeQuestionIndex + 1} of {session.questions.length}
              </span>
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, lineHeight: 1.5 }}>
              {currentQ.question_text}
            </h3>
          </div>

          {/* Practice Mode Answer Input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Your Practice Answer:
            </label>
            <textarea
              className="input-field"
              rows={6}
              style={{ padding: '1rem', lineHeight: 1.6 }}
              placeholder="Articulate your thought process, architectural trade-offs, and concrete examples..."
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
            />

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={handleAnswerSubmit}
                  disabled={evaluating || !userAnswer.trim()}
                  className="btn btn-primary"
                  style={{ gap: '0.5rem' }}
                >
                  <Send size={15} />
                  <span>{evaluating ? 'Evaluating Rubric...' : 'Submit Answer for Feedback'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowSampleAnswer(!showSampleAnswer)}
                  className="btn btn-outline"
                >
                  {showSampleAnswer ? 'Hide Model Answer' : 'View Model Answer'}
                </button>
              </div>

              {activeQuestionIndex < session.questions.length - 1 && (
                <button
                  onClick={() => {
                    const nextIdx = activeQuestionIndex + 1;
                    setActiveQuestionIndex(nextIdx);
                    setUserAnswer(session.questions[nextIdx].user_answer || '');
                    setShowSampleAnswer(false);
                  }}
                  className="btn btn-secondary"
                  style={{ gap: '0.4rem' }}
                >
                  <span>Next Question</span>
                  <ArrowRight size={15} />
                </button>
              )}
            </div>
          </div>

          {/* AI Rubric Evaluation Feedback */}
          {currentQ.feedback && (
            <div className="glass-card animate-fade-in" style={{ padding: '1.5rem', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Award size={18} /> Rubric Evaluation: {currentQ.score} / 10.0
                </h4>
                <span className="badge badge-green">Guidance Feedback</span>
              </div>

              <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: '1rem' }}>
                {currentQ.feedback}
              </p>

              {currentQ.evaluation_breakdown && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', background: 'var(--bg-surface)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>RELEVANCE</span>
                    <p style={{ fontWeight: 700, color: '#60a5fa' }}>{currentQ.evaluation_breakdown.relevance}/10</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>CORRECTNESS</span>
                    <p style={{ fontWeight: 700, color: '#34d399' }}>{currentQ.evaluation_breakdown.technical_correctness}/10</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>EXPLANATION</span>
                    <p style={{ fontWeight: 700, color: '#c084fc' }}>{currentQ.evaluation_breakdown.explanation_quality}/10</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>PROBLEM SOLVING</span>
                    <p style={{ fontWeight: 700, color: '#fbbf24' }}>{currentQ.evaluation_breakdown.problem_solving}/10</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Model Answer Guidance */}
          {showSampleAnswer && currentQ.sample_answer && (
            <div className="glass-card animate-fade-in" style={{ padding: '1.5rem', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#60a5fa', marginBottom: '0.5rem' }}>
                Model Answer Guidance
              </h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {currentQ.sample_answer}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
