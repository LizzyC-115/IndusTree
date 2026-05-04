# Firebase Setup Instructions

## Step 1: Get Your Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Click on the gear icon ⚙️ next to "Project Overview"
4. Select "Project settings"
5. Scroll down to "Your apps" section
6. If you haven't added a web app yet:
   - Click the `</>` (web) icon
   - Register your app with a nickname (e.g., "IndusTree Web")
   - Click "Register app"
7. Copy the `firebaseConfig` object values

## Step 2: Create .env File

1. In your project root, create a file named `.env`
2. Copy the contents from `.env.example`
3. Replace the placeholder values with your actual Firebase config values:

```
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
```

## Step 3: Enable Authentication

1. In Firebase Console, go to "Authentication" in the left sidebar
2. Click "Get started" if you haven't enabled it
3. Go to the "Sign-in method" tab
4. Enable "Email/Password" authentication
5. Click "Save"

## Step 4: Set Up Firestore Database

1. In Firebase Console, go to "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in production mode" (we'll set rules later)
4. Select a location close to your users
5. Click "Enable"

## Step 5: Configure Firestore Security Rules

1. In Firestore Database, go to the "Rules" tab
2. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      // Allow reading user documents for login (username lookup)
      // This is safe because we don't expose sensitive data
      allow read: if true;
      // Users can create their own document during signup
      allow create: if request.auth != null && request.auth.uid == userId;
      // Users can update their own data
      allow update: if request.auth != null && request.auth.uid == userId;
      // Users can delete their own profile
      allow delete: if request.auth != null && request.auth.uid == userId;
    }
    
    // DM Threads collection
    match /dmThreads/{threadId} {
      // Only participants can read their DM threads
      allow read: if request.auth != null && 
                     request.auth.uid in resource.data.participants;
      // Only authenticated users can create DM threads
      allow create: if request.auth != null && 
                      request.auth.uid in request.resource.data.participants;
      // Only participants can update (send messages)
      allow update: if request.auth != null && 
                       request.auth.uid in resource.data.participants;
      // Only participants can delete
      allow delete: if request.auth != null && 
                       request.auth.uid in resource.data.participants;
    }
    
    // Posts collection (for future use)
    match /posts/{postId} {
      // Anyone authenticated can read posts
      allow read: if request.auth != null;
      // Only authenticated users can create posts
      allow create: if request.auth != null;
      // Only post author can update their post
      allow update: if request.auth != null && request.auth.uid == resource.data.authorId;
      // Only post author can delete their post
      allow delete: if request.auth != null && request.auth.uid == resource.data.authorId;
    }
    
    // Comments collection (for future use)
    match /comments/{commentId} {
      // Anyone authenticated can read comments
      allow read: if request.auth != null;
      // Only authenticated users can create comments
      allow create: if request.auth != null;
      // Only comment author can update their comment
      allow update: if request.auth != null && request.auth.uid == resource.data.authorId;
      // Only comment author can delete their comment
      allow delete: if request.auth != null && request.auth.uid == resource.data.authorId;
    }
  }
}
```

3. Click "Publish"

## Step 6: Restart Your Dev Server

After creating the `.env` file, restart your development server:

```bash
npm run dev
```

## User Data Structure

When users sign up, their data is stored in Firestore with this structure:

```javascript
{
  uid: "user_unique_id",
  email: "user@example.com",
  username: "username",
  major: "Computer Science",
  createdAt: "2024-01-01T00:00:00.000Z"
}
```

## Using User Data for Recommendations

You can now query users by major or other fields to make recommendations:

```javascript
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase/config';

// Get users with the same major
const q = query(
  collection(db, 'users'), 
  where('major', '==', 'Computer Science')
);
const querySnapshot = await getDocs(q);
querySnapshot.forEach((doc) => {
  console.log(doc.data());
});
```

## Important Notes

- **Never commit your `.env` file to Git!** It's already in `.gitignore`
- The `.env.example` file is safe to commit (it has no real values)
- Make sure to restart the dev server after creating/modifying `.env`
