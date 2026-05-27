import { useState } from 'react';
import { MessageSquare, ChevronUp, ChevronDown, Share2, Clock, Pin, PinOff, Zap, Trash2, UserX } from 'lucide-react';
import { useApp } from '../context/AppContext';
import UserActionMenu from './UserActionMenu';

export default function PostCard({ post }) {
  const { setSelectedPost, votePost, commentCounts, currentUser, deletePost, isMod, modDeletePost, pinPost, banUser } = useApp();
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmBan, setConfirmBan] = useState(false);

  const isOwner = currentUser?.uid && post.authorId === currentUser.uid;
  const canDelete = isOwner || isMod;

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!confirmDelete) { setConfirmDelete(true); return; }
    if (isMod && !isOwner) await modDeletePost(post.id);
    else await deletePost(post.id);
    setConfirmDelete(false);
  };

  const handlePin = async (e) => {
    e.stopPropagation();
    await pinPost(post.id, post.isPinned);
  };

  const handleBan = async (e) => {
    e.stopPropagation();
    if (!confirmBan) { setConfirmBan(true); return; }
    await banUser(post.authorId);
    setConfirmBan(false);
  };

  const getCategoryColor = (category) => {
    const colors = {
      finance: 'bg-rose-100 text-rose-700',
      consulting: 'bg-rose-100 text-rose-700',
      pm: 'bg-rose-100 text-rose-700',
      'swe-tech': 'bg-rose-100 text-rose-700',
      quant: 'bg-rose-100 text-rose-700',
      engineering: 'bg-rose-100 text-rose-700',
      medicine: 'bg-rose-100 text-rose-700',
      academia: 'bg-rose-100 text-rose-700',
      all: 'bg-slate-100 text-slate-700',
      miscellaneous: 'bg-slate-100 text-slate-700',
      'mod-reminders': 'bg-amber-100 text-amber-700',
    };
    return colors[category] || colors.all;
  };

  const getCategoryName = (category) => {
    const names = {
      finance: 'Finance',
      consulting: 'Consulting',
      pm: 'PM',
      'swe-tech': 'SWE/Tech',
      quant: 'Quant',
      engineering: 'Engineering',
      medicine: 'Medicine',
      academia: 'Academia',
      all: 'General',
      miscellaneous: 'Miscellaneous',
      'mod-reminders': 'Mod Reminders',
    };
    return names[category] || 'General';
  };

  const postUser = {
    id: post.author.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    name: post.author,
    avatar: post.avatar,
    photoURL: post.authorPhotoURL || null,
    bio: `${getCategoryName(post.category)} recruiting`,
    yearsOnPlatform: 2,
    karma: Math.max(120, post.votes + 150),
  };

  return (
    <article
      className={`bg-white rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-lg hover:shadow-slate-200/50 transition-all cursor-pointer group ${
        post.isPinned ? 'ring-2 ring-rose-100 border-rose-200' : ''
      }`}
      style={{ margin: '0 2px' }}
      onClick={() => setSelectedPost(post)}
    >
      <div style={{ padding: '7px 10px 7px 10px' }}>

        {/* Top row: avatar + author + category tag | timestamp */}
        <div className="flex items-center justify-between mb-3">
          <UserActionMenu user={postUser}>
            <div className="flex items-center gap-2.5">
              {/* Circular avatar — real photo if available, else initial */}
              {post.authorPhotoURL ? (
                <img
                  src={post.authorPhotoURL}
                  alt={post.author}
                  className="w-9 h-9 rounded-full object-cover flex-shrink-0 ring-2 ring-slate-100"
                />
              ) : (
                <div className="w-9 h-9 bg-rose-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {post.avatar}
                </div>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-slate-800 hover:text-rose-500 transition-colors">
                  {post.author}
                </span>
                {/* Badges inline with name */}
                {post.isPinned && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-xs font-bold rounded-md">
                    <Pin className="w-3 h-3" />
                    Pinned
                  </span>
                )}
                {post.isTrending && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-600 text-xs font-bold rounded-md">
                    <Zap className="w-3 h-3" />
                    Trending
                  </span>
                )}
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-md ${getCategoryColor(post.category)}`}>
                  {getCategoryName(post.category)}
                </span>
              </div>
            </div>
          </UserActionMenu>

          {/* Timestamp top-right */}
          <div className="flex items-center gap-1 text-slate-400 flex-shrink-0 ml-3">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs whitespace-nowrap">{post.timeAgo}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-slate-800 mb-2 line-clamp-2 group-hover:text-rose-500 transition-colors">
          {post.title}
        </h3>

        {/* 2-line preview */}
        <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed mb-4">
          {post.content}
        </p>

        {/* Post image (if any) */}
        {post.imageURL && (
          <div style={{ marginBottom: '16px', borderRadius: '12px', overflow: 'hidden' }}>
            <img
              src={post.imageURL}
              alt="Post attachment"
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </div>
        )}

        {/* Bottom row: evenly distributed across full width */}
        <div className="flex items-center justify-between">

          {/* Left cluster: votes + comments */}
          <div className="flex items-center gap-3">
            {/* Vote controls */}
            <div
              className="flex items-center gap-0.5"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => votePost(post.id, 'up')}
                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <span
                className={`text-sm font-bold tabular-nums min-w-[28px] text-center ${
                  post.votes > 0 ? 'text-rose-500' : 'text-slate-400'
                }`}
              >
                {post.votes > 0 ? `+${post.votes}` : post.votes}
              </span>
              <button
                onClick={() => votePost(post.id, 'down')}
                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Comments */}
            <div className="flex items-center gap-1.5 text-slate-500">
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm font-medium">{commentCounts?.[post.id] ?? 0}</span>
            </div>
          </div>

          {/* Right cluster: Share + mod/owner actions */}
          <div
            className="relative flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsShareMenuOpen((o) => !o)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-500 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all text-sm font-medium"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>

            {isShareMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-36 bg-white border border-slate-200 rounded-xl shadow-lg z-20 p-1.5">
                <button className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">
                  Copy link
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">
                  Embed
                </button>
              </div>
            )}

            {canDelete && (
              <button
                onClick={handleDelete}
                onBlur={() => setConfirmDelete(false)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all text-sm font-medium ${
                  confirmDelete
                    ? 'bg-rose-600 text-white'
                    : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                }`}
                title={confirmDelete ? 'Click again to confirm delete' : 'Delete post'}
              >
                <Trash2 className="w-4 h-4" />
                {confirmDelete ? 'Confirm?' : ''}
              </button>
            )}

            {isMod && !isOwner && (
              <button
                onClick={handleBan}
                onBlur={() => setConfirmBan(false)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all text-sm font-medium ${
                  confirmBan ? 'bg-red-700 text-white' : 'text-slate-400 hover:text-red-700 hover:bg-red-50'
                }`}
                title={confirmBan ? 'Click again to ban this user' : 'Ban user'}
              >
                <UserX className="w-4 h-4" />
                {confirmBan ? 'Ban?' : ''}
              </button>
            )}

            {isMod && (
              <button
                onClick={handlePin}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all text-sm font-medium text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                title={post.isPinned ? 'Unpin post' : 'Pin post'}
              >
                {post.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
              </button>
            )}
          </div>

        </div>
      </div>
    </article>
  );
}
