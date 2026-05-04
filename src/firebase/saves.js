import {
  doc, setDoc, deleteDoc, getDocs, collection, serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';

export const savePost = async (uid, post) => {
  await setDoc(doc(db, 'users', uid, 'saves', String(post.id)), {
    postId: String(post.id),
    title: post.title,
    author: post.author || 'Unknown',
    category: post.category || 'all',
    votes: post.votes || 0,
    savedAt: serverTimestamp(),
  });
};

export const unsavePost = async (uid, postId) => {
  await deleteDoc(doc(db, 'users', uid, 'saves', String(postId)));
};

export const getSavedPosts = async (uid) => {
  const snap = await getDocs(collection(db, 'users', uid, 'saves'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};
