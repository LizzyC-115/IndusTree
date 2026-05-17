import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from './config';

// Subscribe to all posts in real-time
export const subscribeToPosts = (callback) => {
  const postsRef = collection(db, 'posts');
  // Remove orderBy to avoid index requirement - we'll sort in the app
  
  return onSnapshot(postsRef, (querySnapshot) => {
    console.log('📝 Posts updated from Firestore:', querySnapshot.size);
    const posts = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      posts.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.getTime() || Date.now(),
        comments: data.comments || []
      });
    });
    
    // Sort by createdAt descending (newest first) in the app
    posts.sort((a, b) => b.createdAt - a.createdAt);
    
    callback(posts);
  }, (error) => {
    console.error('❌ Firestore posts subscription error:', error);
    console.error('Error details:', error.message);
    // Return empty array on error so app doesn't hang
    callback([]);
  });
};

// Create a new post
export const createPost = async (postData, userId, username, authorPhotoURL = null) => {
  try {
    console.log('➕ Creating new post...');
    
    const postsRef = collection(db, 'posts');
    const newPost = {
      title: postData.title,
      content: postData.content,
      category: postData.category,
      author: username,
      authorId: userId,
      authorPhotoURL: authorPhotoURL || null,
      imageURL: postData.imageURL || null,
      votes: 0,
      userVote: 0,
      commentCount: 0,
      newComments: 0,
      isPinned: false,
      isTrending: false,
      comments: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(postsRef, newPost);
    console.log('✅ Created post:', docRef.id);
    
    return {
      id: docRef.id,
      ...newPost,
      createdAt: Date.now()
    };
  } catch (error) {
    console.error('❌ Error creating post:', error);
    throw error;
  }
};

// Update post votes
export const updatePostVote = async (postId, voteDelta, newUserVote) => {
  try {
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      votes: increment(voteDelta),
      userVote: newUserVote,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('❌ Error updating vote:', error);
    throw error;
  }
};

// Add comment to post
export const addCommentToPost = async (postId, commentData, userId, username) => {
  try {
    const postRef = doc(db, 'posts', postId);
    
    // Get current post data
    const postDoc = await getDoc(postRef);
    if (!postDoc.exists()) {
      throw new Error('Post not found');
    }
    
    const currentComments = postDoc.data().comments || [];
    const newComment = {
      id: `comment-${Date.now()}`,
      author: username,
      authorId: userId,
      content: commentData.content,
      votes: 0,
      userVote: 0,
      createdAt: new Date().toISOString(),
      replies: []
    };
    
    await updateDoc(postRef, {
      comments: [...currentComments, newComment],
      commentCount: increment(1),
      newComments: increment(1),
      updatedAt: serverTimestamp()
    });
    
    return newComment;
  } catch (error) {
    console.error('❌ Error adding comment:', error);
    throw error;
  }
};

// Delete a post
export const deletePost = async (postId, userId) => {
  try {
    const postRef = doc(db, 'posts', postId);
    
    // Verify ownership before deleting
    const postDoc = await getDoc(postRef);
    if (!postDoc.exists()) {
      throw new Error('Post not found');
    }
    
    if (postDoc.data().authorId !== userId) {
      throw new Error('Not authorized to delete this post');
    }
    
    await deleteDoc(postRef);
    console.log('✅ Deleted post:', postId);
  } catch (error) {
    console.error('❌ Error deleting post:', error);
    throw error;
  }
};

