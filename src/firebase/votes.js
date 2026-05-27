import {
  collection, deleteDoc, doc, getDocs, onSnapshot, query, serverTimestamp, setDoc, where,
} from 'firebase/firestore';
import { db } from './config';

export const persistVote = async (uid, post, vote) => {
  const postId = String(post.id);
  const ref = doc(db, 'votes', `${postId}_${uid}`);

  if (vote === 0) {
    await deleteDoc(ref);
  } else {
    await setDoc(ref, {
      uid,
      postId,
      title: post.title,
      author: post.author || 'Unknown',
      category: post.category || 'all',
      vote,
      votedAt: serverTimestamp(),
    });
  }
};

export const getUserVotes = async (uid) => {
  const snap = await getDocs(query(collection(db, 'votes'), where('uid', '==', uid)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const subscribeToVoteTotals = (callback) => {
  return onSnapshot(
    collection(db, 'votes'),
    (snapshot) => {
      const totals = {};
      snapshot.forEach((voteDoc) => {
        const data = voteDoc.data();
        if (!data.postId) return;
        totals[String(data.postId)] = (totals[String(data.postId)] || 0) + (data.vote || 0);
      });
      callback(totals);
    },
    (error) => {
      console.error('Vote totals subscription error:', error.code, error.message);
      callback({});
    },
  );
};
