import { createContext, useContext, useState, useEffect } from 'react';
import { initialPosts } from '../data/mockData';
import { subscribeToDmThreads, getOrCreateDmThread, sendDmMessage as sendFirebaseDm } from '../firebase/dms';
import { getUserByUsername } from '../firebase/auth';
import { saveComment, getCommentCounts } from '../firebase/comments';
import { savePost, unsavePost, getSavedPosts } from '../firebase/saves';
import { persistVote } from '../firebase/votes';

const AppContext = createContext();

export function AppProvider({ children, currentUser }) {
  const [posts, setPosts] = useState(initialPosts);
  // commentCounts: { [postId]: number } — initialised to 0 for all posts,
  // then overwritten with real Firestore counts on mount.
  const [commentCounts, setCommentCounts] = useState(() => {
    const counts = {};
    initialPosts.forEach((p) => { counts[p.id] = 0; });
    return counts;
  });
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [dateSortOrder, setDateSortOrder] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [dmThreads, setDmThreads] = useState([]);
  const [isDmOpen, setIsDmOpen] = useState(false);
  const [activeDmThreadId, setActiveDmThreadId] = useState(null);
  const [selectedProfileUser, setSelectedProfileUser] = useState(null);
  const [isMyProfileOpen, setIsMyProfileOpen] = useState(false);
  // savedPostIds: Set of postId strings the current user has bookmarked
  const [savedPostIds, setSavedPostIds] = useState(new Set());

  // Subscribe to DM threads when user is authenticated
  useEffect(() => {
    if (!currentUser?.uid) {
      console.log('⚠️ No user logged in, clearing DM threads');
      setDmThreads([]);
      return;
    }

    console.log('🔌 Subscribing to DM threads for user:', currentUser.uid);

    const unsubscribe = subscribeToDmThreads(currentUser.uid, (threads) => {
      console.log('📨 DM Threads updated from Firestore:', threads.length);
      
      // Transform Firestore threads to app format
      const formattedThreads = threads.map(thread => {
        const otherUserId = thread.participants.find(id => id !== currentUser.uid);
        const otherUserData = thread.participantData?.[otherUserId] || {};
        
        console.log('Thread:', thread.id, 'Messages:', thread.messages?.length || 0, 'Other user:', otherUserData.name);
        
        return {
          id: thread.id,
          participant: {
            id: otherUserId,
            name: otherUserData.name || 'Unknown User',
            avatar: otherUserData.avatar || '?',
            bio: otherUserData.bio || 'Student contributor',
            yearsOnPlatform: otherUserData.yearsOnPlatform || 1,
            karma: otherUserData.karma || 100
          },
          messages: thread.messages || [],
          updatedAt: thread.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
        };
      });
      
      console.log('✅ Formatted threads:', formattedThreads.length);
      setDmThreads(formattedThreads);
      
      // Set active thread if none selected and we have threads
      setActiveDmThreadId(prev => {
        if (!prev && formattedThreads.length > 0) {
          console.log('🎯 Auto-selecting first thread:', formattedThreads[0].id);
          return formattedThreads[0].id;
        }
        return prev;
      });
    });

    return () => {
      console.log('🔌 Unsubscribing from DM threads');
      unsubscribe();
    };
  }, [currentUser?.uid]);

  // Load real comment counts from Firestore once on mount
  useEffect(() => {
    const postIds = initialPosts.map((p) => p.id);
    getCommentCounts(postIds).then((counts) => {
      setCommentCounts((prev) => ({ ...prev, ...counts }));
    }).catch(() => {/* keep zeroes on error */});
  }, []);

  // Load saved posts once when user logs in
  useEffect(() => {
    if (!currentUser?.uid) { setSavedPostIds(new Set()); return; }
    getSavedPosts(currentUser.uid)
      .then((saves) => setSavedPostIds(new Set(saves.map((s) => String(s.postId)))))
      .catch(() => {});
  }, [currentUser?.uid]);

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

        // Persist to Firebase in the background (non-blocking)
        if (currentUser?.uid) {
          persistVote(currentUser.uid, post, finalVote).catch(() => {});
        }

        return {
          ...post,
          votes: post.votes + voteDelta,
          userVote: finalVote,
        };
      })
    );
  };

  const toggleSave = async (post) => {
    if (!currentUser?.uid) return;
    const pid = String(post.id);
    const isSaved = savedPostIds.has(pid);
    // Optimistic update
    setSavedPostIds((prev) => {
      const next = new Set(prev);
      isSaved ? next.delete(pid) : next.add(pid);
      return next;
    });
    try {
      if (isSaved) {
        await unsavePost(currentUser.uid, pid);
      } else {
        await savePost(currentUser.uid, post);
      }
    } catch {
      // Roll back on error
      setSavedPostIds((prev) => {
        const next = new Set(prev);
        isSaved ? next.add(pid) : next.delete(pid);
        return next;
      });
    }
  };

  const formatUserId = (name = '') => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const openProfile = async (user) => {
    // Show basic data immediately for instant feedback
    const base = {
      id: user.id || formatUserId(user.name),
      name: user.name,
      avatar: user.avatar || user.name?.[0] || '?',
      bio: user.bio || 'Student contributor',
      industry: user.industry || null,
      gradYear: user.gradYear || null,
      experienceLevel: user.experienceLevel || null,
      createdAt: user.createdAt || null,
      yearsOnPlatform: user.yearsOnPlatform || 1,
    };
    setSelectedProfileUser(base);

    // Try to enrich with real Firestore profile data (by username match)
    try {
      const result = await getUserByUsername(user.name);
      if (result.success && result.data) {
        setSelectedProfileUser((prev) => prev && ({
          ...prev,
          industry: result.data.industry || prev.industry,
          gradYear: result.data.gradYear || prev.gradYear,
          experienceLevel: result.data.experienceLevel || prev.experienceLevel,
          createdAt: result.data.createdAt || prev.createdAt,
          bio: result.data.bio || prev.bio,
        }));
      }
    } catch { /* keep basic data */ }
  };

  const closeProfile = () => setSelectedProfileUser(null);

  const openMyProfile = () => setIsMyProfileOpen(true);
  const closeMyProfile = () => setIsMyProfileOpen(false);

  const openDmWithUser = async (user) => {
    if (!currentUser?.uid) {
      console.error('Must be logged in to send DMs');
      return;
    }

    const normalizedUser = {
      id: user.id || formatUserId(user.name),
      name: user.name,
      avatar: user.avatar || user.name?.[0] || '?',
      bio: user.bio || 'Student contributor',
      yearsOnPlatform: user.yearsOnPlatform || 1,
      karma: user.karma || 100,
    };

    // Open DM modal immediately
    setIsDmOpen(true);

    try {
      // Check if thread exists locally first
      const existingThread = dmThreads.find(
        (thread) => thread.participant.id === normalizedUser.id
      );

      if (existingThread) {
        setActiveDmThreadId(existingThread.id);
        return;
      }

      // Create or get thread from Firebase
      const thread = await getOrCreateDmThread(
        currentUser.uid,
        normalizedUser.id,
        normalizedUser,
        currentUser  // Pass current user data
      );

      console.log('🎯 Setting active thread:', thread.id);
      setActiveDmThreadId(thread.id);
    } catch (error) {
      console.error('Error opening DM:', error);
      // Keep modal open even on error so user can see what happened
    }
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

  const sendDmMessage = async (threadId, text) => {
    const trimmedText = text.trim();
    if (!trimmedText || !currentUser?.uid) return;

    try {
      await sendFirebaseDm(
        threadId,
        currentUser.uid,
        currentUser.username || 'You',
        trimmedText
      );
      // Real-time listener will update the UI automatically
    } catch (error) {
      console.error('Error sending DM:', error);
    }
  };

  const addComment = async (postId, comment) => {
    if (currentUser?.uid) {
      await saveComment(postId, {
        content: comment.content,
        authorUid: currentUser.uid,
        authorName: currentUser.username || comment.author,
        authorAvatar: comment.avatar || currentUser.username?.[0]?.toUpperCase() || 'U',
      });
    }
    // Update count locally so feed sort reflects it immediately
    setCommentCounts((prev) => ({ ...prev, [postId]: (prev[postId] ?? 0) + 1 }));
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
          return ((commentCounts[b.id] ?? 0) - (commentCounts[a.id] ?? 0)) || dateComparison;
        default:
          return dateComparison;
      }
    });

  return (
    <AppContext.Provider value={{
      currentUser,
      allPosts: posts,
      posts: filteredPosts,
      commentCounts,
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
      isMyProfileOpen,
      openMyProfile,
      closeMyProfile,
      savedPostIds,
      toggleSave,
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
