import { useState, useEffect } from 'react';
import { X, User, MessageSquare, Bookmark, ChevronUp, CheckCircle, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { updateUserProfile } from '../firebase/auth';
import { getUserComments } from '../firebase/comments';

const INDUSTRIES = ['Finance', 'Consulting', 'PM', 'SWE/Tech', 'Quant', 'Engineering', 'Medicine', 'Academia'];
const GRAD_YEARS = ['2024', '2025', '2026', '2027', '2028', '2029', '2030'];
const EXP_LEVELS = [
  { value: 'No Experience', label: 'No Experience' },
  { value: 'Beginner', label: 'Beginner (0-1 years)' },
  { value: 'Intermediate', label: 'Intermediate (1-3 years)' },
  { value: 'Advanced', label: 'Advanced (3+ years)' },
];

const fieldClass =
  'w-full rounded-xl bg-slate-100 border border-slate-200 px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400';
const labelClass = 'block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5';

export default function MyProfileModal() {
  const { currentUser, isMyProfileOpen, closeMyProfile, allPosts, savedPostIds } = useApp();

  const [tab, setTab] = useState('profile');
  const [form, setForm] = useState({
    major: '',
    gradYear: '',
    industry: '',
    experienceLevel: '',
    interests: '',
    goals: '',
  });
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'ok' | 'error' | null
  const [comments, setComments] = useState(null); // null = loading
  const [commentsError, setCommentsError] = useState(null);

  // Derived live from context — always in sync without a separate fetch
  const savedPosts = (allPosts ?? []).filter((p) => savedPostIds?.has(String(p.id)));
  const upvotedPosts = (allPosts ?? []).filter((p) => p.userVote === 1);

  // Prefill form from currentUser
  useEffect(() => {
    if (currentUser) {
      setForm({
        major: currentUser.major || '',
        gradYear: currentUser.gradYear || '',
        industry: currentUser.industry || '',
        experienceLevel: currentUser.experienceLevel || '',
        interests: currentUser.interests || '',
        goals: currentUser.goals || '',
      });
    }
  }, [currentUser, isMyProfileOpen]);

  // Load comment history when switching to comments tab
  useEffect(() => {
    if (tab !== 'comments' || !currentUser?.uid) return;
    if (comments !== null) return;
    setCommentsError(null);
    getUserComments(currentUser.uid).then(setComments).catch((err) => {
      setCommentsError(err.message);
      setComments([]);
    });
  }, [tab, currentUser?.uid, comments]);


  if (!isMyProfileOpen || !currentUser) return null;

  const displayAvatar =
    currentUser.avatar ||
    currentUser.username?.[0]?.toUpperCase() ||
    currentUser.email?.[0]?.toUpperCase() ||
    'U';

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setSaveStatus(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentUser?.uid) return;
    setSaving(true);
    setSaveStatus(null);
    const result = await updateUserProfile(currentUser.uid, form);
    setSaving(false);
    setSaveStatus(result.success ? 'ok' : 'error');
    if (result.success) {
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const tabBtn = (id, label, Icon) => (
    <button
      onClick={() => setTab(id)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
        tab === id
          ? 'bg-indigo-600 text-white shadow-sm'
          : 'text-slate-500 hover:bg-slate-100'
      }`}
    >
      <Icon size={14} />
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={closeMyProfile}
      />

      {/* Modal card — 12px outer white padding */}
      <div
        className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ padding: '12px', maxHeight: '90vh' }}
      >
        {/* Inner wrapper that clips to rounded corners */}
        <div className="flex flex-col flex-1 rounded-xl border border-slate-100 overflow-hidden bg-white">

          {/* Header */}
          <div
            className="flex items-center gap-4 bg-gradient-to-r from-indigo-600 to-violet-600"
            style={{ padding: '20px 24px' }}
          >
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
              {displayAvatar}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-base leading-tight">
                {currentUser.username || currentUser.email}
              </p>
              <p className="text-indigo-200 text-xs mt-0.5">Your profile — only you can see this</p>
            </div>
            <button
              onClick={closeMyProfile}
              className="text-white/70 hover:text-white transition-colors flex-shrink-0"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tab bar */}
          <div className="flex items-center gap-2 border-b border-slate-100 flex-wrap" style={{ padding: '10px 16px' }}>
            {tabBtn('profile', 'Edit Profile', User)}
            {tabBtn('comments', 'Comments', MessageSquare)}
            {tabBtn('saved', 'Saved', Bookmark)}
            {tabBtn('upvotes', 'Upvotes', ChevronUp)}
          </div>

          {/* Body — scrollable */}
          <div className="flex-1 overflow-y-auto" style={{ padding: '20px 24px' }}>

            {/* ── EDIT PROFILE TAB ── */}
            {tab === 'profile' && (
              <form onSubmit={handleSave} className="flex flex-col gap-5">

                {/* Major */}
                <div>
                  <label className={labelClass}>Major</label>
                  <input
                    name="major"
                    value={form.major}
                    onChange={handleChange}
                    placeholder="e.g. Computer Science"
                    className={fieldClass}
                  />
                </div>

                {/* Grad Year */}
                <div>
                  <label className={labelClass}>Graduation Year</label>
                  <select name="gradYear" value={form.gradYear} onChange={handleChange} className={fieldClass}>
                    <option value="">Select year</option>
                    {GRAD_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>

                {/* Industry */}
                <div>
                  <label className={labelClass}>Industry of Interest</label>
                  <select name="industry" value={form.industry} onChange={handleChange} className={fieldClass}>
                    <option value="">Select industry</option>
                    {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>

                {/* Experience Level */}
                <div>
                  <label className={labelClass}>Experience Level</label>
                  <select name="experienceLevel" value={form.experienceLevel} onChange={handleChange} className={fieldClass}>
                    <option value="">Select level</option>
                    {EXP_LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>

                {/* Interests */}
                <div>
                  <label className={labelClass}>Interests (optional)</label>
                  <textarea
                    name="interests"
                    value={form.interests}
                    onChange={handleChange}
                    rows={2}
                    placeholder="e.g. venture capital, open source, research..."
                    className={`${fieldClass} resize-none`}
                  />
                </div>

                {/* Goals */}
                <div>
                  <label className={labelClass}>Goals (optional)</label>
                  <textarea
                    name="goals"
                    value={form.goals}
                    onChange={handleChange}
                    rows={2}
                    placeholder="e.g. land a summer internship at a BB bank..."
                    className={`${fieldClass} resize-none`}
                  />
                </div>

                {/* Save button + status */}
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={saving}
                    style={{ padding: '10px 28px' }}
                    className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold hover:from-indigo-700 hover:to-violet-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>

                  {saveStatus === 'ok' && (
                    <span className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium">
                      <CheckCircle size={15} /> Saved!
                    </span>
                  )}
                  {saveStatus === 'error' && (
                    <span className="flex items-center gap-1.5 text-red-500 text-sm font-medium">
                      <AlertCircle size={15} /> Save failed — check permissions
                    </span>
                  )}
                </div>
              </form>
            )}

            {/* ── COMMENT HISTORY TAB ── */}
            {tab === 'comments' && (
              <div className="flex flex-col gap-3">
                {comments === null && (
                  <p className="text-sm text-slate-400 text-center py-8">Loading your comments…</p>
                )}
                {commentsError && (
                  <p className="text-sm text-red-400 text-center py-4">
                    Could not load comments — you may need to add a Firestore collection group index on <code>comments.authorUid</code>.
                  </p>
                )}
                {comments !== null && comments.length === 0 && !commentsError && (
                  <p className="text-sm text-slate-400 text-center py-8">You haven&apos;t posted any comments yet.</p>
                )}
                {comments !== null && comments.map((c) => (
                  <div key={c.id} className="rounded-xl bg-slate-50 border border-slate-100" style={{ padding: '12px 16px' }}>
                    <p className="text-sm text-slate-800 leading-relaxed">{c.content}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-slate-400">Post #{c.postId}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs text-slate-400">{c.timeAgo}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── SAVED POSTS TAB ── */}
            {tab === 'saved' && (
              <div className="flex flex-col gap-3">
                {savedPosts.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-8">No saved posts yet — click the bookmark on any open post.</p>
                )}
                {savedPosts.map((p) => (
                  <div key={p.id} className="rounded-xl bg-slate-50 border border-slate-100" style={{ padding: '12px 16px' }}>
                    <p className="text-sm font-semibold text-slate-800 leading-snug mb-1">{p.title}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">by {p.author}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs text-indigo-500 font-medium">+{p.votes ?? 0} votes</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── UPVOTE HISTORY TAB ── */}
            {tab === 'upvotes' && (
              <div className="flex flex-col gap-3">
                {upvotedPosts.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-8">No upvotes yet — upvote posts you find helpful.</p>
                )}
                {upvotedPosts.map((p) => (
                  <div key={p.id} className="rounded-xl bg-slate-50 border border-slate-100" style={{ padding: '12px 16px' }}>
                    <p className="text-sm font-semibold text-slate-800 leading-snug mb-1">{p.title}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">by {p.author}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs text-emerald-600 font-medium">↑ Upvoted</span>
                    </div>
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
