import { Clock, TrendingUp, MessageSquare, Filter } from 'lucide-react';
import { useApp } from '../context/AppContext';
import PostCard from './PostCard';

export default function PostList() {
  const { posts, sortBy, setSortBy, selectedCategory } = useApp();

  const sortOptions = [
    { id: 'recent', label: 'Recently Active', icon: Clock },
    { id: 'popular', label: 'Most Popular', icon: TrendingUp },
    { id: 'comments', label: 'Most Discussed', icon: MessageSquare },
  ];

  const getCategoryTitle = () => {
    const titles = {
      all: 'All Discussions',
      tech: 'Technology',
      career: 'Career',
      finance: 'Finance',
      education: 'Education',
      lifestyle: 'Lifestyle',
    };
    return titles[selectedCategory] || 'Discussions';
  };

  return (
    <div className="min-w-0">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 mb-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800">{getCategoryTitle()}</h1>
          
          {/* Sort Options */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            {sortOptions.map((option) => {
              const Icon = option.icon;
              const isActive = sortBy === option.id;
              
              return (
                <button
                  key={option.id}
                  onClick={() => setSortBy(option.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {posts.length > 0 ? (
          posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center shadow-sm">
            <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <MessageSquare className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">No discussions found</h3>
            <p className="text-slate-500">Be the first to start a discussion in this category!</p>
          </div>
        )}
      </div>
    </div>
  );
}
