import { createContext, useContext, useState } from 'react';
import { initialPosts } from '../data/mockData';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [posts, setPosts] = useState(initialPosts);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const addPost = (newPost) => {
    const post = {
      id: Date.now(),
      ...newPost,
      votes: 0,
      commentCount: 0,
      newComments: 0,
      timeAgo: 'Just now',
      isPinned: false,
      isTrending: false,
      comments: [],
    };
    setPosts([post, ...posts]);
  };

  const votePost = (postId, direction) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          votes: post.votes + (direction === 'up' ? 1 : -1),
        };
      }
      return post;
    }));
  };

  const addComment = (postId, comment) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        const newComment = {
          id: Date.now(),
          ...comment,
          timeAgo: 'Just now',
          votes: 0,
          replies: [],
        };
        return {
          ...post,
          comments: [...(post.comments || []), newComment],
          commentCount: post.commentCount + 1,
        };
      }
      return post;
    }));
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
      
      switch (sortBy) {
        case 'recent':
          return 0;
        case 'popular':
          return b.votes - a.votes;
        case 'comments':
          return b.commentCount - a.commentCount;
        default:
          return 0;
      }
    });

  return (
    <AppContext.Provider value={{
      posts: filteredPosts,
      selectedCategory,
      setSelectedCategory,
      sortBy,
      setSortBy,
      searchQuery,
      setSearchQuery,
      selectedPost,
      setSelectedPost,
      isCreateModalOpen,
      setIsCreateModalOpen,
      addPost,
      votePost,
      addComment,
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
