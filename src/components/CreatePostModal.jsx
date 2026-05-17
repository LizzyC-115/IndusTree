import { useState, useRef } from 'react';
import { X, Send, ImageIcon, XCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { categories } from '../data/mockData';
import { resizeImageToDataUrl } from '../firebase/auth';

export default function CreatePostModal() {
  const { isCreateModalOpen, setIsCreateModalOpen, addPost } = useApp();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('finance');
  const [imageURL, setImageURL] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const imageInputRef = useRef(null);

  if (!isCreateModalOpen) return null;

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageLoading(true);
    try {
      const dataUrl = await resizeImageToDataUrl(file, 600, 0.72);
      setImageURL(dataUrl);
    } catch {
      // silently ignore bad files
    } finally {
      setImageLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    addPost({
      title: title.trim(),
      content: content.trim(),
      category,
      author: 'You',
      avatar: 'U',
      imageURL: imageURL || null,
    });

    setTitle('');
    setContent('');
    setCategory('finance');
    setImageURL(null);
    setIsCreateModalOpen(false);
  };

  const handleClose = () => {
    setIsCreateModalOpen(false);
    setTitle('');
    setContent('');
    setCategory('finance');
    setImageURL(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl"
        style={{ padding: '24px', maxWidth: '100%', overflow: 'hidden', boxSizing: 'border-box', minWidth: 0 }}
      >
        <div className="rounded-2xl border border-slate-100 overflow-hidden" style={{ maxWidth: '100%', overflow: 'hidden', boxSizing: 'border-box', minWidth: 0 }}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100" style={{ padding: '20px 24px', minWidth: 0, overflow: 'hidden' }}>
          <h2 className="text-xl font-bold text-slate-800" style={{ wordBreak: 'break-word', overflowWrap: 'break-word', minWidth: 0 }}>
            Start a Discussion
          </h2>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
            style={{ minWidth: 0, overflow: 'hidden' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', minWidth: 0, overflow: 'hidden', boxSizing: 'border-box' }}>
          {/* Industry */}
          <div className="mb-5" style={{ marginBottom: '18px', minWidth: 0, overflow: 'hidden' }}>
            <label className="block text-sm font-semibold text-slate-700 mb-2" style={{ marginBottom: '8px', wordBreak: 'break-word', overflowWrap: 'break-word', minWidth: 0 }}>
              Industry
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              style={{ minWidth: 0, overflow: 'hidden', boxSizing: 'border-box' }}
            >
              {categories.filter(c => c.id !== 'all').map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div className="mb-5" style={{ marginBottom: '18px', minWidth: 0, overflow: 'hidden' }}>
            <label className="block text-sm font-semibold text-slate-700 mb-2" style={{ marginBottom: '8px', wordBreak: 'break-word', overflowWrap: 'break-word', minWidth: 0 }}>
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What would you like to discuss?"
              className="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
              style={{ minWidth: 0, overflow: 'hidden', boxSizing: 'border-box' }}
            />
          </div>

          {/* Content */}
          <div className="mb-6" style={{ marginBottom: '18px', minWidth: 0, overflow: 'hidden' }}>
            <label className="block text-sm font-semibold text-slate-700 mb-2" style={{ marginBottom: '8px', wordBreak: 'break-word', overflowWrap: 'break-word', minWidth: 0 }}>
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts, questions, or insights..."
              rows={6}
              className="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none placeholder:text-slate-400"
              style={{ minWidth: 0, overflow: 'hidden', boxSizing: 'border-box' }}
            />
          </div>

          {/* Image upload */}
          <div style={{ marginBottom: '18px' }}>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleImageChange}
            />
            {imageURL ? (
              <div className="relative rounded-xl overflow-hidden">
                <img src={imageURL} alt="Post attachment" className="w-full max-h-48 object-cover rounded-xl" />
                <button
                  type="button"
                  onClick={() => setImageURL(null)}
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={imageLoading}
                className="flex items-center gap-2 px-4 py-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl border border-dashed border-slate-200 hover:border-indigo-300 transition-all text-sm font-medium disabled:opacity-50"
              >
                <ImageIcon className="w-4 h-4" />
                {imageLoading ? 'Processing…' : 'Add a photo'}
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 flex-wrap" style={{ padding: '16px 0 0', minWidth: 0, overflow: 'hidden' }}>
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-all"
              style={{ minWidth: 0, overflow: 'hidden' }}
            >
              <span style={{ wordBreak: 'break-word', overflowWrap: 'break-word', minWidth: 0 }}>Cancel</span>
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !content.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-violet-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ minWidth: 0, overflow: 'hidden' }}
            >
              <Send className="w-4 h-4" />
              <span
                style={{
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '100%',
                  display: 'block',
                }}
              >
                Post Discussion
              </span>
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
