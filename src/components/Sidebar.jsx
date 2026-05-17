import { Globe, Cpu, Briefcase, TrendingUp, GraduationCap, Coffee, Plus } from 'lucide-react';
import { categories } from '../data/mockData';
import { useApp } from '../context/AppContext';

const iconMap = { Globe, Cpu, Briefcase, TrendingUp, GraduationCap, Coffee };

const Divider = () => <div className="border-t border-slate-100 my-4" />;

export default function Sidebar() {
  const { allPosts, selectedCategory, setSelectedCategory, setIsCreateModalOpen } = useApp();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const todayPosts = allPosts.filter(
    (post) => post.createdAt && new Date(post.createdAt).getTime() >= startOfToday.getTime()
  );
  const todayDiscussions = todayPosts.length;
  const todayComments = todayPosts.reduce((sum, post) => sum + (post.commentCount || 0), 0);
  const participantCount = new Set(todayPosts.map((post) => post.author)).size;
  
  console.log('📊 Sidebar stats:', {
    totalPosts: allPosts.length,
    todayPosts: todayDiscussions,
    todayComments,
    participantCount,
    startOfToday: startOfToday.toISOString()
  });
  
  // Calculate active users based on real activity, minimum 0
  const baseActiveUsers = participantCount > 0 
    ? participantCount * 8 + todayDiscussions * 3 + Math.floor(todayComments * 0.25)
    : 0;
  const activeUsers = Math.max(0, baseActiveUsers);
  
  console.log('👥 Active users calculation:', { participantCount, todayDiscussions, todayComments, activeUsers });

  const Gap = () => <div style={{ height: '18px', flexShrink: 0 }} />;

  return (
    <aside className="min-w-0 min-h-full flex flex-col" style={{ paddingTop: '18px', paddingBottom: '18px', paddingLeft: '20px', paddingRight: '20px' }}>

      {/* 1. Start Discussion — taller, pushed down from logo */}
      <button
        onClick={() => setIsCreateModalOpen(true)}
        className="w-full flex items-center justify-center gap-2.5 px-4 text-base bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-2xl hover:from-indigo-700 hover:to-violet-700 transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02]"
        style={{ paddingTop: '22px', paddingBottom: '22px' }}
      >
        <Plus className="w-5 h-5" />
        Start Discussion
      </button>

      {/* 2. Fixed gap below button */}
      <Gap />

      {/* 2. Industries — bigger fonts/icons */}
      <nav>
        <h3 className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Industries
        </h3>
        <ul className="space-y-0.5">
          {categories.map((category) => {
            const Icon = iconMap[category.icon];
            const isActive = selectedCategory === category.id;
            return (
              <li key={category.id}>
                <button
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[15px] font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                      : 'text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm'
                  }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-indigo-500' : 'text-slate-400'}`} />
                  {category.name}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Middle flex spacer — pushes Activity down */}
      <div className="flex-1" />

      {/* 5. Today's Activity — same distance above Join Community as Industries is below button */}
      <div>
        <h3 className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Today's Activity
        </h3>
        <div className="space-y-3 px-1">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500">Active Users</span>
            <span className="font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md tabular-nums">
              {activeUsers.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500">Discussions Today</span>
            <span className="font-semibold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md tabular-nums">
              {todayDiscussions.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500">Comments Today</span>
            <span className="font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md tabular-nums">
              {todayComments.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Same fixed gap above Join Community (mirrors gap below button) */}
      <Gap />

      {/* 3. Join the Community */}
      <div style={{ padding: '20px 18px' }} className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
        <h3 className="font-bold text-base mb-4">Join the Community</h3>
        <button className="w-full py-2.5 bg-white text-indigo-600 text-sm font-semibold rounded-xl hover:bg-indigo-50 transition-all">
          Learn More
        </button>
      </div>

    </aside>
  );
}
