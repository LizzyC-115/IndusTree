import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Users, MessageCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function RecommendedUsers({ currentUser }) {
  const [allRecommendations, setAllRecommendations] = useState([]);
  const [dismissed, setDismissed] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const { openDmWithUser } = useApp();

  useEffect(() => {
    if (!currentUser) return;
    const fetch = async () => {
      try {
        const snap = await getDocs(collection(db, 'users'));
        const allUsers = [];
        snap.forEach((doc) => {
          if (doc.id !== currentUser.uid) allUsers.push({ id: doc.id, ...doc.data() });
        });
        const scored = allUsers
          .map((u) => ({ ...u, score: calculateSimilarity(currentUser, u) }))
          .sort((a, b) => b.score - a.score);
        setAllRecommendations(scored);
      } catch (e) {
        console.error('Error fetching recommendations:', e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [currentUser]);

  const calculateSimilarity = (u1, u2) => {
    let score = 0;
    if (u1.major && u2.major && u1.major === u2.major) score += 40;
    if (u1.industry && u2.industry && u1.industry === u2.industry) score += 25;
    if (u1.gradYear && u2.gradYear) {
      const diff = Math.abs(parseInt(u1.gradYear) - parseInt(u2.gradYear));
      if (diff === 0) score += 20;
      else if (diff === 1) score += 10;
    }
    if (u1.experienceLevel && u2.experienceLevel && u1.experienceLevel === u2.experienceLevel) score += 15;
    if (u1.interests && u2.interests) {
      const i1 = u1.interests.toLowerCase().split(/[,\s]+/);
      const i2 = u2.interests.toLowerCase().split(/[,\s]+/);
      score += i1.filter((i) => i2.includes(i)).length * 5;
    }
    return score;
  };

  const handleDm = (user) => {
    openDmWithUser({
      id: user.id,
      name: user.username,
      avatar: user.username?.[0]?.toUpperCase() || 'U',
      bio: `${user.major || 'Student'}${user.gradYear ? ` '${user.gradYear.slice(-2)}` : ''}`,
      yearsOnPlatform: 1,
      karma: user.score || 100,
    });
    setDismissed((prev) => new Set([...prev, user.id]));
  };

  const visible = allRecommendations.filter((u) => !dismissed.has(u.id)).slice(0, 3);
  const exhausted = !loading && allRecommendations.length > 0 && visible.length === 0;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4 text-rose-500" />
          <h3 className="font-bold text-slate-800 text-sm">Recommended Connections</h3>
        </div>
        <div className="space-y-3 mt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-12 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-50 to-white border-b border-slate-100" style={{ padding: '7px 13px' }}>
        <div className="flex items-center gap-2" style={{ marginBottom: '2px' }}>
          <Users className="w-4 h-4 text-rose-500 flex-shrink-0" />
          <h3 className="font-bold text-slate-800" style={{ fontSize: '15px' }}>Recommended Connections</h3>
        </div>
        <p className="text-xs text-slate-400">
          Ranked by % compatibility
        </p>
      </div>

      <div style={{ padding: '4px 7px 5px' }}>
        {exhausted ? (
          <p className="text-sm text-slate-400 text-center py-4">
            You&apos;ve seen everyone for now
          </p>
        ) : visible.length === 0 && !loading ? (
          <p className="text-sm text-slate-500 text-center py-4">
            Complete your profile to get personalized recommendations
          </p>
        ) : (
          <div className="space-y-0.5">
            {visible.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 rounded-xl hover:bg-slate-50 transition-all group"
                style={{ padding: '4px 7px' }}
              >
                {/* Avatar */}
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.username} className="w-9 h-9 rounded-full object-cover flex-shrink-0 ring-2 ring-slate-100" />
                ) : (
                  <div className="w-9 h-9 bg-rose-500 rounded-xl flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                    {user.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}

                {/* Name + subtitle */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate">{user.username}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {user.major || 'Student'}{user.gradYear && ` '${user.gradYear.slice(-2)}`}
                  </p>
                </div>

                {/* Score + DM */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {user.score > 0 && (
                    <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md">
                      {user.score}%
                    </span>
                  )}
                  <button
                    onClick={() => handleDm(user)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    title="Send DM"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
