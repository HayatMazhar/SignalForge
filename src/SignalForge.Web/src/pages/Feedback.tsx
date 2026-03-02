import { useState, useEffect } from 'react';
import { MessageSquare, Star, Send, Bug, AlertTriangle, Upload, Check, Trash2 } from 'lucide-react';

interface FeedbackEntry {
  id: string;
  type: 'feedback' | 'bug';
  rating?: number;
  category?: string;
  message: string;
  title?: string;
  severity?: string;
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  timestamp: string;
}

const STORAGE_KEY = 'sf-feedback-submissions';

function loadSubmissions(): FeedbackEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return [];
}

function saveSubmissions(items: FeedbackEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

const CATEGORIES = ['UI/UX', 'Features', 'Performance', 'AI Accuracy', 'Other'];
const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];

export default function Feedback() {
  const [tab, setTab] = useState<'feedback' | 'bug'>('feedback');
  const [submissions, setSubmissions] = useState<FeedbackEntry[]>(loadSubmissions);

  // Feedback form state
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');

  // Bug report form state
  const [bugTitle, setBugTitle] = useState('');
  const [steps, setSteps] = useState('');
  const [expected, setExpected] = useState('');
  const [actual, setActual] = useState('');
  const [severity, setSeverity] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    saveSubmissions(submissions);
  }, [submissions]);

  const resetForms = () => {
    setRating(0);
    setCategory('');
    setMessage('');
    setBugTitle('');
    setSteps('');
    setExpected('');
    setActual('');
    setSeverity('');
  };

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || !message.trim()) return;
    const entry: FeedbackEntry = {
      id: Date.now().toString(),
      type: 'feedback',
      rating,
      category: category || 'General',
      message: message.trim(),
      timestamp: new Date().toISOString(),
    };
    setSubmissions((prev) => [entry, ...prev]);
    resetForms();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const handleSubmitBug = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bugTitle.trim() || !actual.trim()) return;
    const entry: FeedbackEntry = {
      id: Date.now().toString(),
      type: 'bug',
      title: bugTitle.trim(),
      stepsToReproduce: steps.trim(),
      expectedBehavior: expected.trim(),
      actualBehavior: actual.trim(),
      severity: severity || 'Medium',
      message: actual.trim(),
      timestamp: new Date().toISOString(),
    };
    setSubmissions((prev) => [entry, ...prev]);
    resetForms();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const clearSubmissions = () => {
    setSubmissions([]);
    saveSubmissions([]);
  };

  const tabs = [
    { id: 'feedback' as const, label: 'Feedback', icon: Star },
    { id: 'bug' as const, label: 'Bug Report', icon: Bug },
  ];

  return (
    <div className="page-enter max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-info" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-text-primary">Feedback & Bug Reports</h1>
          <p className="text-xs text-text-muted">Help us improve SignalForge</p>
        </div>
      </div>

      {/* Success banner */}
      {submitted && (
        <div className="mb-6 bg-accent/10 border border-accent/20 rounded-2xl p-4 flex items-center gap-3 animate-fade-up">
          <Check className="w-5 h-5 text-accent" />
          <p className="text-sm font-bold text-accent">Thank you! Your submission has been received.</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              tab === id ? 'bg-accent/10 text-accent border border-accent/20' : 'text-text-muted hover:text-text-primary hover:bg-surface'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form */}
        <div className="lg:col-span-3">
          {tab === 'feedback' ? (
            <form onSubmit={handleSubmitFeedback} className="bg-surface border border-border rounded-2xl p-6 card-hover animate-fade-up">
              <h2 className="text-lg font-black text-text-primary mb-5">Share Your Feedback</h2>

              {/* Star Rating */}
              <div className="mb-5">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2 block">Rating</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="transition-transform hover:scale-125"
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          star <= (hoverRating || rating) ? 'text-warning fill-warning' : 'text-border'
                        }`}
                      />
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="ml-2 text-sm text-text-muted">
                      {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][rating]}
                    </span>
                  )}
                </div>
              </div>

              {/* Category */}
              <div className="mb-4">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5 block">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent/40 transition-all appearance-none cursor-pointer"
                >
                  <option value="">Select a category...</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Message */}
              <div className="mb-5">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5 block">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what you think..."
                  rows={5}
                  className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-accent/40 transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={!rating || !message.trim()}
                className="w-full py-3 rounded-xl bg-accent text-bg text-sm font-bold hover:bg-accent-dim transition-all btn-shine glow-accent flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" /> Submit Feedback
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmitBug} className="bg-surface border border-border rounded-2xl p-6 card-hover animate-fade-up">
              <h2 className="text-lg font-black text-text-primary mb-5">Report a Bug</h2>

              {/* Title */}
              <div className="mb-4">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5 block">Bug Title</label>
                <input
                  value={bugTitle}
                  onChange={(e) => setBugTitle(e.target.value)}
                  placeholder="Brief description of the issue"
                  className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-accent/40 transition-all"
                />
              </div>

              {/* Steps to Reproduce */}
              <div className="mb-4">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5 block">Steps to Reproduce</label>
                <textarea
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                  placeholder="1. Go to...&#10;2. Click on...&#10;3. Observe..."
                  rows={3}
                  className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-accent/40 transition-all resize-none"
                />
              </div>

              {/* Expected Behavior */}
              <div className="mb-4">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5 block">Expected Behavior</label>
                <textarea
                  value={expected}
                  onChange={(e) => setExpected(e.target.value)}
                  placeholder="What should have happened?"
                  rows={2}
                  className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-accent/40 transition-all resize-none"
                />
              </div>

              {/* Actual Behavior */}
              <div className="mb-4">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5 block">Actual Behavior</label>
                <textarea
                  value={actual}
                  onChange={(e) => setActual(e.target.value)}
                  placeholder="What actually happened?"
                  rows={2}
                  className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-accent/40 transition-all resize-none"
                />
              </div>

              {/* Severity */}
              <div className="mb-4">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5 block">Severity</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent/40 transition-all appearance-none cursor-pointer"
                >
                  <option value="">Select severity...</option>
                  {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Screenshot placeholder */}
              <div className="mb-5">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5 block">Screenshot (optional)</label>
                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-accent/30 transition-colors cursor-pointer">
                  <Upload className="w-6 h-6 text-text-muted/30 mx-auto mb-2" />
                  <p className="text-xs text-text-muted">Click or drag to upload a screenshot</p>
                  <p className="text-[10px] text-text-muted/40 mt-1">PNG, JPG up to 5MB</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={!bugTitle.trim() || !actual.trim()}
                className="w-full py-3 rounded-xl bg-danger text-white text-sm font-bold hover:bg-danger/80 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <AlertTriangle className="w-4 h-4" /> Submit Bug Report
              </button>
            </form>
          )}
        </div>

        {/* Recent Submissions */}
        <div className="lg:col-span-2">
          <div className="bg-surface border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-text-primary">Recent Submissions</h3>
              {submissions.length > 0 && (
                <button onClick={clearSubmissions} className="text-[10px] text-text-muted hover:text-danger transition-colors flex items-center gap-1">
                  <Trash2 className="w-3 h-3" /> Clear
                </button>
              )}
            </div>

            {submissions.length === 0 ? (
              <div className="text-center py-10">
                <MessageSquare className="w-8 h-8 text-text-muted/20 mx-auto mb-2" />
                <p className="text-xs text-text-muted">No submissions yet</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {submissions.map((entry, i) => (
                  <div
                    key={entry.id}
                    style={{ animationDelay: `${i * 30}ms` }}
                    className="animate-fade-up bg-bg rounded-xl p-3 border border-border/50"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {entry.type === 'feedback' ? (
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={`w-3 h-3 ${s <= (entry.rating ?? 0) ? 'text-warning fill-warning' : 'text-border'}`} />
                          ))}
                        </div>
                      ) : (
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                          entry.severity === 'Critical' ? 'bg-danger/10 text-danger' :
                          entry.severity === 'High' ? 'bg-warning/10 text-warning' :
                          entry.severity === 'Medium' ? 'bg-info/10 text-info' :
                          'bg-surface-light text-text-muted'
                        }`}>
                          {entry.severity}
                        </span>
                      )}
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                        entry.type === 'feedback' ? 'bg-accent/10 text-accent' : 'bg-danger/10 text-danger'
                      }`}>
                        {entry.type === 'feedback' ? 'Feedback' : 'Bug'}
                      </span>
                    </div>
                    <p className="text-xs text-text-primary font-medium truncate">
                      {entry.title ?? entry.message}
                    </p>
                    {entry.category && (
                      <p className="text-[10px] text-text-muted mt-0.5">{entry.category}</p>
                    )}
                    <p className="text-[9px] text-text-muted/50 font-mono mt-1">
                      {new Date(entry.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
