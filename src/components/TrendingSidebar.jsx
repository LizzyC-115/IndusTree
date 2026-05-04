import { TrendingUp, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { trendingTopics } from '../data/mockData';
import RecommendedUsers from './RecommendedUsers';

export default function TrendingSidebar({ currentUser }) {
  return (
    <aside className="min-w-0">
      <div className="sticky top-24 space-y-6">
        {/* Trending Topics */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <h2 className="flex items-center gap-2 font-bold text-slate-800">
              <TrendingUp className="w-5 h-5 text-rose-500" />
              Trending Topics
            </h2>
          </div>
          
          <div className="divide-y divide-slate-50">
            {trendingTopics.map((topic, index) => (
              <div 
                key={topic.id}
                className="p-4 hover:bg-slate-50 cursor-pointer transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-300">#{index + 1}</span>
                    <h3 className="text-sm font-semibold text-slate-800 mt-0.5 truncate">{topic.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">{topic.posts.toLocaleString()} posts</p>
                  </div>
                  <div className={`flex items-center gap-0.5 text-xs font-bold px-2 py-1 rounded-full ${
                    topic.change > 0 ? 'text-emerald-700 bg-emerald-50' : topic.change < 0 ? 'text-rose-700 bg-rose-50' : 'text-slate-500 bg-slate-100'
                  }`}>
                    {topic.change > 0 ? (
                      <ArrowUp className="w-3 h-3" />
                    ) : topic.change < 0 ? (
                      <ArrowDown className="w-3 h-3" />
                    ) : (
                      <Minus className="w-3 h-3" />
                    )}
                    {Math.abs(topic.change)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Users */}
        <RecommendedUsers currentUser={currentUser} />

        {/* Featured Banner */}
        <div className="p-6 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 rounded-2xl text-white shadow-lg shadow-indigo-500/25">
          <h3 className="font-bold text-lg mb-2">Join the Community</h3>
          <p className="text-sm text-indigo-100 mb-5 leading-relaxed">
            Connect with professionals, share insights, and grow together.
          </p>
          <button className="w-full py-2.5 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition-all hover:scale-[1.02]">
            Learn More
          </button>
        </div>

        {/* Footer Links */}
        <div className="px-2">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
            <a href="#" className="hover:text-indigo-600 transition-colors">About</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Help</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Terms</a>
          </div>
          <p className="text-xs text-slate-300 mt-3">© 2024 IndusTree</p>
        </div>
      </div>
    </aside>
  );
}
