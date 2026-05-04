import { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronUp, ChevronDown, MessageSquare, Clock, Send, ArrowLeft, MoreHorizontal } from 'lucide-react';
import { useApp } from '../context/AppContext';

const COMMENT_USERNAME = 'You';
const COMMENT_INITIALS = 'U';

function storageKey(postId) {
  return `industree-post-comments-${postId}`;
}

function normalizeReply(r) {
  return {
    ...r,
    deleted: !!r.deleted,
    saved: !!r.saved,
    editedAt: r.editedAt ?? null,
    replies: Array.isArray(r.replies) ? r.replies.map(normalizeReply) : [],
  };
}

function normalizeComment(c) {
  return {
    ...c,
    deleted: !!c.deleted,
    saved: !!c.saved,
    editedAt: c.editedAt ?? null,
    replies: Array.isArray(c.replies) ? c.replies.map(normalizeReply) : [],
  };
}

function loadCommentsFromStorage(postId) {
  try {
    const raw = localStorage.getItem(storageKey(postId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeComment) : [];
  } catch {
    return [];
  }
}

function saveCommentsToStorage(postId, list) {
  try {
    localStorage.setItem(storageKey(postId), JSON.stringify(list));
  } catch {
    /* ignore quota / private mode */
  }
}

function formatCommentTime(createdAt) {
  const d = typeof createdAt === 'number' ? createdAt : Date.now();
  const sec = Math.floor((Date.now() - d) / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return day === 1 ? '1 day ago' : `${day} days ago`;
}

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function editingKeyFor(node) {
  return `n|${node.id}`;
}

function countDescendantReplies(node) {
  const ch = node.replies || [];
  return ch.reduce((sum, r) => sum + 1 + countDescendantReplies(r), 0);
}

function tryAddReply(nodes, parentId, entry) {
  const i = nodes.findIndex((n) => String(n.id) === String(parentId));
  if (i !== -1) {
    const n = nodes[i];
    const updated = {
      ...n,
      replies: [...(n.replies || []), { ...entry, replies: [] }],
    };
    return { tree: nodes.map((x, j) => (j === i ? updated : x)), found: true };
  }
  let found = false;
  const tree = nodes.map((n) => {
    if (!(n.replies || []).length) return n;
    const sub = tryAddReply(n.replies, parentId, entry);
    if (sub.found) {
      found = true;
      return { ...n, replies: sub.tree };
    }
    return n;
  });
  return { tree: found ? tree : nodes, found };
}

function addReplyDeep(nodes, parentId, entry) {
  return tryAddReply(nodes, parentId, entry).tree;
}

function updateNodeById(nodes, id, fn) {
  return nodes.map((n) => {
    if (String(n.id) === String(id)) return fn(n);
    return { ...n, replies: updateNodeById(n.replies || [], id, fn) };
  });
}

function toggleVoteById(nodes, id) {
  return updateNodeById(nodes, id, (n) => {
    const next = !n.userUpvoted;
    return { ...n, userUpvoted: next, votes: (n.votes || 0) + (next ? 1 : -1) };
  });
}

function updateContentById(nodes, id, content) {
  return updateNodeById(nodes, id, (n) => ({ ...n, content, editedAt: Date.now() }));
}

function toggleSavedById(nodes, id) {
  return updateNodeById(nodes, id, (n) => ({ ...n, saved: !n.saved }));
}

function removeFromRepliesList(replies, targetId) {
  const out = [];
  for (const r of replies) {
    if (String(r.id) === String(targetId)) {
      if ((r.replies || []).length > 0) {
        out.push({ ...r, deleted: true, content: '[deleted]' });
      }
      continue;
    }
    out.push({ ...r, replies: removeFromRepliesList(r.replies || [], targetId) });
  }
  return out;
}

function deleteTopLevelComment(nodes, targetId) {
  return nodes.flatMap((c) => {
    if (String(c.id) === String(targetId)) {
      if ((c.replies || []).length > 0) {
        return [{ ...c, deleted: true, content: '[deleted]' }];
      }
      return [];
    }
    return [{ ...c, replies: removeFromRepliesList(c.replies || [], targetId) }];
  });
}

function deleteNestedAnywhere(nodes, targetId) {
  return nodes.map((c) => ({
    ...c,
    replies: removeFromRepliesList(c.replies || [], targetId),
  }));
}

function sortRepliesDeep(replies, mode) {
  const list = [...(replies || [])];
  if (mode === 'best') {
    list.sort((a, b) => b.votes - a.votes || b.createdAt - a.createdAt);
  } else {
    list.sort((a, b) => b.createdAt - a.createdAt);
  }
  return list.map((r) => ({
    ...r,
    replies: sortRepliesDeep(r.replies, mode),
  }));
}

function sortCommentList(list, mode) {
  const copy = list.map((c) => ({
    ...c,
    replies: sortRepliesDeep(c.replies || [], mode),
  }));

  if (mode === 'best') {
    copy.sort((a, b) => b.votes - a.votes || b.createdAt - a.createdAt);
  } else {
    copy.sort((a, b) => b.createdAt - a.createdAt);
  }
  return copy;
}

function renderCommentThread({
  node,
  depth,
  parentAuthor,
  commentSort,
  replyingToId,
  replyText,
  setReplyText,
  setReplyingToId,
  onSubmitReply,
  onToggleUpvote,
  openMenuId,
  setOpenMenuId,
  editingKey,
  setEditingKey,
  editDraft,
  setEditDraft,
  onSaveEdit,
  onCancelEdit,
  onDeleteNode,
  onToggleSaved,
  collapsedMap,
  toggleCollapsed,
}) {
  const isReply = depth > 0;
  const canReply = depth < 2 && !node.deleted;
  const repliesSorted = sortRepliesDeep(node.replies || [], commentSort);
  const hasReplies = repliesSorted.length > 0;
  const descCount = countDescendantReplies(node);
  const isDeleted = !!node.deleted;
  const eKey = editingKeyFor(node);
  const isEditing = editingKey === eKey && !isDeleted;
  const idStr = String(node.id);
  const menuOpen = openMenuId != null && String(openMenuId) === idStr;
  const collapsed = !!collapsedMap[idStr];

  const cardInner = (
    <>
      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
        {node.avatar}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0">
            <span className={`font-semibold ${isDeleted ? 'text-slate-500' : 'text-slate-800'}`}>{node.author}</span>
            <time
              className={`text-xs font-medium ${isDeleted ? 'text-slate-400' : 'text-slate-400'}`}
              dateTime={new Date(node.createdAt).toISOString()}
            >
              {formatCommentTime(node.createdAt)}
            </time>
            {node.editedAt != null && (
              <span className="text-xs text-slate-400 italic">· edited</span>
            )}
          </div>
          {!isDeleted && (
            <div className="relative shrink-0" data-comment-menu={idStr}>
              <button
                type="button"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                aria-label="Comment options"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuId((prev) => (String(prev) === idStr ? null : idStr));
                }}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/70 transition-colors -mt-0.5"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-0.5 min-w-[9.5rem] py-1 bg-white border border-slate-200 rounded-lg shadow-lg z-30 text-xs text-slate-700"
                >
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 font-medium"
                    onClick={() => {
                      setOpenMenuId(null);
                      setEditingKey(eKey);
                      setEditDraft(node.content || '');
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 font-medium text-rose-600"
                    onClick={() => onDeleteNode(node, depth === 0)}
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 font-medium"
                    onClick={() => onToggleSaved(node)}
                  >
                    {node.saved ? 'Unsave' : 'Save Post'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {isReply && parentAuthor != null && (
          <p className="text-[11px] text-slate-500 mb-1.5">
            Replying to{' '}
            <span className="font-medium text-indigo-600">@{parentAuthor}</span>
          </p>
        )}

        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editDraft}
              onChange={(e) => setEditDraft(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onCancelEdit}
                className="px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!editDraft.trim()}
                onClick={onSaveEdit}
                className="px-3 py-1 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-semibold rounded-lg hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <p
            className={`text-sm leading-relaxed whitespace-pre-wrap ${
              isDeleted ? 'text-slate-400 italic' : 'text-slate-600'
            }`}
          >
            {isDeleted ? '[deleted]' : node.content}
          </p>
        )}

        {!isEditing && (
          <div className="flex items-center gap-4 mt-3">
            <button
              type="button"
              onClick={() => onToggleUpvote(node.id)}
              className={`flex items-center gap-1 text-xs font-medium transition-all rounded-lg px-1.5 py-0.5 -ml-1.5 ${
                node.userUpvoted
                  ? 'text-indigo-600 bg-indigo-50'
                  : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/60'
              }`}
            >
              <ChevronUp className="w-4 h-4" />
              {node.votes}
            </button>
            {canReply && !isDeleted && (
              <button
                type="button"
                onClick={() => {
                  setReplyingToId((prev) => (prev === node.id ? null : node.id));
                  setReplyText('');
                }}
                className="text-xs text-slate-400 hover:text-indigo-600 transition-all font-medium"
              >
                Reply
              </button>
            )}
          </div>
        )}

        {canReply && !isDeleted && replyingToId === node.id && (
          <form
            className="mt-4 flex gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              onSubmitReply(node.id);
            }}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {COMMENT_INITIALS}
            </div>
            <div className="flex-1 space-y-2">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                rows={2}
                className="w-full px-3 py-2 bg-slate-50 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none placeholder:text-slate-400"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setReplyingToId(null);
                    setReplyText('');
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!replyText.trim()}
                  className="px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-semibold rounded-lg hover:from-indigo-700 hover:to-violet-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reply
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </>
  );

  const cardRow = (
    <div
      className={`flex gap-3 items-stretch ${depth > 0 ? 'pl-1' : ''} ${isReply ? 'mt-3' : ''}`}
    >
      {hasReplies ? (
        <button
          type="button"
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Expand replies' : 'Collapse replies'}
          onClick={(e) => {
            e.stopPropagation();
            toggleCollapsed(idStr);
          }}
          className="group w-6 shrink-0 self-stretch min-h-[2.75rem] flex flex-col rounded-l-md border-l-2 border-indigo-200/80 bg-indigo-50/20 hover:bg-indigo-100/40 transition-colors cursor-pointer"
        >
          <span className="flex-1 flex items-start justify-center pt-2 text-[11px] font-semibold text-indigo-500 leading-none select-none">
            −
          </span>
        </button>
      ) : (
        <div
          className={`w-6 shrink-0 self-stretch min-h-[2.75rem] ${depth > 0 ? 'border-l-2 border-indigo-100/90 rounded-l-md' : ''}`}
          aria-hidden
        />
      )}
      <div
        className={`flex flex-1 gap-3 min-w-0 p-4 rounded-2xl ${
          isReply ? 'bg-white border border-slate-100' : 'bg-slate-50'
        } ${isDeleted ? 'opacity-80' : ''}`}
      >
        {cardInner}
      </div>
    </div>
  );

  return (
    <div key={node.id}>
      {cardRow}

      {hasReplies && collapsed && (
        <button
          type="button"
          onClick={() => toggleCollapsed(idStr)}
          className="mt-2 pl-8 text-left text-xs font-medium text-indigo-600 hover:text-indigo-700"
        >
          ▶ {descCount} {descCount === 1 ? 'reply' : 'replies'}
        </button>
      )}

      {hasReplies && !collapsed && (
        <div className="mt-3 flex gap-2 items-stretch">
          <div className="w-6 shrink-0 self-stretch border-l-2 border-indigo-100 rounded-l-md opacity-90" aria-hidden />
          <div className="flex-1 min-w-0 space-y-1">
            {repliesSorted.map((reply) =>
              renderCommentThread({
                node: reply,
                depth: depth + 1,
                parentAuthor: node.author,
                commentSort,
                replyingToId,
                replyText,
                setReplyText,
                setReplyingToId,
                onSubmitReply,
                onToggleUpvote,
                openMenuId,
                setOpenMenuId,
                editingKey,
                setEditingKey,
                editDraft,
                setEditDraft,
                onSaveEdit,
                onCancelEdit,
                onDeleteNode,
                onToggleSaved,
                collapsedMap,
                toggleCollapsed,
              }),
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PostDetail() {
  const { selectedPost, setSelectedPost, votePost } = useApp();
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState([]);
  const [commentSort, setCommentSort] = useState('best');
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingKey, setEditingKey] = useState(null);
  const [editDraft, setEditDraft] = useState('');
  const [tick, setTick] = useState(0);
  const [collapsedMap, setCollapsedMap] = useState({});
  const skipSaveAfterHydrate = useRef(false);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!selectedPost) return;
    const postId = selectedPost.id;
    skipSaveAfterHydrate.current = true;
    setComments(loadCommentsFromStorage(postId));
    setReplyingToId(null);
    setReplyText('');
    setNewComment('');
    setOpenMenuId(null);
    setEditingKey(null);
    setEditDraft('');
    setCollapsedMap({});
    // Intentionally only reset when switching posts (id), not when other post fields change.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- selectedPost.id
  }, [selectedPost?.id]);

  useEffect(() => {
    if (openMenuId == null) return;
    const onMouseDown = (e) => {
      const root = document.querySelector(`[data-comment-menu="${String(openMenuId)}"]`);
      if (root && !root.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [openMenuId]);

  useEffect(() => {
    if (!selectedPost) return;
    const postId = selectedPost.id;
    if (skipSaveAfterHydrate.current) {
      skipSaveAfterHydrate.current = false;
      return;
    }
    saveCommentsToStorage(postId, comments);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- selectedPost.id
  }, [comments, selectedPost?.id]);

  const sortedTopLevel = useMemo(() => {
    void tick;
    return sortCommentList(comments, commentSort);
  }, [comments, commentSort, tick]);

  const toggleCollapsed = (idStr) => {
    setCollapsedMap((m) => ({ ...m, [idStr]: !m[idStr] }));
  };

  if (!selectedPost) return null;

  const handleSubmitComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const entry = {
      id: newId(),
      author: COMMENT_USERNAME,
      avatar: COMMENT_INITIALS,
      content: newComment.trim(),
      createdAt: Date.now(),
      votes: 0,
      userUpvoted: false,
      replies: [],
      deleted: false,
      saved: false,
      editedAt: null,
    };

    setComments((prev) => [...prev, entry]);
    setNewComment('');
  };

  const handleSubmitReply = (parentId) => {
    if (!replyText.trim()) return;

    const entry = {
      id: newId(),
      author: COMMENT_USERNAME,
      avatar: COMMENT_INITIALS,
      content: replyText.trim(),
      createdAt: Date.now(),
      votes: 0,
      userUpvoted: false,
      deleted: false,
      saved: false,
      editedAt: null,
    };

    setComments((prev) => addReplyDeep(prev, parentId, entry));
    setReplyText('');
    setReplyingToId(null);
  };

  const handleToggleUpvote = (id) => {
    setComments((prev) => toggleVoteById(prev, id));
  };

  const handleCancelEdit = () => {
    setEditingKey(null);
    setEditDraft('');
  };

  const handleSaveEdit = () => {
    if (!editDraft.trim() || !editingKey) return;
    const trimmed = editDraft.trim();
    const parts = editingKey.split('|');
    if (parts[0] !== 'n') return;
    const id = parts.slice(1).join('|');
    setComments((prev) => updateContentById(prev, id, trimmed));
    setEditingKey(null);
    setEditDraft('');
  };

  const handleDeleteNode = (node, isTopLevel) => {
    setOpenMenuId(null);
    setEditingKey(null);
    setEditDraft('');
    if (isTopLevel) {
      setComments((prev) => deleteTopLevelComment(prev, node.id));
    } else {
      setComments((prev) => deleteNestedAnywhere(prev, node.id));
    }
  };

  const handleToggleSavedNode = (node) => {
    setOpenMenuId(null);
    setComments((prev) => toggleSavedById(prev, node.id));
  };

  const getCategoryColor = (category) => {
    const colors = {
      tech: 'bg-sky-100 text-sky-700',
      career: 'bg-violet-100 text-violet-700',
      finance: 'bg-emerald-100 text-emerald-700',
      education: 'bg-amber-100 text-amber-700',
      lifestyle: 'bg-rose-100 text-rose-700',
      all: 'bg-slate-100 text-slate-700',
    };
    return colors[category] || colors.all;
  };

  const getCategoryName = (category) => {
    const names = {
      tech: 'Technology',
      career: 'Career',
      finance: 'Finance',
      education: 'Education',
      lifestyle: 'Lifestyle',
      all: 'General',
    };
    return names[category] || 'General';
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={() => setSelectedPost(null)}
      />

      {/* Panel */}
      <div className="relative ml-auto w-full max-w-3xl bg-white shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white/90 backdrop-blur-lg border-b border-slate-100 p-5 z-10">
          <button
            onClick={() => setSelectedPost(null)}
            className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-semibold">Back to discussions</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Post Header */}
          <div className="flex gap-5 mb-8">
            {/* Vote */}
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => votePost(selectedPost.id, 'up')}
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
              >
                <ChevronUp className="w-6 h-6" />
              </button>
              <span
                className={`text-lg font-bold ${
                  selectedPost.votes > 0
                    ? 'text-indigo-600'
                    : selectedPost.votes < 0
                      ? 'text-rose-500'
                      : 'text-slate-400'
                }`}
              >
                {selectedPost.votes > 0 ? `+${selectedPost.votes}` : selectedPost.votes}
              </span>
              <button
                onClick={() => votePost(selectedPost.id, 'down')}
                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
              >
                <ChevronDown className="w-6 h-6" />
              </button>
            </div>

            {/* Post Info */}
            <div className="flex-1">
              <span
                className={`inline-block px-3 py-1.5 text-xs font-bold rounded-lg mb-4 ${getCategoryColor(selectedPost.category)}`}
              >
                {getCategoryName(selectedPost.category)}
              </span>

              <h1 className="text-2xl font-bold text-slate-800 mb-5">{selectedPost.title}</h1>

              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center text-white text-sm font-bold">
                    {selectedPost.avatar}
                  </div>
                  <span className="font-semibold text-slate-800">{selectedPost.author}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">{selectedPost.timeAgo}</span>
                </div>
              </div>

              <div className="prose prose-slate max-w-none">
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-base">
                  {selectedPost.content}
                </p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-100 my-10" />

          {/* Comments Section */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
                <MessageSquare className="w-5 h-5 text-indigo-500" />
                Comments ({comments.length})
              </h2>
              <div className="flex items-center rounded-xl bg-slate-100 p-1 text-sm font-semibold w-fit">
                <button
                  type="button"
                  onClick={() => setCommentSort('best')}
                  className={`px-4 py-1.5 rounded-lg transition-all ${
                    commentSort === 'best'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Best
                </button>
                <span className="text-slate-300 select-none">|</span>
                <button
                  type="button"
                  onClick={() => setCommentSort('new')}
                  className={`px-4 py-1.5 rounded-lg transition-all ${
                    commentSort === 'new'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  New
                </button>
              </div>
            </div>

            {/* Comment Form */}
            <form onSubmit={handleSubmitComment} className="mb-10">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0">
                  {COMMENT_INITIALS}
                </div>
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your thoughts..."
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none placeholder:text-slate-400"
                  />
                  <div className="flex justify-end mt-3">
                    <button
                      type="submit"
                      disabled={!newComment.trim()}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold rounded-xl hover:from-indigo-700 hover:to-violet-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25"
                    >
                      <Send className="w-4 h-4" />
                      Comment
                    </button>
                  </div>
                </div>
              </div>
            </form>

            {/* Comments List */}
            <div className="space-y-6">
              {comments.length > 0 ? (
                sortedTopLevel.map((comment) =>
                  renderCommentThread({
                    node: comment,
                    depth: 0,
                    parentAuthor: undefined,
                    commentSort,
                    replyingToId,
                    replyText,
                    setReplyText,
                    setReplyingToId,
                    onSubmitReply: handleSubmitReply,
                    onToggleUpvote: handleToggleUpvote,
                    openMenuId,
                    setOpenMenuId,
                    editingKey,
                    setEditingKey,
                    editDraft,
                    setEditDraft,
                    onSaveEdit: handleSaveEdit,
                    onCancelEdit: handleCancelEdit,
                    onDeleteNode: handleDeleteNode,
                    onToggleSaved: handleToggleSavedNode,
                    collapsedMap,
                    toggleCollapsed,
                  }),
                )
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-medium">No comments yet. Be the first to share your thoughts!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
