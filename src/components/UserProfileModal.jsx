import { X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function UserProfileModal() {
  const { selectedProfileUser, closeProfile } = useApp();

  if (!selectedProfileUser) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeProfile} />

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6">
        <button
          type="button"
          onClick={closeProfile}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-2xl flex items-center justify-center text-white font-bold text-lg">
            {selectedProfileUser.avatar}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{selectedProfileUser.name}</h2>
            <p className="text-sm text-slate-500">{selectedProfileUser.bio}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Tenure</p>
            <p className="text-sm font-semibold text-slate-800 mt-1">
              Redditor for {selectedProfileUser.yearsOnPlatform}y
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Karma</p>
            <p className="text-sm font-semibold text-slate-800 mt-1">
              {selectedProfileUser.karma.toLocaleString()} karma
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
