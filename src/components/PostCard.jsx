import { MessageSquare, ChevronUp, ChevronDown, Pin, Zap, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function PostCard({ post }) {
  const { setSelectedPost, votePost } = useApp();

  const getCategoryColor = (category) => {
    const colors = {
      tech: 'bg-sky-100 text-sky-700',
      career: 'bg-violet-100 text-violet-700',
      finance: 'bg-emerald-100 text-emerald-700',
      education: 'bg-amber-100 text-amber-700',
      lifestyle: 'bg-rose-100 text-rose-700',
      all: 'bg-slate-100 text-slate-700',
    };
    return colors[category] || colors.all;
  };

  const getCategoryName = (category) => {
    const names = {
      tech: 'Technology',
      career: 'Career',
      finance: 'Finance',
      education: 'Education',
      lifestyle: 'Lifestyle',
      all: 'General',
    };
    return names[category] || 'General';
  };

  return (
    <article 
      className={`bg-white rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-lg hover:shadow-slate-200/50 transition-all cursor-pointer group ${
        post.isPinned ? 'ring-2 ring-indigo-100 border-indigo-200' : ''
      }`}
      onClick={() => setSelectedPost(post)}
    >
      <div className="p-6">
        <div className="flex gap-5">
          {/* Vote Section */}
          <div className="flex flex-col items-center gap-1 pt-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                votePost(post.id, 'up');
              }}
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
            >
              <ChevronUp className="w-5 h-5" />
            </button>
            <span className={`text-sm font-bold min-w-[40px] text-center ${
              post.votes > 0 ? 'text-indigo-600' : post.votes < 0 ? 'text-rose-500' : 'text-slate-400'
            }`}>
              {post.votes > 0 ? `+${post.votes}` : post.votes}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                votePost(post.id, 'down');
              }}
              className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

          {/* Content Section */}
          <div className="flex-1 min-w-0">
            {/* Badges */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {post.isPinned && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg">
                  <Pin className="w-3 h-3" />
                  Pinned
                </span>
              )}
              {post.isTrending && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-600 text-xs font-bold rounded-lg">
                  <Zap className="w-3 h-3" />
                  Trending
                </span>
              )}
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${getCategoryColor(post.category)}`}>
                {getCategoryName(post.category)}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-base font-bold text-slate-800 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
              {post.title}
            </h3>

            {/* Preview */}
            <p className="text-sm text-slate-500 line-clamp-2 mb-4 leading-relaxed">
              {post.content}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Author */}
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                    {post.avatar}
                  </div>
                  <span className="text-sm font-medium text-slate-700">{post.author}</span>
                </div>
                
                {/* Time */}
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">{post.timeAgo}</span>
                </div>
              </div>

              {/* Comments */}
              <div className="flex items-center gap-2 text-slate-500">
                <MessageSquare className="w-4 h-4" />
                <span className="text-sm font-medium">{post.commentCount}</span>
                {post.newComments > 0 && (
                  <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-md">
                    {post.newComments} new
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
