/* eslint-disable react/prop-types */
import { createContext, useContext, useState, useEffect } from 'react';
import { initialPosts } from '../data/mockData';
import { subscribeToDmThreads, getOrCreateDmThread, sendDmMessage as sendFirebaseDm, markThreadAsRead } from '../firebase/dms';
import { subscribeToPosts, createPost as createFirebasePost, updatePostVote, deletePost as deleteFirebasePost, modDeletePost as modDeleteFirebasePost, pinPost as pinFirebasePost, subscribeToCommunityRules, updateCommunityRules as updateFirebaseCommunityRules } from '../firebase/posts';
import { subscribeToDmThreads, getOrCreateDmThread, sendDmMessage as sendFirebaseDm } from '../firebase/dms';
import { subscribeToPosts, createPost as createFirebasePost, deletePost as deleteFirebasePost, modDeletePost as modDeleteFirebasePost, pinPost as pinFirebasePost, subscribeToCommunityRules, updateCommunityRules as updateFirebaseCommunityRules } from '../firebase/posts';
import { getUserByUsername, banUser as banFirebaseUser } from '../firebase/auth';
import { saveComment, deleteComment as deleteFirebaseComment } from '../firebase/comments';
import { savePost, unsavePost, getSavedPosts } from '../firebase/saves';
import { getUserVotes, persistVote } from '../firebase/votes';

const AppContext = createContext();

export function AppProvider({ children, currentUser, onUserUpdate }) {
  const [posts, setPosts] = useState([]);
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
  // communityRules: { [industry]: rules[] | null }  null = use defaults
  const [communityRules, setCommunityRules] = useState({});

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
        
        const myLastRead = thread.participantData?.[currentUser.uid]?.lastRead || null;
        return {
          id: thread.id,
          participant: {
            id: otherUserId,
            name: otherUserData.name || 'Unknown User',
            avatar: otherUserData.avatar || '?',
            photoURL: otherUserData.photoURL || null,
            bio: otherUserData.bio || 'Student contributor',
            yearsOnPlatform: otherUserData.yearsOnPlatform || 1,
            karma: otherUserData.karma || 100
          },
          messages: thread.messages || [],
          updatedAt: thread.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          myLastRead,
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

  // Subscribe to posts from Firestore
  useEffect(() => {
    console.log('🔌 Subscribing to posts from Firestore');
    
    let hasLoaded = false;
    
    // Set a timeout to show empty state if Firestore takes too long
    const timeout = setTimeout(() => {
      if (!hasLoaded) {
        console.warn('⚠️ Firestore taking too long, showing empty state');
        setPosts([]);
      }
    }, 5000); // 5 second timeout
    
    const unsubscribe = subscribeToPosts((firestorePosts) => {
      hasLoaded = true;
      clearTimeout(timeout);
      console.log('📝 Posts loaded from Firestore:', firestorePosts.length);
      setPosts((prevPosts) => {
        const existingVotes = new Map(
          prevPosts.map((post) => [String(post.id), post.userVote || 0]),
        );
        return firestorePosts.map((post) => ({
          ...post,
          userVote: existingVotes.get(String(post.id)) || 0,
        }));
      });
      
      // Update comment counts from Firestore posts
      const counts = {};
      firestorePosts.forEach(post => {
        counts[post.id] = post.commentCount || post.comments?.length || 0;
      });
      setCommentCounts(counts);
    });

    return () => {
      clearTimeout(timeout);
      console.log('🔌 Unsubscribing from posts');
      unsubscribe();
    };
  }, []);

  // Keep each post's current user's vote state after refresh/realtime updates.
  useEffect(() => {
    if (!currentUser?.uid) {
      setPosts((prevPosts) => prevPosts.map((post) => ({ ...post, userVote: 0 })));
      return;
    }

    getUserVotes(currentUser.uid)
      .then((votes) => {
        const nextVotes = {};
        votes.forEach((vote) => {
          nextVotes[String(vote.postId || vote.id)] = vote.vote || 0;
        });
        setPosts((prevPosts) => prevPosts.map((post) => ({
          ...post,
          userVote: nextVotes[String(post.id)] || 0,
        })));
      })
      .catch(() => {});
  }, [currentUser?.uid]);

  // If the selected post is open, keep it aligned with realtime feed changes.
  useEffect(() => {
    setSelectedPost((prev) => {
      if (!prev) return prev;
      const latestPost = posts.find((post) => post.id === prev.id);
      return latestPost || prev;
    });
  }, [posts]);

  // Subscribe to community rules for the active category
  useEffect(() => {
    const industry = selectedCategory || 'all';
    const unsub = subscribeToCommunityRules(industry, (rules) => {
      setCommunityRules((prev) => ({ ...prev, [industry]: rules }));
    });
    return unsub;
  }, [selectedCategory]);

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

  const addPost = async (newPost) => {
    if (!currentUser?.uid) {
      console.error('Must be logged in to create posts');
      return;
    }

    try {
      await createFirebasePost(newPost, currentUser.uid, currentUser.username || 'Anonymous', currentUser.photoURL || null);
      // Real-time listener will update the UI automatically
      console.log('✅ Post created successfully');
    } catch (error) {
      console.error('❌ Error creating post:', error);
      throw error;
    }
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

  const deletePost = async (postId) => {
    if (!currentUser?.uid) return;
    try {
      await deleteFirebasePost(postId, currentUser.uid);
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const deleteComment = async (postId, commentId) => {
    if (!currentUser?.uid) return;
    setCommentCounts((prev) => ({ ...prev, [postId]: Math.max(0, (prev[postId] ?? 1) - 1) }));
    setSelectedPost((prev) => (
      prev?.id === postId
        ? { ...prev, commentCount: Math.max(0, (prev.commentCount ?? 1) - 1) }
        : prev
    ));

    try {
      await deleteFirebaseComment(postId, commentId);
    } catch (error) {
      console.error('Error deleting comment:', error);
      setCommentCounts((prev) => ({ ...prev, [postId]: (prev[postId] ?? 0) + 1 }));
      setSelectedPost((prev) => (
        prev?.id === postId
          ? { ...prev, commentCount: (prev.commentCount ?? 0) + 1 }
          : prev
      ));
    }
  };

  const isMod = currentUser?.role === 'mod';

  const modDeletePost = async (postId) => {
    if (!isMod) return;
    try { await modDeleteFirebasePost(postId); }
    catch (err) { console.error('Mod delete post error:', err); }
  };

  const pinPost = async (postId, currentlyPinned) => {
    if (!isMod) return;
    try { await pinFirebasePost(postId, currentlyPinned); }
    catch (err) { console.error('Pin post error:', err); }
  };

  const banUser = async (targetUid) => {
    if (!isMod || !targetUid || targetUid === currentUser?.uid) return;
    try { await banFirebaseUser(targetUid); }
    catch (err) { console.error('Ban user error:', err); }
  };

  const saveCommunityRules = async (industry, rules) => {
    if (!isMod) return;
    try { await updateFirebaseCommunityRules(industry, rules); }
    catch (err) { console.error('Update rules error:', err); }
  };

  const updateCurrentUser = (updates) => {
    if (onUserUpdate) {
      onUserUpdate((prev) => ({ ...prev, ...updates }));
    }
  };

  const formatUserId = (name = '') => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const openProfile = async (user) => {
    // Compute karma from all posts authored by this user
    const karma = posts
      .filter((p) => (p.authorId && p.authorId === user.id) || p.author === user.name)
      .reduce((sum, p) => sum + (p.votes || 0), 0);

    // Show basic data immediately for instant feedback
    const base = {
      id: user.id || formatUserId(user.name),
      name: user.name,
      avatar: user.avatar || user.name?.[0] || '?',
      photoURL: user.photoURL || null,
      bio: user.bio || 'Student contributor',
      industry: user.industry || null,
      gradYear: user.gradYear || null,
      experienceLevel: user.experienceLevel || null,
      createdAt: user.createdAt || null,
      yearsOnPlatform: user.yearsOnPlatform || 1,
      karma,
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
          photoURL: result.data.photoURL || prev.photoURL,
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
      photoURL: user.photoURL || null,
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
    if (currentUser?.uid && threadId) {
      markThreadAsRead(threadId, currentUser.uid).catch(() => {});
    }
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
    if (!currentUser?.uid) return;

    // Optimistic count update; the posts listener confirms the persisted value.
    setCommentCounts((prev) => ({ ...prev, [postId]: (prev[postId] ?? 0) + 1 }));
    setSelectedPost((prev) => (
      prev?.id === postId
        ? { ...prev, commentCount: (prev.commentCount ?? 0) + 1 }
        : prev
    ));

    try {
      await saveComment(postId, {
        content: comment.content,
        authorUid: currentUser.uid,
        authorName: currentUser.username || comment.author,
        authorAvatar: comment.avatar || currentUser.username?.[0]?.toUpperCase() || 'U',
        authorPhotoURL: currentUser.photoURL || null,
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      setCommentCounts((prev) => ({ ...prev, [postId]: Math.max(0, (prev[postId] ?? 1) - 1) }));
      setSelectedPost((prev) => (
        prev?.id === postId
          ? { ...prev, commentCount: Math.max(0, (prev.commentCount ?? 1) - 1) }
          : prev
      ));
    }
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
      updateCurrentUser,
      deletePost,
      deleteComment,
      isMod,
      modDeletePost,
      pinPost,
      banUser,
      communityRules,
      saveCommunityRules,
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
