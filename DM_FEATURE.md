# Direct Messaging Feature

## Overview
The DM system is now fully integrated with Firebase Authentication and Firestore, ensuring that only authenticated users can send and receive direct messages.

## Features

### ✅ Authentication Required
- Users must be logged in to access DMs
- DM threads are associated with user accounts
- Messages persist across sessions

### ✅ Real-time Messaging
- Messages sync in real-time using Firestore listeners
- Automatic updates when new messages arrive
- No page refresh needed

### ✅ Secure Storage
- DM threads stored in Firestore `dmThreads` collection
- Only participants can read/write their threads
- Messages encrypted in transit

## How It Works

### 1. Opening a DM
When a user clicks "Send DM" on a profile:
1. System checks if user is authenticated
2. Checks if DM thread already exists between users
3. Creates new thread in Firestore if needed
4. Opens DM modal with the conversation

### 2. Sending Messages
1. User types message and clicks send
2. Message saved to Firestore with sender ID
3. Real-time listener updates UI for both users
4. Thread timestamp updated for sorting

### 3. Data Structure

**Firestore Document: `/dmThreads/{threadId}`**
```javascript
{
  participants: ['userId1', 'userId2'],
  participantData: {
    userId1: {
      lastRead: '2026-05-03T...'
    },
    userId2: {
      name: 'User Name',
      avatar: 'UN',
      bio: 'Student contributor',
      yearsOnPlatform: 2,
      karma: 450
    }
  },
  messages: [
    {
      id: 'm-1234567890',
      senderId: 'userId1',
      sender: 'Username',
      text: 'Message content',
      createdAt: '2026-05-03T...'
    }
  ],
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## Security Rules

Only thread participants can:
- Read messages
- Send messages
- Update thread data

```javascript
match /dmThreads/{threadId} {
  allow read: if request.auth != null && 
                 request.auth.uid in resource.data.participants;
  allow create: if request.auth != null && 
                  request.auth.uid in request.resource.data.participants;
  allow update: if request.auth != null && 
                   request.auth.uid in resource.data.participants;
}
```

## Files Modified

### New Files
- `src/firebase/dms.js` - Firebase DM functions
- `DM_FEATURE.md` - This documentation

### Updated Files
- `src/context/AppContext.jsx` - Added Firebase DM integration
- `src/App.jsx` - Pass currentUser to AppProvider
- `FIREBASE_SETUP.md` - Added DM security rules

## Usage

### For Users
1. Login to your account
2. Click on any user's profile
3. Click "Send DM" button
4. Type and send messages
5. Access DM inbox via message icon in header

### For Developers
```javascript
// Open DM with a user
openDmWithUser({
  id: 'user-id',
  name: 'User Name',
  avatar: 'UN',
  bio: 'Bio text'
});

// Send a message
sendDmMessage(threadId, messageText);
```

## Future Enhancements
- [ ] Message read receipts
- [ ] Typing indicators
- [ ] File/image sharing
- [ ] Message reactions
- [ ] Search within conversations
- [ ] Block/report users
- [ ] Group chats
