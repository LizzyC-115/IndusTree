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
  const { selectedCategory, setSelectedCategory, setIsCreateModalOpen } = useApp();

  return (
    <aside className="min-w-0">
      <div className="sticky top-24">
        {/* Create Post Button */}
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-2xl hover:from-indigo-700 hover:to-violet-700 transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02]"
        >
          <Plus className="w-5 h-5" />
          Start Discussion
        </button>

        {/* Categories */}
        <nav className="mt-8">
          <h3 className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
            Categories
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
        <div className="mt-8 p-5 bg-white rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Community Stats</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Active Users</span>
              <span className="font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">2,847</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Discussions</span>
              <span className="font-semibold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md">12,453</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Comments Today</span>
              <span className="font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">1,234</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
