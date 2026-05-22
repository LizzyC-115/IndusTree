import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from './config';

const EDU_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.edu$/i;
export const EDU_EMAIL_ERROR = 'Please use a valid .edu email address to create an account.';
export const isEduEmail = (email) => EDU_EMAIL_PATTERN.test(email.trim());

export const signUp = async (email, password, username, additionalData = {}) => {
  try {
    if (!isEduEmail(email)) {
      return { success: false, error: EDU_EMAIL_ERROR };
    }

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
//
// Implementation notes — this path used to freeze the browser on large photos because
// it base64-encoded the entire input via FileReader and then forced the main thread
// to decode the full-resolution image into an <img>. For a 12+ MP phone photo that's
// ~50–100 MB of pixel data resident in memory before any resizing happens. We now:
//   1. Reject inputs above MAX_INPUT_BYTES outright (friendly error, no hang).
//   2. Prefer createImageBitmap with resizeWidth/resizeHeight, which decodes off the
//      main thread and never materializes the full-res bitmap.
//   3. Fall back to an Object URL + <img> path on browsers without createImageBitmap.
const MAX_INPUT_BYTES = 20 * 1024 * 1024; // 20 MB

const computeFit = (width, height, maxSize) => {
  if (width <= maxSize && height <= maxSize) return { width, height };
  if (width >= height) {
    return { width: maxSize, height: Math.max(1, Math.round((height * maxSize) / width)) };
  }
  return { width: Math.max(1, Math.round((width * maxSize) / height)), height: maxSize };
};

const drawBitmapToDataUrl = (bitmap, width, height, quality) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, width, height);
  const out = canvas.toDataURL('image/jpeg', quality);
  if (typeof bitmap.close === 'function') bitmap.close();
  return out;
};

export const resizeImageToDataUrl = async (file, maxSize = 200, quality = 0.78) => {
  if (!file) throw new Error('No file provided');
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error(`Image is too large (${Math.round(file.size / 1024 / 1024)} MB). Please pick one under 20 MB.`);
  }

  // Preferred path: createImageBitmap decodes off the main thread and can resize during decode,
  // so the full-resolution image never has to sit in memory.
  if (typeof createImageBitmap === 'function') {
    try {
      const probe = await createImageBitmap(file);
      const { width, height } = computeFit(probe.width, probe.height, maxSize);
      if (typeof probe.close === 'function') probe.close();
      const resized = await createImageBitmap(file, {
        resizeWidth: width,
        resizeHeight: height,
        resizeQuality: 'high',
      });
      return drawBitmapToDataUrl(resized, width, height, quality);
    } catch {
      // fall through to the Object URL path
    }
  }

  // Fallback: Object URL is ~30% smaller than base64 in memory and doesn't block on encoding.
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('Could not decode this image. Try a JPEG or PNG.'));
      i.src = objectUrl;
    });
    const { width, height } = computeFit(img.naturalWidth, img.naturalHeight, maxSize);
    return drawBitmapToDataUrl(img, width, height, quality);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

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

// Send a password reset email given a username (looks up their email first)
export const sendPasswordReset = async (username) => {
  try {
    const q = query(collection(db, 'users'), where('username', '==', username));
    const snap = await getDocs(q);
    if (snap.empty) return { success: false, error: 'No account found with that username.' };
    const email = snap.docs[0].data().email;
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Mod-only: set banned flag on a user
export const banUser = async (targetUid) => {
  await updateDoc(doc(db, 'users', targetUid), { banned: true });
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
