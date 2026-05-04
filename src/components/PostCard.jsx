import { useState } from 'react';
import { MessageSquare, ChevronUp, ChevronDown, Pin, Zap, Clock, Share2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import UserActionMenu from './UserActionMenu';

export default function PostCard({ post }) {
  const { setSelectedPost, votePost, commentCounts } = useApp();
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);

  const getCategoryColor = (category) => {
    const colors = {
      finance: 'bg-emerald-100 text-emerald-700',
      consulting: 'bg-violet-100 text-violet-700',
      pm: 'bg-indigo-100 text-indigo-700',
      'swe-tech': 'bg-sky-100 text-sky-700',
      quant: 'bg-teal-100 text-teal-700',
      engineering: 'bg-orange-100 text-orange-700',
      medicine: 'bg-rose-100 text-rose-700',
      academia: 'bg-amber-100 text-amber-700',
      all: 'bg-slate-100 text-slate-700',
    };
    return colors[category] || colors.all;
  };

  const getCategoryName = (category) => {
    const names = {
      finance: 'Finance',
      consulting: 'Consulting',
      pm: 'PM',
      'swe-tech': 'SWE/Tech',
      quant: 'Quant',
      engineering: 'Engineering',
      medicine: 'Medicine',
      academia: 'Academia',
      all: 'General',
    };
    return names[category] || 'General';
  };

  const postUser = {
    id: post.author.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    name: post.author,
    avatar: post.avatar,
    bio: `${getCategoryName(post.category)} recruiting`,
    yearsOnPlatform: 2,
    karma: Math.max(120, post.votes + 150),
  };

  return (
    <article 
      className={`bg-white rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-lg hover:shadow-slate-200/50 transition-all cursor-pointer group ${
        post.isPinned ? 'ring-2 ring-indigo-100 border-indigo-200' : ''
      }`}
      style={{ margin: '0 2px' }}
      onClick={() => setSelectedPost(post)}
    >
      <div style={{ padding: '10px 24px' }}>
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
                <UserActionMenu user={postUser}>
                  <div className="flex items-center gap-2 hover:bg-slate-50 rounded-lg px-1.5 py-1 transition-colors">
                    <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                      {post.avatar}
                    </div>
                    <span className="text-sm font-medium text-slate-700">{post.author}</span>
                  </div>
                </UserActionMenu>
                
                {/* Time */}
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">{post.timeAgo}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Comments */}
                <div className="flex items-center gap-2 text-slate-500">
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-sm font-medium">{commentCounts?.[post.id] ?? 0}</span>
                </div>

                {/* Share Menu */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsShareMenuOpen((isOpen) => !isOpen);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all text-sm font-medium"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>

                  {isShareMenuOpen && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 top-full mt-2 w-36 bg-white border border-slate-200 rounded-xl shadow-lg z-20 p-1.5"
                    >
                      <button className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">
                        Copy link
                      </button>
                      <button className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">
                        Embed
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
