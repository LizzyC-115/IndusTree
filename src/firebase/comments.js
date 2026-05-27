import {
  addDoc, collection, onSnapshot, query,
  orderBy, serverTimestamp, getCountFromServer,
  collectionGroup, where, limit, getDocs, deleteDoc, doc,
  updateDoc, increment,
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
  const commentRef = await addDoc(collection(db, 'posts', normalizedPostId, 'comments'), {
    postId: normalizedPostId,
    content,
    authorUid,
    authorName,
    authorAvatar: authorAvatar || authorName?.[0]?.toUpperCase() || '?',
    authorPhotoURL: authorPhotoURL || null,
    votes: 0,
    createdAt: serverTimestamp(),
  });

  updateDoc(postRef, {
    commentCount: increment(1),
    newComments: increment(1),
    updatedAt: serverTimestamp(),
  }).catch(() => {
    // Non-authors may not be allowed to update the parent post; live comment counts
    // come from the comments subcollection, so this denormalized field is best effort.
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
  await deleteDoc(commentRef);
  updateDoc(postRef, {
    commentCount: increment(-1),
    updatedAt: serverTimestamp(),
  }).catch(() => {
    // See saveComment: the subcollection is the source of truth for counts.
  });
};

export const subscribeToCommentCounts = (postIds, callback) => {
  if (!postIds.length) {
    callback({});
    return () => {};
  }

  const counts = {};
  const unsubscribes = postIds.map((postId) => (
    onSnapshot(
      collection(db, 'posts', String(postId), 'comments'),
      (snapshot) => {
        counts[String(postId)] = snapshot.size;
        callback({ ...counts });
      },
      (error) => {
        console.error('Comment count subscription error:', error.code, error.message);
        counts[String(postId)] = 0;
        callback({ ...counts });
      },
    )
  ));

  return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
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
