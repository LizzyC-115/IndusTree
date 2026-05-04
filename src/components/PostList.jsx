import { Clock, TrendingUp, MessageSquare, CalendarDays } from 'lucide-react';
import { useApp } from '../context/AppContext';
import PostCard from './PostCard';

export default function PostList() {
  const {
    posts,
    sortBy,
    setSortBy,
    dateSortOrder,
    setDateSortOrder,
    selectedCategory,
  } = useApp();

  const sortOptions = [
    { id: 'recent', label: 'Recently Active', icon: Clock },
    { id: 'popular', label: 'Most Popular', icon: TrendingUp },
    { id: 'comments', label: 'Most Discussed', icon: MessageSquare },
  ];

  const getCategoryTitle = () => {
    const titles = {
      all: 'All Industries',
      finance: 'Finance',
      consulting: 'Consulting',
      pm: 'PM',
      'swe-tech': 'SWE/Tech',
      quant: 'Quant',
      engineering: 'Engineering',
      medicine: 'Medicine',
      academia: 'Academia',
    };
    return titles[selectedCategory] || 'Industry Discussions';
  };

  return (
    <div className="min-w-0">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 mb-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="text-xl font-bold text-slate-800">{getCategoryTitle()}</h1>
          
          <div className="flex flex-wrap items-center gap-2">
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

            {/* Date Posted Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-600">Date</span>
              <div className="relative">
                <CalendarDays className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={dateSortOrder}
                onChange={(e) => setDateSortOrder(e.target.value)}
                className="h-10 pl-9 pr-8 text-sm font-medium text-slate-600 bg-slate-100 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
              >
                <option value="newest">Newest to Oldest</option>
                <option value="oldest">Oldest to Newest</option>
              </select>
              </div>
            </div>
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
            <p className="text-slate-500">Be the first to start a discussion in this industry!</p>
          </div>
        )}
      </div>
    </div>
  );
}
