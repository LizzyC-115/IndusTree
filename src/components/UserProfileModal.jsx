import { X, MessageCircle } from 'lucide-react';
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
  const { selectedProfileUser, closeProfile, openDmWithUser } = useApp();

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
            {selectedProfileUser.photoURL ? (
              <img
                src={selectedProfileUser.photoURL}
                alt={selectedProfileUser.name}
                className="w-16 h-16 rounded-2xl object-cover flex-shrink-0 ring-2 ring-slate-100"
              />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                {selectedProfileUser.avatar}
              </div>
            )}
            <div className="flex-1" style={{ minWidth: 0, overflow: 'hidden' }}>
              <h2 className="text-xl font-bold text-slate-800" style={{ wordBreak: 'break-word', overflowWrap: 'break-word', minWidth: 0 }}>
                {selectedProfileUser.name}
              </h2>
              {selectedProfileUser.bio && (
                <p className="text-sm text-slate-500 mt-1" style={{ wordBreak: 'break-word', overflowWrap: 'break-word', minWidth: 0 }}>
                  {selectedProfileUser.bio}
                </p>
              )}
              <button
                type="button"
                onClick={() => {
                  closeProfile();
                  openDmWithUser(selectedProfileUser);
                }}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold rounded-lg transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Message
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ padding: '16px 24px 28px', minWidth: 0, overflow: 'hidden' }}>
          {/* Top row: industry, grad year, experience */}
          <div className="grid grid-cols-3 gap-3 mb-3" style={{ gap: '12px', minWidth: 0, overflow: 'hidden' }}>
            <StatCell label="Industry" value={selectedProfileUser.industry} />
            <StatCell label="Grad Year" value={selectedProfileUser.gradYear} />
            <StatCell label="Experience" value={selectedProfileUser.experienceLevel} />
          </div>

          {/* Second row: leaderboard score + member for */}
          <div className="grid grid-cols-2 gap-3 mb-0" style={{ gap: '12px', minWidth: 0, overflow: 'hidden' }}>
            <div
              className="rounded-2xl bg-gradient-to-r from-amber-50 to-rose-50 border border-amber-100"
              style={{ padding: '16px 20px', minWidth: 0, overflow: 'hidden' }}
            >
              <p className="text-xs font-semibold text-amber-500 uppercase tracking-wider mb-2">
                🏆 Leaderboard Score
              </p>
              <p className="text-sm font-bold text-amber-700" style={{ wordBreak: 'break-word', overflowWrap: 'break-word', minWidth: 0 }}>
                {typeof selectedProfileUser.karma === 'number'
                  ? selectedProfileUser.karma > 0
                    ? `+${selectedProfileUser.karma}`
                    : `${selectedProfileUser.karma}`
                  : '—'}
              </p>
            </div>

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
    </div>
  );
}
