import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function ProfileSurvey({ user, onComplete }) {
  const [formData, setFormData] = useState({
    major: '',
    gradYear: '',
    industry: '',
    experienceLevel: '',
    interests: '',
    goals: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Update user profile in Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        ...formData,
        profileComplete: true,
        updatedAt: new Date().toISOString(),
      });

      onComplete({
        ...user,
        ...formData,
        profileComplete: true,
      });
    } catch (err) {
      setError('Failed to save profile. Please try again.');
      setLoading(false);
    }
  };

  const fieldClass = "w-full px-5 py-4 bg-slate-100 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all placeholder:text-slate-400";
  const labelClass = "block text-sm font-semibold text-slate-700 mb-3";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-8">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 rounded-t-3xl" style={{ padding: '26px 36px 20px' }}>
          <h2 className="text-2xl font-bold text-slate-800">Complete Your Profile</h2>
          <p className="text-sm text-slate-500 mt-2">
            Help us personalize your experience and connect you with the right people
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '26px 36px 32px' }}>

          {/* Major */}
          <div style={{ marginBottom: '20px' }}>
            <label className={labelClass}>Major / Field of Study *</label>
            <input
              type="text"
              name="major"
              value={formData.major}
              onChange={handleChange}
              placeholder="e.g., Computer Science"
              required
              className={fieldClass}
            />
          </div>

          {/* Graduation Year */}
          <div style={{ marginBottom: '20px' }}>
            <label className={labelClass}>Expected Graduation Year *</label>
            <select
              name="gradYear"
              value={formData.gradYear}
              onChange={handleChange}
              required
              className={fieldClass}
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
          <div style={{ marginBottom: '20px' }}>
            <label className={labelClass}>Industry of Interest *</label>
            <select
              name="industry"
              value={formData.industry}
              onChange={handleChange}
              required
              className={fieldClass}
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
          <div style={{ marginBottom: '20px' }}>
            <label className={labelClass}>Experience Level *</label>
            <select
              name="experienceLevel"
              value={formData.experienceLevel}
              onChange={handleChange}
              required
              className={fieldClass}
            >
              <option value="">Select level</option>
              <option value="No Experience">No Experience</option>
              <option value="Beginner">Beginner (0-1 years)</option>
              <option value="Intermediate">Intermediate (1-3 years)</option>
              <option value="Advanced">Advanced (3+ years)</option>
            </select>
          </div>

          {/* Interests */}
          <div style={{ marginBottom: '20px' }}>
            <label className={labelClass}>Topics of Interest (Optional)</label>
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
          <div style={{ marginBottom: '26px' }}>
            <label className={labelClass}>What are your goals? (Optional)</label>
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
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-2xl hover:from-indigo-700 hover:to-violet-700 transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Complete Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
