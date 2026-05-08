import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc,
  doc,
  orderBy,
  onSnapshot,
  serverTimestamp,
  arrayUnion
} from 'firebase/firestore';
import { db } from './config';

// Get all DM threads for a user
export const getUserDmThreads = async (userId) => {
  try {
    const threadsRef = collection(db, 'dmThreads');
    const q = query(
      threadsRef,
      where('participants', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const threads = [];
    
    querySnapshot.forEach((doc) => {
      threads.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return threads;
  } catch (error) {
    console.error('Error fetching DM threads:', error);
    return [];
  }
};

// Subscribe to DM threads in real-time
export const subscribeToDmThreads = (userId, callback) => {
  const threadsRef = collection(db, 'dmThreads');
  const q = query(
    threadsRef,
    where('participants', 'array-contains', userId)
  );
  
  return onSnapshot(q, (querySnapshot) => {
    console.log('🔥 Firestore snapshot received, docs:', querySnapshot.size);
    const threads = [];
    querySnapshot.forEach((doc) => {
      console.log('📄 Thread doc:', doc.id, doc.data());
      threads.push({
        id: doc.id,
        ...doc.data()
      });
    });
    callback(threads);
  }, (error) => {
    console.error('❌ Firestore subscription error:', error);
  });
};

// Create or get existing DM thread between two users
export const getOrCreateDmThread = async (currentUserId, otherUserId, otherUserData, currentUserData) => {
  try {
    console.log('🔍 Looking for thread between:', currentUserId, 'and', otherUserId);
    
    // Check if thread already exists
    const threadsRef = collection(db, 'dmThreads');
    const q = query(
      threadsRef,
      where('participants', 'array-contains', currentUserId)
    );
    
    const querySnapshot = await getDocs(q);
    let existingThread = null;
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.participants.includes(otherUserId)) {
        console.log('✅ Found existing thread:', doc.id);
        existingThread = {
          id: doc.id,
          ...data
        };
      }
    });
    
    if (existingThread) {
      return existingThread;
    }
    
    console.log('➕ Creating new thread...');
    
    // Create new thread
    const newThread = {
      participants: [currentUserId, otherUserId],
      participantData: {
        [currentUserId]: {
          name: currentUserData?.name || currentUserData?.username || 'You',
          avatar: currentUserData?.avatar || currentUserData?.username?.[0]?.toUpperCase() || 'U',
          bio: currentUserData?.bio || 'Student contributor',
          lastRead: new Date().toISOString()
        },
        [otherUserId]: {
          name: otherUserData.name,
          avatar: otherUserData.avatar,
          bio: otherUserData.bio || 'Student contributor',
          yearsOnPlatform: otherUserData.yearsOnPlatform || 1,
          karma: otherUserData.karma || 100
        }
      },
      messages: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(threadsRef, newThread);
    console.log('✅ Created new thread:', docRef.id);
    
    return {
      id: docRef.id,
      ...newThread
    };
  } catch (error) {
    console.error('❌ Error creating DM thread:', error);
    throw error;
  }
};

// Send a message in a DM thread
export const sendDmMessage = async (threadId, senderId, senderName, messageText) => {
  try {
    const threadRef = doc(db, 'dmThreads', threadId);
    
    const newMessage = {
      id: `m-${Date.now()}`,
      senderId,
      sender: senderName,
      text: messageText.trim(),
      createdAt: new Date().toISOString()
    };
    
    await updateDoc(threadRef, {
      messages: arrayUnion(newMessage),
      updatedAt: serverTimestamp()
    });
    
    return newMessage;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// Mark thread as read
export const markThreadAsRead = async (threadId, userId) => {
  try {
    const threadRef = doc(db, 'dmThreads', threadId);
    await updateDoc(threadRef, {
      [`participantData.${userId}.lastRead`]: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error marking thread as read:', error);
  }
};
