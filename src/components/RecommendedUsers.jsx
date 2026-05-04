import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Users, TrendingUp, MessageCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function RecommendedUsers({ currentUser }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { openDmWithUser } = useApp();

  useEffect(() => {
    if (!currentUser) return;
    
    const fetchRecommendations = async () => {
      try {
        // Get all users from Firestore
        const usersRef = collection(db, 'users');
        const querySnapshot = await getDocs(usersRef);
        
        const allUsers = [];
        querySnapshot.forEach((doc) => {
          if (doc.id !== currentUser.uid) { // Exclude current user
            allUsers.push({ id: doc.id, ...doc.data() });
          }
        });

        // Calculate similarity scores
        const scoredUsers = allUsers.map(user => ({
          ...user,
          score: calculateSimilarity(currentUser, user)
        }));

        // Sort by similarity score (highest first) and take top 5
        const topRecommendations = scoredUsers
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);

        setRecommendations(topRecommendations);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [currentUser]);

  // Calculate similarity between two users
  const calculateSimilarity = (user1, user2) => {
    let score = 0;

    // Same major (highest weight)
    if (user1.major && user2.major && user1.major === user2.major) {
      score += 40;
    }

    // Same industry
    if (user1.industry && user2.industry && user1.industry === user2.industry) {
      score += 25;
    }

    // Similar graduation year (within 1 year)
    if (user1.gradYear && user2.gradYear) {
      const yearDiff = Math.abs(parseInt(user1.gradYear) - parseInt(user2.gradYear));
      if (yearDiff === 0) score += 20;
      else if (yearDiff === 1) score += 10;
    }

    // Same experience level
    if (user1.experienceLevel && user2.experienceLevel && 
        user1.experienceLevel === user2.experienceLevel) {
      score += 15;
    }

    // Similar interests (check for common keywords)
    if (user1.interests && user2.interests) {
      const interests1 = user1.interests.toLowerCase().split(/[,\s]+/);
      const interests2 = user2.interests.toLowerCase().split(/[,\s]+/);
      const commonInterests = interests1.filter(i => interests2.includes(i));
      score += commonInterests.length * 5; // 5 points per common interest
    }

    return score;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-slate-800">Recommended Connections</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-12 bg-slate-100 rounded-xl"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-slate-800">Recommended Connections</h3>
        </div>
        <p className="text-sm text-slate-500 text-center py-4">
          Complete your profile to get personalized recommendations
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-indigo-600" />
        <h3 className="font-bold text-slate-800">Recommended Connections</h3>
      </div>
      
      <div className="space-y-2">
        {recommendations.map((user, index) => {
          const handleDmClick = (e) => {
            e.stopPropagation();
            openDmWithUser({
              id: user.id,
              name: user.username,
              avatar: user.username?.[0]?.toUpperCase() || 'U',
              bio: `${user.major || 'Student'} ${user.gradYear ? `'${user.gradYear.slice(-2)}` : ''}`,
              yearsOnPlatform: 1,
              karma: user.score || 100
            });
          };

          return (
            <div
              key={user.id}
              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-all group"
            >
              {/* Avatar */}
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center text-white font-semibold text-xs flex-shrink-0 group-hover:shadow-lg group-hover:shadow-indigo-500/30 transition-all">
                {user.username?.[0]?.toUpperCase() || 'U'}
              </div>
              
              {/* User Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 text-sm truncate">
                  {user.username}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {user.major || 'Student'} {user.gradYear && `'${user.gradYear.slice(-2)}`}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5">
                {/* Match Score */}
                {user.score > 0 && (
                  <div className="flex items-center gap-0.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                    <TrendingUp className="w-3 h-3" />
                    {user.score}
                  </div>
                )}
                
                {/* DM Button */}
                <button
                  onClick={handleDmClick}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  title="Send DM"
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {recommendations.length > 0 && (
        <button className="w-full mt-4 py-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl transition-all">
          View All Connections
        </button>
      )}
    </div>
  );
}
