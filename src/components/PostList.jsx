import { useState, useEffect, useRef } from 'react';
import { Clock, TrendingUp, MessageSquare, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react';
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
    setIsCreateModalOpen,
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
    <div
      className="min-w-0 px-2"
      style={{
        paddingTop: '18px',
        width: '100%',
        maxWidth: '100%',
        overflowX: 'hidden',
        minWidth: 0,
        boxSizing: 'border-box',
      }}
    >
      {/* Combined composer + sort bar — single card */}
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: '14px', overflow: 'hidden' }}>
        {/* Gradient header — matches Trending Topics */}
        <div className="bg-white border-b border-slate-100" style={{ padding: '14px 20px' }}>
          <p style={{ fontSize: '15px', fontWeight: '600', color: '#334155', margin: 0 }}>Share something with your community:</p>
        </div>
        <div style={{ padding: '14px 20px 14px' }}>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            style={{ width: '100%', textAlign: 'left', padding: '12px 18px', background: '#f1f5f9', borderRadius: '12px', fontSize: '14px', color: '#94a3b8', border: 'none', cursor: 'pointer' }}
          >
            Start a discussion…
          </button>

          {/* Thin divider */}
          <div style={{ height: '1px', background: '#f1f5f9', margin: '14px 0 10px' }} />

        {/* Sort tabs inline inside the same card */}
        <div className="flex items-center bg-slate-100 rounded-xl" style={{ padding: '4px', gap: '4px', minWidth: 0, overflow: 'hidden' }}>

          {/* Recently Active / Most Popular / Most Discussed */}
          {sortOptions.map((option) => {
            const Icon = option.icon;
            const isActive = sortBy === option.id;
            return (
              <button
                key={option.id}
                onClick={() => setSortBy(option.id)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                    ? 'bg-white text-rose-500 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                style={{ minWidth: 0, overflow: 'hidden', padding: '10px 12px' }}
              >
                <Icon className="w-4 h-4" />
                <span
                  className="hidden sm:inline"
                  style={{
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '100%',
                    display: 'block',
                  }}
                >
                  {option.label}
                </span>
              </button>
            );
          })}

          {/* Date sort — same pill style, opens dropdown on click */}
          <div ref={dateRef} className="relative flex-1" style={{ minWidth: 0, overflow: 'hidden' }}>
            <button
              onClick={() => setDateDropdownOpen((o) => !o)}
              className={`w-full flex items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition-all ${
                dateDropdownOpen
                  ? 'bg-white text-rose-500 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              style={{ minWidth: 0, overflow: 'hidden', padding: '10px 12px' }}
            >
              <CalendarDays className="w-4 h-4" />
              <span
                className="hidden sm:inline"
                style={{
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '100%',
                  display: 'block',
                }}
              >
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
                        ? 'bg-rose-50 text-rose-500 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>{/* end sort tabs */}
        </div>{/* end padding div */}
      </div>{/* end combined card */}

      {/* Posts */}
      <div className="space-y-3" style={{ minWidth: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {posts.length > 0 ? (
          paginatedPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center shadow-sm" style={{ minWidth: 0, overflow: 'hidden' }}>
            <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ minWidth: 0, overflow: 'hidden' }}>
              <MessageSquare className="w-10 h-10 text-slate-300" />
            </div>
            <h3
              className="text-lg font-bold text-slate-800 mb-2"
              style={{ wordBreak: 'break-word', overflowWrap: 'break-word', minWidth: 0 }}
            >
              No discussions found
            </h3>
            <p
              className="text-slate-500"
              style={{ wordBreak: 'break-word', overflowWrap: 'break-word', minWidth: 0 }}
            >
              Be the first to start a discussion in this industry!
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          className="mt-6 flex items-center justify-between bg-white rounded-2xl border border-slate-100 shadow-sm"
          style={{ padding: '10px 20px', minWidth: 0, overflow: 'hidden', boxSizing: 'border-box' }}
        >
          <span className="text-sm text-slate-500" style={{ wordBreak: 'break-word', overflowWrap: 'break-word', minWidth: 0 }}>
            Page <span className="font-semibold text-slate-700">{safePage}</span> of{' '}
            <span className="font-semibold text-slate-700">{totalPages}</span>
            <span className="hidden sm:inline" style={{ wordBreak: 'break-word', overflowWrap: 'break-word', minWidth: 0 }}>
              {' '}
              &middot; {posts.length} discussions
            </span>
          </span>

          {/* Nav shifted inward with mr-6 */}
          <div className="flex items-center gap-1 mr-6" style={{ minWidth: 0, overflow: 'hidden' }}>
            {/* Prev */}
            <button
              onClick={() => goToPage(safePage - 1)}
              disabled={safePage === 1}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-rose-500 hover:bg-rose-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              style={{ minWidth: 0, overflow: 'hidden' }}
            >
              <ChevronLeft className="w-4 h-4" />
              <span
                className="hidden sm:inline"
                style={{
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '100%',
                  display: 'block',
                }}
              >
                Prev
              </span>
            </button>

            {/* Page numbers */}
            {pageNumbers.map((page, idx) => {
              const prev = pageNumbers[idx - 1];
              const showEllipsis = prev && page - prev > 1;
              return (
                <span key={page} className="flex items-center gap-1" style={{ minWidth: 0, overflow: 'hidden' }}>
                  {showEllipsis && (
                    <span
                      className="px-2 text-slate-400 text-sm select-none"
                      style={{ wordBreak: 'break-word', overflowWrap: 'break-word', minWidth: 0 }}
                    >
                      …
                    </span>
                  )}
                  <button
                    onClick={() => goToPage(page)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                      page === safePage
                        ? 'bg-rose-500 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-rose-50 hover:text-rose-500'
                    }`}
                    style={{ minWidth: 0, overflow: 'hidden' }}
                  >
                    <span style={{ wordBreak: 'break-word', overflowWrap: 'break-word', minWidth: 0 }}>{page}</span>
                  </button>
                </span>
              );
            })}

            {/* Next */}
            <button
              onClick={() => goToPage(safePage + 1)}
              disabled={safePage === totalPages}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-rose-500 hover:bg-rose-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              style={{ minWidth: 0, overflow: 'hidden' }}
            >
              <span
                className="hidden sm:inline"
                style={{
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '100%',
                  display: 'block',
                }}
              >
                Next
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
