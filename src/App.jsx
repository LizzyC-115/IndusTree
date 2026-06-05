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
import DirectMessagesModal from './components/DirectMessagesModal';
import UserProfileModal from './components/UserProfileModal';
import MyProfileModal from './components/MyProfileModal';
import WelcomeGuideModal from './components/WelcomeGuideModal';
import { updateUserProfile } from './firebase/auth';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isWelcomeGuideOpen, setIsWelcomeGuideOpen] = useState(false);

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

  const handleWelcomeGuideClose = async () => {
    if (!user?.uid) return;
    setIsWelcomeGuideOpen(false);
    setUser((current) => ({ ...current, welcomeGuideSeen: true }));
    const result = await updateUserProfile(user.uid, { welcomeGuideSeen: true });
    if (!result.success) {
      console.error('Failed to save welcome guide status:', result.error);
    }
  };

  // Listen for auth state changes (persists login across refreshes)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in, get their data from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.banned) {
              // Banned users are signed out immediately
              const { signOut } = await import('./firebase/auth');
              await signOut();
              setUser(null);
            } else {
              setUser({ uid: firebaseUser.uid, ...data });
            }
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
      <div className="min-h-screen bg-gradient-to-br from-rose-500 via-rose-400 to-rose-300 flex items-center justify-center">
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
    <AppProvider currentUser={user} onUserUpdate={setUser}>
      <div className="h-screen flex flex-col bg-white overflow-hidden">
        <Header
          user={user}
          onLogout={handleLogout}
        />

        {/* Main layout — fills remaining viewport height, no outer scroll */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
            <div className="h-full grid grid-cols-1 gap-8 lg:gap-10 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_280px]">
              {/* Left sidebar — fixed, scrollable content hidden scrollbar */}
              <div className="order-2 lg:order-1 sidebar-scroll flex flex-col">
                <Sidebar />
              </div>
              {/* Main feed — only scrollable column */}
              <div className="order-1 lg:order-2 min-w-0 overflow-y-auto pb-8">
                <PostList />
              </div>
              {/* Right sidebar — fixed, scrollable content hidden scrollbar */}
              <div className="order-3 sidebar-scroll flex flex-col">
                <TrendingSidebar currentUser={user} />
              </div>
            </div>
          </div>
        </div>

        <CreatePostModal />
        <PostDetail />
        <DirectMessagesModal />
        <UserProfileModal />
        <MyProfileModal />
        <button
          type="button"
          onClick={() => setIsWelcomeGuideOpen(true)}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full border border-rose-100 bg-white px-4 py-3 text-sm font-bold text-rose-600 shadow-xl shadow-slate-900/10 transition-all hover:-translate-y-0.5 hover:bg-rose-50 hover:shadow-rose-500/20"
        >
          Welcome Guide
        </button>
        {(isWelcomeGuideOpen || user.welcomeGuideSeen === false) && (
          <WelcomeGuideModal onClose={handleWelcomeGuideClose} />
        )}
      </div>
    </AppProvider>
  );
}

export default App
