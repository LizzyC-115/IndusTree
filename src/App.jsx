import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase/config';
import { AppProvider } from './context/AppContext';
import Auth from './components/Auth';
import ProfileSurvey from './components/ProfileSurvey';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import PostList from './components/PostList';
import TrendingSidebar from './components/TrendingSidebar';
import CreatePostModal from './components/CreatePostModal';
import PostDetail from './components/PostDetail';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      const { signOut } = await import('./firebase/auth');
      await signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleProfileComplete = (updatedUser) => {
    setUser(updatedUser);
  };

  // Listen for auth state changes (persists login across refreshes)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in, get their data from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUser({
              uid: firebaseUser.uid,
              ...userDoc.data()
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        // User is signed out
        setUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  // Show loading screen while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-lg rounded-3xl shadow-2xl mb-4 animate-pulse">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-white text-lg font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login screen if no user
  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  // Show profile survey if user hasn't completed it (for future use)
  // Uncomment this when you want to enable the survey
  if (!user.profileComplete) {
    return <ProfileSurvey user={user} onComplete={handleProfileComplete} />;
  }

  return (
    <AppProvider>
      <div className="min-h-screen bg-slate-50">
        <Header user={user} onLogout={handleLogout} />
        
        <main className="max-w-[1400px] mx-auto px-6 py-8">
          <div className="grid grid-cols-[240px_1fr_280px] gap-8">
            <Sidebar />
            <PostList />
            <TrendingSidebar currentUser={user} />
          </div>
        </main>

        <CreatePostModal />
        <PostDetail />
      </div>
    </AppProvider>
  );
}

export default App
