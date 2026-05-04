import { createContext, useContext, useState } from 'react';
import { initialPosts, initialDmThreads } from '../data/mockData';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [posts, setPosts] = useState(initialPosts);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [dateSortOrder, setDateSortOrder] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [dmThreads, setDmThreads] = useState(initialDmThreads);
  const [isDmOpen, setIsDmOpen] = useState(false);
  const [activeDmThreadId, setActiveDmThreadId] = useState(initialDmThreads[0]?.id || null);
  const [selectedProfileUser, setSelectedProfileUser] = useState(null);

  const getPostedTimestamp = (post) => {
    if (typeof post.createdAt === 'number') return post.createdAt;
    if (typeof post.createdAt === 'string') {
      const parsedTime = Date.parse(post.createdAt);
      if (!Number.isNaN(parsedTime)) return parsedTime;
    }
    return 0;
  };

  const addPost = (newPost) => {
    const post = {
      id: Date.now(),
      ...newPost,
      votes: 0,
      userVote: 0,
      commentCount: 0,
      newComments: 0,
      timeAgo: 'Just now',
      createdAt: Date.now(),
      isPinned: false,
      isTrending: false,
      comments: [],
    };
    setPosts((prevPosts) => [post, ...prevPosts]);
  };

  const votePost = (postId, direction) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id !== postId) return post;

        const currentVote = post.userVote || 0;
        const nextVote = direction === 'up' ? 1 : -1;

        // Clicking the same vote again removes the vote (returns to neutral).
        const finalVote = currentVote === nextVote ? 0 : nextVote;
        const voteDelta = finalVote - currentVote;

        return {
          ...post,
          votes: post.votes + voteDelta,
          userVote: finalVote,
        };
      })
    );
  };

  const formatUserId = (name = '') => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const openProfile = (user) => {
    setSelectedProfileUser({
      id: user.id || formatUserId(user.name),
      name: user.name,
      avatar: user.avatar || user.name?.[0] || '?',
      bio: user.bio || 'Student contributor',
      yearsOnPlatform: user.yearsOnPlatform || 1,
      karma: user.karma || 100,
    });
  };

  const closeProfile = () => setSelectedProfileUser(null);

  const openDmWithUser = (user) => {
    const normalizedUser = {
      id: user.id || formatUserId(user.name),
      name: user.name,
      avatar: user.avatar || user.name?.[0] || '?',
      bio: user.bio || 'Student contributor',
      yearsOnPlatform: user.yearsOnPlatform || 1,
      karma: user.karma || 100,
    };

    let targetThreadId = null;

    setDmThreads((prevThreads) => {
      const existingThread = prevThreads.find(
        (thread) => thread.participant.id === normalizedUser.id
      );

      if (existingThread) {
        targetThreadId = existingThread.id;
        return prevThreads;
      }

      const newThread = {
        id: `thread-${Date.now()}`,
        participant: normalizedUser,
        messages: [],
        updatedAt: new Date().toISOString(),
      };

      targetThreadId = newThread.id;
      return [newThread, ...prevThreads];
    });

    setActiveDmThreadId(targetThreadId);
    setIsDmOpen(true);
  };

  const openDmInbox = () => {
    if (!activeDmThreadId && dmThreads.length > 0) {
      setActiveDmThreadId(dmThreads[0].id);
    }
    setIsDmOpen(true);
  };

  const closeDm = () => setIsDmOpen(false);

  const setActiveDmThread = (threadId) => {
    setActiveDmThreadId(threadId);
  };

  const sendDmMessage = (threadId, text) => {
    const trimmedText = text.trim();
    if (!trimmedText) return;

    setDmThreads((prevThreads) =>
      prevThreads.map((thread) => {
        if (thread.id !== threadId) return thread;

        const newMessage = {
          id: `m-${Date.now()}`,
          sender: 'You',
          text: trimmedText,
          createdAt: new Date().toISOString(),
        };

        return {
          ...thread,
          messages: [...thread.messages, newMessage],
          updatedAt: newMessage.createdAt,
        };
      })
    );
  };

  const addComment = (postId, comment) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id !== postId) return post;

        const newComment = {
          id: Date.now(),
          ...comment,
          timeAgo: 'Just now',
          createdAt: Date.now(),
          votes: 0,
          replies: [],
        };
        return {
          ...post,
          comments: [...(post.comments || []), newComment],
          commentCount: post.commentCount + 1,
        };
      })
    );
  };

  const filteredPosts = posts
    .filter(post => {
      const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
      const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      const newestFirstDateDiff = getPostedTimestamp(b) - getPostedTimestamp(a);
      const dateComparison = dateSortOrder === 'newest'
        ? newestFirstDateDiff
        : -newestFirstDateDiff;

      switch (sortBy) {
        case 'recent':
          return dateComparison;
        case 'popular':
          return (b.votes - a.votes) || dateComparison;
        case 'comments':
          return (b.commentCount - a.commentCount) || dateComparison;
        default:
          return dateComparison;
      }
    });

  return (
    <AppContext.Provider value={{
      allPosts: posts,
      posts: filteredPosts,
      selectedCategory,
      setSelectedCategory,
      sortBy,
      setSortBy,
      dateSortOrder,
      setDateSortOrder,
      searchQuery,
      setSearchQuery,
      selectedPost,
      setSelectedPost,
      isCreateModalOpen,
      setIsCreateModalOpen,
      addPost,
      votePost,
      addComment,
      dmThreads,
      isDmOpen,
      activeDmThreadId,
      selectedProfileUser,
      openProfile,
      closeProfile,
      openDmWithUser,
      openDmInbox,
      closeDm,
      setActiveDmThread,
      sendDmMessage,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
