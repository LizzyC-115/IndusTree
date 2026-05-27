import { X } from 'lucide-react';
import { useApp } from '../context/AppContext';

const MEDALS = ['🥇', '🥈', '🥉', '4', '5'];

function LeaderboardRow({ entry, rank, onRowClick }) {
  return (
    <button
      type="button"
      onClick={() => onRowClick(entry)}
      className={`w-full flex items-center text-left transition-colors rounded-2xl ${entry.isMe ? 'bg-rose-50 hover:bg-rose-100' : 'hover:bg-slate-50'}`}
      style={{ padding: '12px 16px', gap: '16px', marginBottom: '4px' }}
    >
      {/* Rank */}
      <span
        style={{ width: '36px', textAlign: 'center', flexShrink: 0, fontSize: rank < 3 ? '24px' : '16px', fontWeight: 700 }}
        className={rank >= 3 ? 'text-slate-400' : ''}
      >
        {rank < 3 ? MEDALS[rank] : `${rank + 1}`}
      </span>

      {/* Avatar */}
      {entry.photoURL ? (
        <img
          src={entry.photoURL}
          alt={entry.name}
          className="rounded-full object-cover flex-shrink-0 ring-2 ring-slate-100"
          style={{ width: '48px', height: '48px' }}
        />
      ) : (
        <div
          className={`rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${rank === 0 ? 'bg-amber-400' : entry.isMe ? 'bg-rose-500' : 'bg-rose-400'}`}
          style={{ width: '48px', height: '48px', fontSize: '16px' }}
        >
          {entry.avatar}
        </div>
      )}

      {/* Name + "You" badge */}
      <span className="flex-1 font-semibold text-slate-800 text-base truncate flex items-center gap-2">
        {entry.name}
        {entry.isMe && (
          <span className="text-xs font-bold text-rose-500 bg-rose-100 px-1.5 py-0.5 rounded-md flex-shrink-0">You</span>
        )}
      </span>

      {/* Score */}
      <span
        className={`font-bold tabular-nums flex-shrink-0 text-base ${entry.score > 0 ? 'text-rose-500' : 'text-slate-400'}`}
        style={{ minWidth: '48px', textAlign: 'right' }}
      >
        {entry.score > 0 ? `+${entry.score}` : entry.score}
      </span>
    </button>
  );
}

export default function LeaderboardModal({ isOpen, onClose }) {
  const { allPosts, openProfile, currentUser } = useApp();

  if (!isOpen) return null;

  // Build leaderboard: group posts by author, sum votes.
  // Seed the current user first so they always appear even with 0 posts.
  const authorMap = {};
  if (currentUser?.uid) {
    authorMap[currentUser.uid] = {
      id: currentUser.uid,
      name: currentUser.username || currentUser.email || 'You',
      avatar: currentUser.username?.[0]?.toUpperCase() || 'U',
      photoURL: currentUser.photoURL || null,
      score: 0,
      isMe: true,
    };
  }
  (allPosts || []).forEach((p) => {
    const key = p.authorId || p.author;
    if (!key) return;
    if (!authorMap[key]) {
      authorMap[key] = {
        id: p.authorId || p.author,
        name: p.author,
        avatar: p.avatar || p.author?.[0]?.toUpperCase() || '?',
        photoURL: p.authorPhotoURL || null,
        score: 0,
        isMe: key === currentUser?.uid || p.author === currentUser?.username,
      };
    }
    authorMap[key].score += (p.votes || 0);
  });

  const sorted = Object.values(authorMap).sort((a, b) => b.score - a.score);
  const top5 = sorted.slice(0, 5);
  const myRank = sorted.findIndex((e) => e.isMe);
  // Show the current user below top 5 if they didn't make it in
  const showMyRow = myRank >= 5;

  const handleRowClick = (entry) => {
    onClose();
    openProfile({
      id: entry.id,
      name: entry.name,
      avatar: entry.avatar,
      photoURL: entry.photoURL,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full bg-white rounded-3xl shadow-2xl overflow-hidden" style={{ maxWidth: '520px' }}>
        {/* Header */}
        <div
          className="flex items-center justify-between border-b border-amber-100 bg-gradient-to-r from-amber-50 to-rose-50"
          style={{ padding: '24px 28px' }}
        >
          <div className="flex items-center gap-3">
            <span style={{ fontSize: '32px', lineHeight: 1 }}>🏆</span>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Leaderboard</h2>
              <p className="text-sm text-slate-500 mt-0.5">Top contributors by score</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white/60 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div style={{ padding: '16px 20px 24px' }}>
          {top5.length === 0 && (
            <p className="text-center text-sm text-slate-400 py-10">No posts yet — be the first!</p>
          )}
          {top5.map((entry, idx) => (
            <LeaderboardRow
              key={entry.id}
              entry={entry}
              rank={idx}
              onRowClick={handleRowClick}
            />
          ))}

          {/* Current user's row if outside top 5 */}
          {showMyRow && sorted[myRank] && (
            <>
              <div className="flex items-center gap-2 my-2" style={{ padding: '0 8px' }}>
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-xs text-slate-400 font-medium">Your rank</span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>
              <LeaderboardRow
                entry={sorted[myRank]}
                rank={myRank}
                onRowClick={handleRowClick}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
