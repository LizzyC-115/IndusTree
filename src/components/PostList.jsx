import { useState, useEffect, useRef } from 'react';
import { Clock, TrendingUp, MessageSquare, CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import PostCard from './PostCard';

const POSTS_PER_PAGE = 10;

export default function PostList() {
  const {
    posts,
    sortBy,
    setSortBy,
    dateSortOrder,
    setDateSortOrder,
    selectedCategory,
  } = useApp();

  const [currentPage, setCurrentPage] = useState(1);
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const dateRef = useRef(null);

  // Close date dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (dateRef.current && !dateRef.current.contains(e.target)) setDateDropdownOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Reset to page 1 whenever sort, date order, or category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [sortBy, dateSortOrder, selectedCategory]);

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

  const totalPages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedPosts = posts.slice(
    (safePage - 1) * POSTS_PER_PAGE,
    safePage * POSTS_PER_PAGE
  );

  const goToPage = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Build page number list: always show first, last, and a window around current
  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = new Set([1, totalPages, safePage, safePage - 1, safePage + 1].filter(p => p >= 1 && p <= totalPages));
    return Array.from(pages).sort((a, b) => a - b);
  };
  const pageNumbers = getPageNumbers();

  return (
    <div className="min-w-0 px-2" style={{ paddingTop: '18px' }}>
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-100 px-5 py-4 shadow-sm" style={{ marginBottom: '10px' }}>
        {/* Single pill bar containing all 4 sort controls */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">

          {/* Recently Active / Most Popular / Most Discussed */}
          {sortOptions.map((option) => {
            const Icon = option.icon;
            const isActive = sortBy === option.id;
            return (
              <button
                key={option.id}
                onClick={() => setSortBy(option.id)}
                className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
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

          {/* Date sort — same pill style, opens dropdown on click */}
          <div ref={dateRef} className="relative flex-1">
            <button
              onClick={() => setDateDropdownOpen((o) => !o)}
              className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                dateDropdownOpen
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span className="hidden sm:inline">
                {dateSortOrder === 'newest' ? 'Newest' : 'Oldest'}
              </span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {dateDropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-20 p-1 overflow-hidden">
                {[
                  { value: 'newest', label: 'Newest to Oldest' },
                  { value: 'oldest', label: 'Oldest to Newest' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setDateSortOrder(opt.value); setDateDropdownOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                      dateSortOrder === opt.value
                        ? 'bg-indigo-50 text-indigo-600 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Posts */}
      <div className="space-y-3">
        {posts.length > 0 ? (
          paginatedPosts.map((post) => (
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between bg-white rounded-2xl border border-slate-100 shadow-sm" style={{ padding: '10px 20px' }}>
          <span className="text-sm text-slate-500">
            Page <span className="font-semibold text-slate-700">{safePage}</span> of{' '}
            <span className="font-semibold text-slate-700">{totalPages}</span>
            <span className="hidden sm:inline"> &middot; {posts.length} discussions</span>
          </span>

          {/* Nav shifted inward with mr-6 */}
          <div className="flex items-center gap-1 mr-6">
            {/* Prev */}
            <button
              onClick={() => goToPage(safePage - 1)}
              disabled={safePage === 1}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Prev</span>
            </button>

            {/* Page numbers */}
            {pageNumbers.map((page, idx) => {
              const prev = pageNumbers[idx - 1];
              const showEllipsis = prev && page - prev > 1;
              return (
                <span key={page} className="flex items-center gap-1">
                  {showEllipsis && (
                    <span className="px-2 text-slate-400 text-sm select-none">…</span>
                  )}
                  <button
                    onClick={() => goToPage(page)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                      page === safePage
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
                    }`}
                  >
                    {page}
                  </button>
                </span>
              );
            })}

            {/* Next */}
            <button
              onClick={() => goToPage(safePage + 1)}
              disabled={safePage === totalPages}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
