import { TrendingUp, ArrowUp, ArrowDown } from 'lucide-react';
import { trendingTopics } from '../data/mockData';
import RecommendedUsers from './RecommendedUsers';

const VISIBLE_TOPICS = 3;

export default function TrendingSidebar({ currentUser }) {
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
          {shown.map((topic, index) => (
            <TopicRow key={topic.id} topic={topic} index={index} />
          ))}
        </div>

        {/* Scrollable overflow for the rest */}
        {hidden.length > 0 && (
          <div className="max-h-40 overflow-y-auto divide-y divide-slate-50 border-t border-slate-100">
            {hidden.map((topic, index) => (
              <TopicRow key={topic.id} topic={topic} index={VISIBLE_TOPICS + index} />
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

function TopicRow({ topic, index }) {
  return (
    <div style={{ padding: '2px 5px' }} className="hover:bg-slate-50 cursor-pointer transition-all">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <span className="text-xs font-bold text-slate-300">#{index + 1}</span>
          <h3 className="text-sm font-semibold text-slate-800 mt-0.5 truncate">{topic.name}</h3>
          <p className="text-xs text-slate-400 mt-1">{topic.posts.toLocaleString()} posts</p>
        </div>
        <div className={`flex items-center gap-0.5 text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${
          topic.change > 0 ? 'text-emerald-700 bg-emerald-50' : topic.change < 0 ? 'text-rose-700 bg-rose-50' : 'text-slate-500 bg-slate-100'
        }`}>
          {topic.change > 0
            ? <ArrowUp className="w-3 h-3" />
            : <ArrowDown className="w-3 h-3" />}
          {Math.abs(topic.change)}%
        </div>
      </div>
    </div>
  );
}
