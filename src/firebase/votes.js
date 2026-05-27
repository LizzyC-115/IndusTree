import {
  doc, getDocs, collection, serverTimestamp, runTransaction,
} from 'firebase/firestore';
import { db } from './config';

export const persistVote = async (uid, post, vote) => {
  const ref = doc(db, 'users', uid, 'votes', String(post.id));
  const postRef = doc(db, 'posts', String(post.id));

  return runTransaction(db, async (transaction) => {
    const existingVote = await transaction.get(ref);
    const postSnap = await transaction.get(postRef);
    const previousVote = existingVote.exists() ? existingVote.data().vote || 0 : 0;
    const voteDelta = vote - previousVote;

    if (vote === 0) {
      transaction.delete(ref);
    } else {
      transaction.set(ref, {
        postId: String(post.id),
        title: post.title,
        author: post.author || 'Unknown',
        category: post.category || 'all',
        vote,
        votedAt: serverTimestamp(),
      });
    }

    if (voteDelta !== 0) {
      const currentVotes = postSnap.exists() ? postSnap.data().votes || 0 : 0;
      transaction.update(postRef, {
        votes: currentVotes + voteDelta,
        updatedAt: serverTimestamp(),
      });
    }

    return {
      vote,
      voteDelta,
    };
  });
};

export const getUserVotes = async (uid) => {
  const snap = await getDocs(collection(db, 'users', uid, 'votes'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};
