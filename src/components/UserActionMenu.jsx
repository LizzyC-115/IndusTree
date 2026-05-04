import { useEffect, useRef, useState } from 'react';
import { MessageCircle, UserRound } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function UserActionMenu({ user, children }) {
  const { openProfile, openDmWithUser } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((open) => !open);
        }}
        className="text-left"
      >
        {children}
      </button>

      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute left-0 top-full mt-2 w-40 bg-white border border-slate-200 rounded-xl shadow-lg z-30 p-1.5"
        >
          <button
            type="button"
            onClick={() => {
              openProfile(user);
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <UserRound className="w-4 h-4" />
            Profile
          </button>
          <button
            type="button"
            onClick={() => {
              openDmWithUser(user);
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            DM User
          </button>
        </div>
      )}
    </div>
  );
}
