import {
  collection, onSnapshot, query,
  orderBy, serverTimestamp, getCountFromServer,
  collectionGroup, where, limit, getDocs, doc,
  runTransaction, increment,
} from 'firebase/firestore';
import { db } from './config';

const toTimeAgo = (date) => {
  const diff = Date.now() - date.getTime();
  if (diff < 60_000) return 'Just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  return `${Math.floor(diff / 86_400_000)}d`;
};

export const saveComment = async (postId, { content, authorUid, authorName, authorAvatar, authorPhotoURL }) => {
  const normalizedPostId = String(postId);
  const postRef = doc(db, 'posts', normalizedPostId);
  const commentRef = doc(collection(db, 'posts', normalizedPostId, 'comments'));
  await runTransaction(db, async (transaction) => {
    transaction.set(commentRef, {
      postId: normalizedPostId,
      content,
      authorUid,
      authorName,
      authorAvatar: authorAvatar || authorName?.[0]?.toUpperCase() || '?',
      authorPhotoURL: authorPhotoURL || null,
      votes: 0,
      createdAt: serverTimestamp(),
    });
    transaction.update(postRef, {
      commentCount: increment(1),
      newComments: increment(1),
      updatedAt: serverTimestamp(),
    });
  });
  return commentRef;
};

export const getUserComments = async (uid, maxResults = 30) => {
  try {
    const q = query(
      collectionGroup(db, 'comments'),
      where('authorUid', '==', uid),
      orderBy('createdAt', 'desc'),
      limit(maxResults),
    );
    const snap = await getDocs(q);
    return snap.docs.map((doc) => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate?.() || new Date();
      return {
        id: doc.id,
        postId: data.postId || '?',
        content: data.content,
        createdAt: createdAt.toISOString(),
        timeAgo: toTimeAgo(createdAt),
      };
    });
  } catch (err) {
    console.warn('getUserComments error (may need Firestore index):', err.message);
    return [];
  }
};

export const subscribeToComments = (postId, callback) => {
  const q = query(
    collection(db, 'posts', String(postId), 'comments'),
    orderBy('createdAt', 'asc'),
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const comments = snapshot.docs.map((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate?.() || new Date();
        return {
          id: doc.id,
          author: data.authorName || 'Anonymous',
          authorUid: data.authorUid || null,
          avatar: data.authorAvatar || '?',
          photoURL: data.authorPhotoURL || null,
          content: data.content,
          timeAgo: toTimeAgo(createdAt),
          votes: data.votes || 0,
          createdAt: createdAt.toISOString(),
        };
      });
      callback(comments);
    },
    (error) => {
      console.error('Comments subscription error:', error.code, error.message);
      callback([]); // resolve loading state so UI doesn't hang
    },
  );
};

export const deleteComment = async (postId, commentId) => {
  const normalizedPostId = String(postId);
  const postRef = doc(db, 'posts', normalizedPostId);
  const commentRef = doc(db, 'posts', normalizedPostId, 'comments', commentId);
  await runTransaction(db, async (transaction) => {
    const commentSnap = await transaction.get(commentRef);
    if (!commentSnap.exists()) return;

    transaction.delete(commentRef);
    transaction.update(postRef, {
      commentCount: increment(-1),
      updatedAt: serverTimestamp(),
    });
  });
};

export const getCommentCounts = async (postIds) => {
  const counts = {};
  await Promise.all(
    postIds.map(async (postId) => {
      try {
        const snap = await getCountFromServer(
          collection(db, 'posts', String(postId), 'comments'),
        );
        counts[postId] = snap.data().count;
      } catch {
        counts[postId] = 0;
      }
    }),
  );
  return counts;
};
