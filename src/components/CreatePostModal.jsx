import { useState } from 'react';
import { X, Send } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { categories } from '../data/mockData';

export default function CreatePostModal() {
  const { isCreateModalOpen, setIsCreateModalOpen, addPost } = useApp();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('finance');

  if (!isCreateModalOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    addPost({
      title: title.trim(),
      content: content.trim(),
      category,
      author: 'You',
      avatar: 'U',
    });

    setTitle('');
    setContent('');
    setCategory('finance');
    setIsCreateModalOpen(false);
  };

  const handleClose = () => {
    setIsCreateModalOpen(false);
    setTitle('');
    setContent('');
    setCategory('finance');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl" style={{ padding: '3px' }}>
        <div className="rounded-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100" style={{ padding: '20px 24px' }}>
          <h2 className="text-xl font-bold text-slate-800">Start a Discussion</h2>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px' }}>
          {/* Industry */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Industry
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            >
              {categories.filter(c => c.id !== 'all').map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What would you like to discuss?"
              className="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Content */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts, questions, or insights..."
              rows={6}
              className="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none placeholder:text-slate-400"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 flex-wrap">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !content.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-violet-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              Post Discussion
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
