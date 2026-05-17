import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from './config';

export const signUp = async (email, password, username, additionalData = {}) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: email,
      username: username,
      createdAt: new Date().toISOString(),
      ...additionalData
    });

    return { 
      success: true, 
      user: { 
        uid: user.uid, 
        email, 
        username,
        ...additionalData
      } 
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const signInWithUsername = async (username, password) => {
  try {
    // First, find the email associated with this username
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return { success: false, error: 'Username not found' };
    }
    
    // Get the email from the user document
    const userDoc = querySnapshot.docs[0];
    const email = userDoc.data().email;
    
    // Now sign in with email and password
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    return { 
      success: true, 
      user: { 
        uid: user.uid, 
        ...userDoc.data() 
      } 
    };
  } catch (error) {
    if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      return { success: false, error: 'Invalid username or password' };
    }
    return { success: false, error: error.message };
  }
};

export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (userDoc.exists()) {
      return { 
        success: true, 
        user: { 
          uid: user.uid, 
          ...userDoc.data() 
        } 
      };
    } else {
      return { success: false, error: 'User data not found' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const migrateUserIndustries = async () => {
  const INDUSTRY_MAP = {
    Technology: 'SWE/Tech',
    Healthcare: 'Medicine',
    Education:  'Academia',
    Marketing:  'PM',
    Other:      '',
  };
  const NEW_INDUSTRIES = new Set([
    'Finance', 'Consulting', 'PM', 'SWE/Tech', 'Quant', 'Engineering', 'Medicine', 'Academia',
  ]);

  const snapshot = await getDocs(collection(db, 'users'));
  let updated = 0;
  let skipped = 0;
  const log = [];

  for (const userDoc of snapshot.docs) {
    const data = userDoc.data();
    const current = data.industry ?? '';
    if (NEW_INDUSTRIES.has(current)) { skipped++; continue; }
    const mapped = INDUSTRY_MAP[current] ?? '';
    await updateDoc(doc(db, 'users', userDoc.id), { industry: mapped });
    log.push(`  [${userDoc.id}] "${data.username ?? '?'}" : "${current || '(empty)'}" → "${mapped || '(cleared)'}"`);
    updated++;
  }

  console.log(`Industry migration complete: ${updated} updated, ${skipped} already correct.`);
  log.forEach(l => console.log(l));
  return { updated, skipped };
};

export const getUserByUsername = async (username) => {
  try {
    const q = query(collection(db, 'users'), where('username', '==', username));
    const snap = await getDocs(q);
    if (snap.empty) return { success: false };
    return { success: true, data: snap.docs[0].data() };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateUserProfile = async (uid, fields) => {
  try {
    await updateDoc(doc(db, 'users', uid), fields);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Resize an image File to a compressed JPEG data URL (stored directly in Firestore).
// Max dimension is 200px; quality 0.78 keeps files well under Firestore's 1 MB doc limit.
export const resizeImageToDataUrl = (file, maxSize = 200, quality = 0.78) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        if (width > height) {
          if (width > maxSize) { height = Math.round((height * maxSize) / width); width = maxSize; }
        } else {
          if (height > maxSize) { width = Math.round((width * maxSize) / height); height = maxSize; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

// Resize the photo and store it as a data URL in the user's Firestore doc.
// No Firebase Storage rules or CORS config needed.
export const uploadProfilePhoto = async (uid, file) => {
  try {
    const dataUrl = await resizeImageToDataUrl(file);
    await updateDoc(doc(db, 'users', uid), { photoURL: dataUrl });
    return { success: true, url: dataUrl };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getUserData = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return { success: true, data: userDoc.data() };
    } else {
      return { success: false, error: 'User not found' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};
