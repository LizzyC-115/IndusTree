import { useState, useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown, MessageSquare, Clock, Send, ArrowLeft, Bookmark, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import UserActionMenu from './UserActionMenu';
import { subscribeToComments } from '../firebase/comments';

export default function PostDetail() {
  const { selectedPost, setSelectedPost, votePost, addComment, currentUser, savedPostIds, toggleSave, deletePost, deleteComment } = useApp();
  const [confirmDeletePost, setConfirmDeletePost] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [firestoreComments, setFirestoreComments] = useState(null); // null = loading
  const bottomRef = useRef(null);

  // Subscribe to real-time comments whenever a post is opened
  useEffect(() => {
    if (!selectedPost) return;
    setFirestoreComments(null); // reset to loading state
    const unsubscribe = subscribeToComments(selectedPost.id, (comments) => {
      // Drop optimistic placeholders once real data arrives from Firestore
      setFirestoreComments((prev) => {
        const hasOptimistic = prev?.some((c) => c.id?.startsWith('optimistic-'));
        if (!hasOptimistic) return comments;
        // Keep optimistic entries whose content isn't yet in the real list
        const realContents = new Set(comments.map((c) => c.content));
        const pendingOptimistic = prev.filter(
          (c) => c.id?.startsWith('optimistic-') && !realContents.has(c.content),
        );
        return [...comments, ...pendingOptimistic];
      });
    });
    return unsubscribe;
  }, [selectedPost?.id]);

  // Scroll to bottom when new comments arrive
  useEffect(() => {
    if (firestoreComments?.length) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [firestoreComments?.length]);

  if (!selectedPost) return null;

  const displayName = currentUser?.username || 'You';
  const displayAvatar = currentUser?.username?.[0]?.toUpperCase() || 'U';

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const text = newComment.trim();
    setNewComment('');

    // Optimistic local update — shows instantly before Firebase confirms
    const optimistic = {
      id: `optimistic-${Date.now()}`,
      author: displayName,
      avatar: displayAvatar,
      content: text,
      timeAgo: 'Just now',
      votes: 0,
      createdAt: new Date().toISOString(),
    };
    setFirestoreComments((prev) => [...(prev ?? []), optimistic]);

    // Persist to Firebase; onSnapshot will replace optimistic entry with real doc
    await addComment(selectedPost.id, {
      content: text,
      author: displayName,
      avatar: displayAvatar,
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      finance: 'bg-emerald-100 text-emerald-700',
      consulting: 'bg-violet-100 text-violet-700',
      pm: 'bg-indigo-100 text-indigo-700',
      'swe-tech': 'bg-sky-100 text-sky-700',
      quant: 'bg-teal-100 text-teal-700',
      engineering: 'bg-orange-100 text-orange-700',
      medicine: 'bg-rose-100 text-rose-700',
      academia: 'bg-amber-100 text-amber-700',
      all: 'bg-slate-100 text-slate-700',
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
    };
    return names[category] || 'General';
  };

  const postUser = {
    id: selectedPost.author.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    name: selectedPost.author,
    avatar: selectedPost.avatar,
    bio: `${getCategoryName(selectedPost.category)} recruiting`,
    yearsOnPlatform: 2,
    karma: Math.max(120, selectedPost.votes + 150),
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={() => setSelectedPost(null)}
      />
      
      {/* Panel */}
      <div
        className="relative ml-auto w-full max-w-3xl bg-white shadow-2xl"
        style={{
          maxWidth: '100%',
          overflowY: 'auto',
          overflowX: 'hidden',
          boxSizing: 'border-box',
          minWidth: 0,
        }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 z-10 flex items-center justify-between" style={{ padding: '20px 24px', minWidth: 0, overflow: 'hidden' }}>
          <button
            onClick={() => setSelectedPost(null)}
            className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-semibold">Back to discussions</span>
          </button>

          {/* Delete post — only visible to the author */}
          {currentUser?.uid && selectedPost.authorId === currentUser.uid && (
            <button
              onClick={async () => {
                if (!confirmDeletePost) { setConfirmDeletePost(true); return; }
                await deletePost(selectedPost.id);
                setSelectedPost(null);
              }}
              onBlur={() => setConfirmDeletePost(false)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                confirmDeletePost
                  ? 'bg-rose-600 text-white'
                  : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              {confirmDeletePost ? 'Confirm delete?' : 'Delete post'}
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-8" style={{ padding: '24px', minWidth: 0, overflow: 'hidden', boxSizing: 'border-box' }}>
          {/* Post Header */}
          <div className="flex gap-5 mb-8" style={{ minWidth: 0, overflow: 'hidden' }}>
            {/* Vote + Save column */}
            <div className="flex flex-col items-center gap-1 flex-shrink-0" style={{ minWidth: 0, overflow: 'hidden' }}>
              <button
                onClick={() => votePost(selectedPost.id, 'up')}
                className={`p-2 rounded-xl transition-all ${
                  selectedPost.userVote === 1
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
                }`}
              >
                <ChevronUp className="w-6 h-6" />
              </button>
              <span className={`text-lg font-bold ${
                selectedPost.votes > 0 ? 'text-indigo-600' : selectedPost.votes < 0 ? 'text-rose-500' : 'text-slate-400'
              }`}>
                {selectedPost.votes > 0 ? `+${selectedPost.votes}` : selectedPost.votes}
              </span>
              <button
                onClick={() => votePost(selectedPost.id, 'down')}
                className={`p-2 rounded-xl transition-all ${
                  selectedPost.userVote === -1
                    ? 'text-rose-500 bg-rose-50'
                    : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50'
                }`}
              >
                <ChevronDown className="w-6 h-6" />
              </button>

              {/* Save button — spaced below votes */}
              <div style={{ height: '10px' }} />
              <button
                onClick={() => toggleSave(selectedPost)}
                title={savedPostIds?.has(String(selectedPost.id)) ? 'Unsave post' : 'Save post'}
                className={`p-2 rounded-xl transition-all ${
                  savedPostIds?.has(String(selectedPost.id))
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
                }`}
              >
                <Bookmark
                  className="w-5 h-5"
                  fill={savedPostIds?.has(String(selectedPost.id)) ? 'currentColor' : 'none'}
                />
              </button>
            </div>

            {/* Post Info */}
            <div className="flex-1" style={{ minWidth: 0, overflow: 'hidden' }}>
              <span className={`inline-block px-3 py-1.5 text-xs font-bold rounded-lg mb-4 ${getCategoryColor(selectedPost.category)}`}>
                {getCategoryName(selectedPost.category)}
              </span>
              
              <h1
                className="text-2xl font-bold text-slate-800 mb-5"
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  minWidth: 0,
                }}
              >
                {selectedPost.title}
              </h1>

              <div className="flex items-center gap-4 mb-6" style={{ minWidth: 0, overflow: 'hidden' }}>
                <UserActionMenu user={postUser}>
                  <div className="flex items-center gap-3 hover:bg-slate-50 rounded-xl px-2 py-1.5 transition-colors" style={{ minWidth: 0, overflow: 'hidden' }}>
                    {selectedPost.authorPhotoURL ? (
                      <img src={selectedPost.authorPhotoURL} alt={selectedPost.author} className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-2 ring-slate-100" />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {selectedPost.avatar}
                      </div>
                    )}
                    <span
                      className="font-semibold text-slate-800"
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
                      {selectedPost.author}
                    </span>
                  </div>
                </UserActionMenu>
                <div className="flex items-center gap-1.5 text-slate-400" style={{ minWidth: 0, overflow: 'hidden' }}>
                  <Clock className="w-4 h-4" />
                  <span
                    className="text-sm font-medium"
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
                    {selectedPost.timeAgo}
                  </span>
                </div>
              </div>

              <div className="prose prose-slate max-w-none" style={{ minWidth: 0, overflow: 'hidden' }}>
                <p
                  className="text-slate-600 leading-relaxed whitespace-pre-wrap text-base"
                  style={{ wordBreak: 'break-word', overflowWrap: 'break-word', minWidth: 0 }}
                >
                  {selectedPost.content}
                </p>
              </div>

              {/* Post image */}
              {selectedPost.imageURL && (
                <div style={{ marginTop: '20px', borderRadius: '12px', overflow: 'hidden', display: 'inline-block', maxWidth: '100%' }}>
                  <img
                    src={selectedPost.imageURL}
                    alt="Post attachment"
                    style={{ maxWidth: '100%', maxHeight: '320px', width: 'auto', height: 'auto', display: 'block', borderRadius: '12px' }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-100" style={{ marginTop: '36px', marginBottom: '36px' }} />

          {/* Comments Section */}
          <div>
            <h2
              className="flex items-center gap-2 text-lg font-bold text-slate-800 mb-6"
              style={{ minWidth: 0, overflow: 'hidden', wordBreak: 'break-word', overflowWrap: 'break-word' }}
            >
              <MessageSquare className="w-5 h-5 text-indigo-500" />
              <span
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
                Comments ({firestoreComments === null ? '…' : firestoreComments.length})
              </span>
            </h2>

            {/* Comment Form */}
            <form onSubmit={handleSubmitComment} className="mb-10">
              <div className="flex gap-4" style={{ minWidth: 0 }}>
                {currentUser?.photoURL ? (
                  <img src={currentUser.photoURL} alt={displayName} className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-2 ring-slate-100" />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                    {displayAvatar}
                  </div>
                )}
                <div className="flex-1" style={{ minWidth: 0 }}>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your thoughts..."
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none placeholder:text-slate-400"
                    style={{ minWidth: 0, boxSizing: 'border-box', display: 'block' }}
                  />
                  <div className="flex justify-end mt-3" style={{ minWidth: 0, overflow: 'hidden' }}>
                    <button
                      type="submit"
                      disabled={!newComment.trim()}
                      className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold rounded-xl hover:from-indigo-700 hover:to-violet-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ padding: '10px 24px', minWidth: 0, overflow: 'hidden' }}
                    >
                      <Send className="w-4 h-4" />
                      <span
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
                        Comment
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </form>

            {/* Comments List */}
            <div className="space-y-6" style={{ minWidth: 0, overflow: 'hidden' }}>
              {firestoreComments === null ? (
                <div className="text-center py-8 text-slate-400 text-sm" style={{ wordBreak: 'break-word', overflowWrap: 'break-word', minWidth: 0 }}>
                  Loading comments…
                </div>
              ) : firestoreComments.length > 0 ? (
                firestoreComments.map((comment) => (
                  <div key={comment.id} className="flex gap-4 p-4 bg-slate-50 rounded-2xl" style={{ minWidth: 0, overflow: 'hidden' }}>
                    {comment.photoURL ? (
                      <img src={comment.photoURL} alt={comment.author} className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-2 ring-slate-100" />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-slate-400 to-slate-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                        {comment.avatar}
                      </div>
                    )}
                    <div className="flex-1" style={{ minWidth: 0, overflow: 'hidden' }}>
                      <div className="flex items-center gap-2 mb-2" style={{ minWidth: 0, overflow: 'hidden' }}>
                        <UserActionMenu
                          user={{
                            id: comment.author.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
                            name: comment.author,
                            avatar: comment.avatar,
                            bio: 'Student contributor',
                            yearsOnPlatform: 1,
                            karma: 120,
                          }}
                        >
                          <span
                            className="font-semibold text-slate-800 hover:text-indigo-600 transition-colors"
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
                            {comment.author}
                          </span>
                        </UserActionMenu>
                        <span
                          className="text-xs text-slate-400 font-medium"
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
                          {comment.timeAgo}
                        </span>
                      </div>
                      <p className="text-slate-600 text-sm leading-relaxed" style={{ wordBreak: 'break-word', overflowWrap: 'break-word', minWidth: 0 }}>
                        {comment.content}
                      </p>
                      <div className="flex items-center gap-4 mt-3" style={{ minWidth: 0, overflow: 'hidden' }}>
                        <button className="flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-600 transition-all font-medium">
                          <ChevronUp className="w-4 h-4" />
                          {comment.votes || 0}
                        </button>
                        <button className="text-xs text-slate-400 hover:text-indigo-600 transition-all font-medium">
                          Reply
                        </button>
                        {currentUser?.uid === comment.authorUid || currentUser?.username === comment.author ? (
                          <DeleteCommentButton
                            onDelete={() => deleteComment(selectedPost.id, comment.id)}
                          />
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))
              ) : null}
              <div ref={bottomRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeleteCommentButton({ onDelete }) {
  const [confirm, setConfirm] = useState(false);
  return (
    <button
      onClick={() => { if (!confirm) { setConfirm(true); return; } onDelete(); }}
      onBlur={() => setConfirm(false)}
      className={`flex items-center gap-1 text-xs font-medium transition-all rounded px-1.5 py-0.5 ${
        confirm ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-rose-600'
      }`}
    >
      <Trash2 className="w-3 h-3" />
      {confirm ? 'Confirm?' : 'Delete'}
    </button>
  );
}
