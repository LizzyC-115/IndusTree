import { useState } from 'react';
import { Search, Bell, User, Menu, TreePine, LogOut } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Header({ user, onLogout }) {
  const { searchQuery, setSearchQuery } = useApp();
  const [showDropdown, setShowDropdown] = useState(false);

  return ( // hi
    <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200/50 sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="flex items-center justify-between h-18 py-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-11 h-11 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl shadow-lg shadow-indigo-500/30">
              <TreePine className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              IndusTree
            </span>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-lg mx-12">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search discussions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-100 border-0 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            <button className="relative p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
            </button>
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center text-white font-semibold text-sm cursor-pointer hover:shadow-lg hover:shadow-indigo-500/30 transition-all hover:scale-105"
              >
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </button>
              
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-800">{user?.username}</p>
                    <p className="text-xs text-slate-500">View Profile</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
