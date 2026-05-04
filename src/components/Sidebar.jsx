import { Globe, Cpu, Briefcase, TrendingUp, GraduationCap, Coffee, Plus } from 'lucide-react';
import { categories } from '../data/mockData';
import { useApp } from '../context/AppContext';

const iconMap = {
  Globe,
  Cpu,
  Briefcase,
  TrendingUp,
  GraduationCap,
  Coffee,
};

export default function Sidebar() {
  const { allPosts, selectedCategory, setSelectedCategory, setIsCreateModalOpen } = useApp();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const todayPosts = allPosts.filter((post) => {
    if (!post.createdAt) return false;
    return new Date(post.createdAt).getTime() >= startOfToday.getTime();
  });

  const todayDiscussions = todayPosts.length;
  const todayComments = todayPosts.reduce(
    (sum, post) => sum + (post.commentCount || 0),
    0
  );
  const participantCount = new Set(todayPosts.map((post) => post.author)).size;
  const activeUsers = participantCount * 8 + todayDiscussions * 3 + Math.floor(todayComments * 0.25);

  return (
    <aside className="min-w-0">
      <div className="sticky top-24">
        {/* Create Post Button */}
        <button
          onClick={() => setIsCreateModalOpen(true)}
          style={{ paddingTop: '24px', paddingBottom: '24px' }}
          className="w-full flex items-center justify-center gap-2 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-2xl hover:from-indigo-700 hover:to-violet-700 transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02]"
        >
          <Plus className="w-5 h-5" />
          Start Discussion
        </button>

        {/* Industries */}
        <nav style={{ marginTop: '48px' }}>
          <h3 className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
            Industries
          </h3>
          <ul className="space-y-1.5">
            {categories.map((category) => {
              const Icon = iconMap[category.icon];
              const isActive = selectedCategory === category.id;
              
              return (
                <li key={category.id}>
                  <button
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                        : 'text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-500' : 'text-slate-400'}`} />
                    {category.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Quick Stats */}
        <div style={{ marginTop: '80px' }} className="p-5 bg-white rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Today's Activity</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Active Users</span>
              <span className="font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{activeUsers.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Discussions Today</span>
              <span className="font-semibold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md">{todayDiscussions.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Comments on Today&apos;s Posts</span>
              <span className="font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">{todayComments.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
