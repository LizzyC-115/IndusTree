import { useState } from 'react';
import { ShieldCheck, ChevronDown, ChevronUp, BookOpen, Pencil, Plus, Trash2, Check, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import RecommendedUsers from './RecommendedUsers';

// ── Default rules (used when no Firestore override exists) ──────────────────

const SHARED_RULES = [
  {
    title: 'Keep it respectful',
    detail: 'No slurs, hate speech, or personal attacks. Disagreements are fine. Hostility is not. This is a professional space.',
  },
  {
    title: 'No paid service promotion',
    detail: 'Do not advertise paid coaching, courses, referral programs, or any service you profit from. Genuine resource recommendations are fine.',
  },
  {
    title: 'Post quality content',
    detail: 'One-liner reactions belong in comments, not new posts. If your post does not add a real question or perspective, turn it into a comment on an existing thread.',
  },
  {
    title: 'Search before posting',
    detail: 'Check if your topic has already been discussed in this industry tab. If a thread exists, reply there rather than opening a duplicate. This keeps discussions useful.',
  },
  {
    title: 'Stay on topic',
    detail: 'Posts should relate to career development, industry insights, recruiting, or professional experiences. Off-topic posts will be removed.',
  },
  {
    title: 'Post in the right community',
    detail: 'Use the industry tab that best fits your question. Posting the same question across multiple tabs fragments the conversation.',
  },
];

const INDUSTRY_EXTRA = {
  finance: { title: 'No personal financial details', detail: 'Do not post or request others\' personal compensation, offer details, or firm-specific confidential information.' },
  consulting: { title: 'No confidential firm materials', detail: 'Do not share proprietary case content, internal training materials, or anything covered by an NDA.' },
  pm: { title: 'No job listing dumps', detail: 'Posting a raw job link without context adds no value. Bring a discussion angle or it will be removed.' },
  'swe-tech': { title: 'No live interview question leaks', detail: 'Do not post specific questions from active recruiting cycles. General prep discussion is welcome.' },
  quant: { title: 'No proprietary strategy sharing', detail: 'Do not share unpublished models, firm alpha, or strategies tied to your current or past employer.' },
  engineering: { title: 'No homework or design outsourcing', detail: 'Asking for help understanding a concept is fine. Asking someone to complete your project or assignment is not.' },
  medicine: { title: 'No MCAT scores or GPA requests', detail: 'Do not ask others for their scores, GPA, or school-specific cutoffs. Do not offer or request personal medical advice.' },
  academia: { title: 'No unsolicited manuscript review requests', detail: 'Feedback threads are fine when clearly labeled. Do not post unpublished work and ask the community to review or grade it.' },
};

const ALL_INDUSTRIES_GUIDE = [
  { title: 'Search before you post', detail: 'Use the search bar and browse the relevant industry tab before opening a new thread. Most questions have been asked before. Add your take as a comment if a thread already exists.' },
  { title: 'Give enough context', detail: 'Vague posts get vague answers. Share your background, what you have already tried, and what specifically you need. Short posts that lack detail will be removed.' },
  { title: 'Be constructive', detail: 'Feedback and criticism are welcome. Personal attacks are not. If you disagree with someone, respond to the argument, not the person.' },
  { title: 'Keep it relevant', detail: 'IndusTree is for career development, industry discussion, recruiting, and professional networking. Use the correct industry tab for your post.' },
  { title: 'No promotions', detail: 'Paid services, referral codes, and self-promotional content will be removed. Sharing free resources with no financial interest is fine.' },
  { title: 'Respect privacy', detail: 'Do not share others\' personal information, screenshots of private conversations, or anything confidential from a workplace or application process.' },
];

const INDUSTRY_NAMES = {
  finance: 'Finance', consulting: 'Consulting', pm: 'PM', 'swe-tech': 'SWE / Tech',
  quant: 'Quant', engineering: 'Engineering', medicine: 'Medicine', academia: 'Academia',
};

function getDefaultRules(category) {
  if (!category || category === 'all') return ALL_INDUSTRIES_GUIDE;
  const extra = INDUSTRY_EXTRA[category];
  return extra ? [...SHARED_RULES, extra] : SHARED_RULES;
}

// ── Main component ───────────────────────────────────────────────────────────

export default function TrendingSidebar({ currentUser }) {
  const { selectedCategory, communityRules, saveCommunityRules, isMod } = useApp();
  const [editing, setEditing] = useState(false);

  const isAll = !selectedCategory || selectedCategory === 'all';
  const heading = isAll ? 'Read Before Posting' : `${INDUSTRY_NAMES[selectedCategory] ?? 'Community'} Rules`;

  // Firestore override takes precedence; fall back to hardcoded defaults
  const firestoreRules = communityRules[selectedCategory || 'all'];
  const activeRules = firestoreRules ?? getDefaultRules(selectedCategory);

  return (
    <aside
      className="min-w-0 flex flex-col gap-4"
      style={{ paddingTop: '18px', paddingBottom: '18px', paddingLeft: '10px', paddingRight: '10px', minWidth: 0, overflow: 'hidden', boxSizing: 'border-box' }}
    >
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100" style={{ minWidth: 0, overflow: 'hidden' }}>
        {/* Header */}
        <div className="border-b border-slate-100 bg-gradient-to-r from-gray-50 to-white" style={{ padding: '12px 16px', minWidth: 0 }}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 font-bold text-slate-800 text-sm">
              {isAll
                ? <BookOpen className="w-4 h-4 text-rose-500 flex-shrink-0" />
                : <ShieldCheck className="w-4 h-4 text-rose-500 flex-shrink-0" />}
              <span style={{ wordBreak: 'break-word', overflowWrap: 'break-word', minWidth: 0 }}>{heading}</span>
            </h2>
            {isMod && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors flex-shrink-0"
                title="Edit rules"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {editing
          ? <RulesEditor
              rules={activeRules}
              industry={selectedCategory || 'all'}
              onSave={async (updated) => { await saveCommunityRules(selectedCategory || 'all', updated); setEditing(false); }}
              onCancel={() => setEditing(false)}
            />
          : <div style={{ minWidth: 0, maxHeight: '340px', overflowY: 'auto', overflowX: 'hidden' }}>
              {activeRules.map((rule, idx) => (
                <RuleRow key={idx} rule={rule} idx={idx} total={activeRules.length} />
              ))}
            </div>
        }
      </div>

      <RecommendedUsers currentUser={currentUser} />
    </aside>
  );
}

// ── Expandable rule row ──────────────────────────────────────────────────────

function RuleRow({ rule, idx, total }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={idx < total - 1 ? 'border-b border-slate-50' : ''} style={{ minWidth: 0 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 text-left hover:bg-slate-50 transition-colors"
        style={{ padding: '10px 16px', minWidth: 0 }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-bold text-slate-300 flex-shrink-0" style={{ minWidth: '18px' }}>{idx + 1}</span>
          <span className="text-sm font-medium text-slate-700" style={{ wordBreak: 'break-word', overflowWrap: 'break-word', minWidth: 0 }}>{rule.title}</span>
        </div>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />}
      </button>
      {open && (
        <div className="text-xs text-slate-500 leading-relaxed" style={{ padding: '0 16px 12px 36px', wordBreak: 'break-word', overflowWrap: 'break-word', minWidth: 0 }}>
          {rule.detail}
        </div>
      )}
    </div>
  );
}

// ── Mod rules editor ─────────────────────────────────────────────────────────

function RulesEditor({ rules, onSave, onCancel }) {
  const [draft, setDraft] = useState(rules.map((r) => ({ ...r })));

  const update = (idx, field, val) => setDraft((prev) => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r));
  const remove = (idx) => setDraft((prev) => prev.filter((_, i) => i !== idx));
  const add = () => setDraft((prev) => [...prev, { title: '', detail: '' }]);

  return (
    <div style={{ padding: '12px 14px', minWidth: 0 }}>
      <div className="space-y-3" style={{ maxHeight: '320px', overflowY: 'auto', paddingRight: '2px' }}>
        {draft.map((rule, idx) => (
          <div key={idx} className="bg-slate-50 rounded-xl p-3" style={{ minWidth: 0 }}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold text-slate-300 flex-shrink-0">{idx + 1}</span>
              <input
                value={rule.title}
                onChange={(e) => update(idx, 'title', e.target.value)}
                placeholder="Rule title"
                className="flex-1 text-sm font-medium bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-rose-300"
                style={{ minWidth: 0 }}
              />
              <button onClick={() => remove(idx)} className="p-1 text-slate-400 hover:text-rose-500 transition-colors flex-shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <textarea
              value={rule.detail}
              onChange={(e) => update(idx, 'detail', e.target.value)}
              placeholder="Explanation shown when expanded..."
              rows={2}
              className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none placeholder:text-slate-400"
              style={{ minWidth: 0, boxSizing: 'border-box' }}
            />
          </div>
        ))}
      </div>

      <button
        onClick={add}
        className="mt-3 flex items-center gap-1.5 text-xs font-medium text-rose-500 hover:text-rose-600 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" /> Add rule
      </button>

      <div className="flex gap-2 mt-3">
        <button
          onClick={() => onSave(draft.filter((r) => r.title.trim()))}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-rose-500 text-white text-xs font-semibold rounded-lg hover:bg-rose-600 transition-colors"
        >
          <Check className="w-3.5 h-3.5" /> Save
        </button>
        <button
          onClick={onCancel}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-200 transition-colors"
        >
          <X className="w-3.5 h-3.5" /> Cancel
        </button>
      </div>
    </div>
  );
}
