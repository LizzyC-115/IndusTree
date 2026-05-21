import { useState, useRef } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { resizeImageToDataUrl } from '../firebase/auth';
import { Camera } from 'lucide-react';

export default function ProfileSurvey({ user, onComplete }) {
  const [formData, setFormData] = useState({
    major: '',
    gradYear: '',
    industry: '',
    experienceLevel: '',
    interests: '',
    goals: '',
    photoURL: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const photoInputRef = useRef(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setPhotoLoading(true);
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      setPhotoPreview(dataUrl);
      setFormData((prev) => ({ ...prev, photoURL: dataUrl }));
    } catch (err) {
      setError(err?.message || 'Could not process image — try a different file.');
    } finally {
      setPhotoLoading(false);
      // Reset the file input so picking the same (rejected) file again re-triggers onChange
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const saveData = { ...formData, profileComplete: true, updatedAt: new Date().toISOString() };
      if (!saveData.photoURL) delete saveData.photoURL;

      await updateDoc(doc(db, 'users', user.uid), saveData);

      onComplete({
        ...user,
        ...saveData,
        profileComplete: true,
      });
    } catch (err) {
      setError('Failed to save profile. Please try again.');
      setLoading(false);
    }
  };

  const fieldClass = "w-full px-5 py-4 bg-slate-100 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white transition-all placeholder:text-slate-400";
  const labelClass = "block text-sm font-semibold text-slate-700 mb-3";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-8">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto" style={{ maxWidth: '100%', overflow: 'hidden', overflowY: 'auto', overflowX: 'hidden', boxSizing: 'border-box', minWidth: 0 }}>

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 rounded-t-3xl" style={{ padding: '20px 24px', minWidth: 0, overflow: 'hidden' }}>
          <h2 className="text-2xl font-bold text-slate-800" style={{ wordBreak: 'break-word', overflowWrap: 'break-word', minWidth: 0 }}>
            Complete Your Profile
          </h2>
          <p className="text-sm text-slate-500 mt-2" style={{ marginTop: '12px', wordBreak: 'break-word', overflowWrap: 'break-word', minWidth: 0 }}>
            Help us personalize your experience and connect you with the right people
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '52px 48px', minWidth: 0, overflow: 'hidden', boxSizing: 'border-box' }}>

          {/* Profile Photo */}
          <div style={{ marginBottom: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div className="relative">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Profile preview"
                  className="w-24 h-24 rounded-full object-cover ring-4 ring-rose-100"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-rose-50 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-rose-300" />
                </div>
              )}
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={photoLoading}
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center shadow-lg hover:bg-rose-600 transition-colors disabled:opacity-50"
              >
                <Camera className="w-4 h-4 text-white" />
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>
            <p className="text-sm text-slate-500">
              {photoLoading
                ? 'Processing…'
                : photoPreview
                ? 'Looking good! Tap to change'
                : 'Add a profile photo (required)'}
            </p>
          </div>

          {/* Major */}
          <div style={{ marginBottom: '18px', minWidth: 0, overflow: 'hidden' }}>
            <label className={labelClass} style={{ marginBottom: '8px', wordBreak: 'break-word', overflowWrap: 'break-word', minWidth: 0 }}>Major / Field of Study *</label>
            <input
              type="text"
              name="major"
              value={formData.major}
              onChange={handleChange}
              placeholder="e.g., Computer Science"
              required
              className={fieldClass}
              style={{ minWidth: 0, overflow: 'hidden', boxSizing: 'border-box' }}
            />
          </div>

          {/* Graduation Year */}
          <div style={{ marginBottom: '18px', minWidth: 0, overflow: 'hidden' }}>
            <label className={labelClass} style={{ marginBottom: '8px', wordBreak: 'break-word', overflowWrap: 'break-word', minWidth: 0 }}>Expected Graduation Year *</label>
            <select
              name="gradYear"
              value={formData.gradYear}
              onChange={handleChange}
              required
              className={fieldClass}
              style={{ minWidth: 0, overflow: 'hidden', boxSizing: 'border-box' }}
            >
              <option value="">Select year</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
              <option value="2028">2028</option>
              <option value="2029">2029</option>
              <option value="2030">2030</option>
            </select>
          </div>

          {/* Industry Interest */}
          <div style={{ marginBottom: '18px', minWidth: 0, overflow: 'hidden' }}>
            <label className={labelClass} style={{ marginBottom: '8px', wordBreak: 'break-word', overflowWrap: 'break-word', minWidth: 0 }}>Industry of Interest *</label>
            <select
              name="industry"
              value={formData.industry}
              onChange={handleChange}
              required
              className={fieldClass}
              style={{ minWidth: 0, overflow: 'hidden', boxSizing: 'border-box' }}
            >
              <option value="">Select industry</option>
                  <option value="Finance">Finance</option>
                  <option value="Consulting">Consulting</option>
                  <option value="PM">PM</option>
                  <option value="SWE/Tech">SWE/Tech</option>
                  <option value="Quant">Quant</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Medicine">Medicine</option>
                  <option value="Academia">Academia</option>
            </select>
          </div>

          {/* Experience Level */}
          <div style={{ marginBottom: '18px', minWidth: 0, overflow: 'hidden' }}>
            <label className={labelClass} style={{ marginBottom: '8px', wordBreak: 'break-word', overflowWrap: 'break-word', minWidth: 0 }}>Experience Level *</label>
            <select
              name="experienceLevel"
              value={formData.experienceLevel}
              onChange={handleChange}
              required
              className={fieldClass}
              style={{ minWidth: 0, overflow: 'hidden', boxSizing: 'border-box' }}
            >
              <option value="">Select level</option>
              <option value="No Experience">No Experience</option>
              <option value="Beginner">Beginner (0-1 years)</option>
              <option value="Intermediate">Intermediate (1-3 years)</option>
              <option value="Advanced">Advanced (3+ years)</option>
            </select>
          </div>

          {/* Interests */}
          <div style={{ marginBottom: '18px', minWidth: 0, overflow: 'hidden' }}>
            <label className={labelClass} style={{ marginBottom: '8px', wordBreak: 'break-word', overflowWrap: 'break-word', minWidth: 0 }}>Topics of Interest (Optional)</label>
            <textarea
              name="interests"
              value={formData.interests}
              onChange={handleChange}
              placeholder="e.g., AI/ML, Web Development, Data Science, Career Advice..."
              rows={4}
              className={fieldClass}
              style={{ resize: 'none' }}
            />
          </div>

          {/* Goals */}
          <div style={{ marginBottom: '18px', minWidth: 0, overflow: 'hidden' }}>
            <label className={labelClass} style={{ marginBottom: '8px', wordBreak: 'break-word', overflowWrap: 'break-word', minWidth: 0 }}>What are your goals? (Optional)</label>
            <textarea
              name="goals"
              value={formData.goals}
              onChange={handleChange}
              placeholder="e.g., Find internships, network with professionals, learn new skills..."
              rows={4}
              className={fieldClass}
              style={{ resize: 'none' }}
            />
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm" style={{ marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !formData.photoURL}
            className="w-full py-4 bg-rose-500 text-white font-bold rounded-2xl hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/30 hover:shadow-rose-500/50 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minWidth: 0, overflow: 'hidden' }}
          >
            {loading ? 'Saving...' : !formData.photoURL ? 'Add a profile photo to continue' : 'Complete Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
