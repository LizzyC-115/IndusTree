import {
  doc, setDoc, deleteDoc, getDocs, collection, serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';

export const persistVote = async (uid, post, vote) => {
  const ref = doc(db, 'users', uid, 'votes', String(post.id));
  if (vote === 0) {
    await deleteDoc(ref);
  } else {
    await setDoc(ref, {
      postId: String(post.id),
      title: post.title,
      author: post.author || 'Unknown',
      category: post.category || 'all',
      vote,
      votedAt: serverTimestamp(),
    });
  }
};

export const getUserVotes = async (uid) => {
  const snap = await getDocs(collection(db, 'users', uid, 'votes'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};
