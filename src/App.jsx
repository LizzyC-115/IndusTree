import { AppProvider } from './context/AppContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import PostList from './components/PostList';
import TrendingSidebar from './components/TrendingSidebar';
import CreatePostModal from './components/CreatePostModal';
import PostDetail from './components/PostDetail';
import DirectMessagesModal from './components/DirectMessagesModal';
import UserProfileModal from './components/UserProfileModal';

function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-slate-50">
        <Header />
        
        <main className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_280px]">
            <div className="order-2 lg:order-1">
              <Sidebar />
            </div>
            <div className="order-1 lg:order-2 min-w-0">
              <PostList />
            </div>
            <div className="order-3">
              <TrendingSidebar />
            </div>
          </div>
        </main>

        <CreatePostModal />
        <PostDetail />
        <DirectMessagesModal />
        <UserProfileModal />
      </div>
    </AppProvider>
  );
}

export default App
