import { AppProvider } from './context/AppContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import PostList from './components/PostList';
import TrendingSidebar from './components/TrendingSidebar';
import CreatePostModal from './components/CreatePostModal';
import PostDetail from './components/PostDetail';

function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-slate-50">
        <Header />
        
        <main className="max-w-[1400px] mx-auto px-6 py-8">
          <div className="grid grid-cols-[240px_1fr_280px] gap-8">
            <Sidebar />
            <PostList />
            <TrendingSidebar />
          </div>
        </main>

        <CreatePostModal />
        <PostDetail />
      </div>
    </AppProvider>
  );
}

export default App
