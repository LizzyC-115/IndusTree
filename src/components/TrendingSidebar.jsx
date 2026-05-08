import { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { useApp } from '../context/AppContext';
import RecommendedUsers from './RecommendedUsers';

const CATEGORY_NAMES = {
  finance: 'Finance',
  consulting: 'Consulting',
  pm: 'PM',
  'swe-tech': 'SWE / Tech',
  quant: 'Quant',
  engineering: 'Engineering',
  medicine: 'Medicine',
  academia: 'Academia',
};

const VISIBLE_TOPICS = 3;

export default function TrendingSidebar({ currentUser }) {
  const { allPosts, commentCounts } = useApp();

  const trendingTopics = useMemo(() => {
    const byCategory = {};
    allPosts.forEach((post) => {
      if (post.isPinned || post.category === 'all') return;
      if (!byCategory[post.category]) {
        byCategory[post.category] = { postCount: 0, totalComments: 0, newComments: 0, totalVotes: 0 };
      }
      const comments = commentCounts[post.id] ?? post.commentCount ?? 0;
      byCategory[post.category].postCount += 1;
      byCategory[post.category].totalComments += comments;
      byCategory[post.category].newComments += post.newComments || 0;
      byCategory[post.category].totalVotes += post.votes || 0;
    });

    return Object.entries(byCategory)
      .map(([catId, data]) => {
        const trendScore = data.totalVotes + data.totalComments * 3;
        return {
          id: catId,
          name: CATEGORY_NAMES[catId] || catId,
          posts: data.postCount + data.totalComments,
          trendScore,
        };
      })
      .sort((a, b) => b.trendScore - a.trendScore)
      .map(({ trendScore: _ts, ...rest }, idx) => ({ ...rest, rank: idx + 1 }));
  }, [allPosts, commentCounts]);

  const shown = trendingTopics.slice(0, VISIBLE_TOPICS);
  const hidden = trendingTopics.slice(VISIBLE_TOPICS);

  return (
    <aside className="min-w-0 flex flex-col gap-4 min-h-full" style={{ paddingTop: '18px', paddingBottom: '18px', paddingLeft: '10px', paddingRight: '10px' }}>

      {/* Trending Topics */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div style={{ padding: '12px 16px' }} className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <h2 className="flex items-center gap-2 font-bold text-slate-800 text-sm">
            <TrendingUp className="w-4 h-4 text-rose-500" />
            Trending Topics
          </h2>
        </div>

        {/* Always-visible top 3 */}
        <div className="divide-y divide-slate-50">
          {shown.map((topic) => (
            <TopicRow key={topic.id} topic={topic} />
          ))}
        </div>

        {/* Scrollable overflow for the rest */}
        {hidden.length > 0 && (
          <div className="max-h-40 overflow-y-auto divide-y divide-slate-50 border-t border-slate-100">
            {hidden.map((topic) => (
              <TopicRow key={topic.id} topic={topic} />
            ))}
          </div>
        )}
      </div>

      {/* Spacer pushes connections toward the bottom */}
      <div className="flex-1" />

      {/* Recommended Connections */}
      <RecommendedUsers currentUser={currentUser} />

      {/* Footer */}
      <div className="px-2 pb-1">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
          <a href="#" className="hover:text-indigo-600 transition-colors">About</a>
          <a href="#" className="hover:text-indigo-600 transition-colors">Help</a>
          <a href="#" className="hover:text-indigo-600 transition-colors">Privacy</a>
          <a href="#" className="hover:text-indigo-600 transition-colors">Terms</a>
        </div>
        <p className="text-xs text-slate-300 mt-2">© 2024 IndusTree</p>
      </div>

    </aside>
  );
}

function TopicRow({ topic }) {
  return (
    <div style={{ padding: '2px 5px' }} className="hover:bg-slate-50 cursor-pointer transition-all">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <span className="text-xs font-bold text-slate-300">#{topic.rank}</span>
          <h3 className="text-sm font-semibold text-slate-800 mt-0.5 truncate">{topic.name}</h3>
          <p className="text-xs text-slate-400 mt-1">{topic.posts.toLocaleString()} posts</p>
        </div>
      </div>
    </div>
  );
}
