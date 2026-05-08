import { X } from 'lucide-react';
import { useApp } from '../context/AppContext';

const getMemberFor = (user) => {
  if (user.createdAt) {
    const diff = Date.now() - new Date(user.createdAt).getTime();
    const days = Math.floor(diff / 86_400_000);
    if (days < 2) return 'today';
    if (days < 14) return `${days} days`;
    const weeks = Math.floor(days / 7);
    if (weeks < 5) return `${weeks} week${weeks !== 1 ? 's' : ''}`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months !== 1 ? 's' : ''}`;
    const years = Math.floor(days / 365);
    return `${years} year${years !== 1 ? 's' : ''}`;
  }
  // Fallback for mock/dummy users — keep it short and realistic
  const months = Math.min(Math.round((user.yearsOnPlatform || 1) * 3), 11);
  if (months < 1) return 'a few weeks';
  if (months === 1) return '1 month';
  return `${months} months`;
};

const StatCell = ({ label, value }) => (
  <div className="rounded-2xl bg-slate-50 border border-slate-100" style={{ padding: '16px 20px', minWidth: 0, overflow: 'hidden' }}>
    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2" style={{ wordBreak: 'break-word', overflowWrap: 'break-word', minWidth: 0 }}>
      {label}
    </p>
    <p className="text-sm font-bold text-slate-800" style={{ wordBreak: 'break-word', overflowWrap: 'break-word', minWidth: 0 }}>
      {value || '—'}
    </p>
  </div>
);

export default function UserProfileModal() {
  const { selectedProfileUser, closeProfile } = useApp();

  if (!selectedProfileUser) return null;

  const memberFor = getMemberFor(selectedProfileUser);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeProfile} />

      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
        style={{ maxWidth: '100%', overflow: 'hidden', boxSizing: 'border-box', minWidth: 0 }}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px' }} className="border-b border-slate-100">
          <button
            type="button"
            onClick={closeProfile}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            style={{ minWidth: 0, overflow: 'hidden' }}
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4" style={{ minWidth: 0, overflow: 'hidden' }}>
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
              {selectedProfileUser.avatar}
            </div>
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <h2 className="text-xl font-bold text-slate-800" style={{ wordBreak: 'break-word', overflowWrap: 'break-word', minWidth: 0 }}>
                {selectedProfileUser.name}
              </h2>
              {selectedProfileUser.bio && (
                <p className="text-sm text-slate-500 mt-0.5" style={{ marginTop: '12px', wordBreak: 'break-word', overflowWrap: 'break-word', minWidth: 0 }}>
                  {selectedProfileUser.bio}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ padding: '16px 24px 28px', minWidth: 0, overflow: 'hidden' }}>
          {/* Top row: industry, grad year, experience */}
          <div className="grid grid-cols-3 gap-3 mb-3" style={{ gap: '28px', minWidth: 0, overflow: 'hidden' }}>
            <StatCell label="Industry" value={selectedProfileUser.industry} />
            <StatCell label="Grad Year" value={selectedProfileUser.gradYear} />
            <StatCell
              label="Experience"
              value={selectedProfileUser.experienceLevel}
            />
          </div>

          {/* Bottom row: member for (full width) */}
          <div
            className="rounded-2xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100"
            style={{ padding: '16px 20px', minWidth: 0, overflow: 'hidden' }}
          >
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">
              Member for
            </p>
            <p className="text-sm font-bold text-indigo-700" style={{ wordBreak: 'break-word', overflowWrap: 'break-word', minWidth: 0 }}>
              {memberFor}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
