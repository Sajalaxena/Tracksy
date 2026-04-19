import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { useTheme } from '../context/ThemeContext';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';

export default function ProfilePage() {
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const { dark, toggle } = useTheme();

  const [displayName, setDisplayName] = useState(profile.displayName || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [saved, setSaved] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileRef = useRef(null);

  async function uploadToCloudinary(file) {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      setUploadError(
        'Cloudinary not configured. Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to client/.env'
      );
      return;
    }

    setUploading(true);
    setUploadError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', 'tracksy-avatars');

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: formData }
      );

      if (!res.ok) throw new Error('Upload failed');

      const data = await res.json();
      updateProfile({ avatar: data.secure_url });
    } catch {
      setUploadError('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  function handleImageFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    uploadToCloudinary(file);
  }

  function handleFileChange(e) {
    handleImageFile(e.target.files[0]);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleImageFile(e.dataTransfer.files[0]);
  }

  function handleSave(e) {
    e.preventDefault();
    updateProfile({ displayName: displayName.trim(), bio: bio.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function removeAvatar() {
    updateProfile({ avatar: null });
  }

  const avatarLetter = (displayName || user?.email || 'U')[0].toUpperCase();

  return (
    <div className="flex h-screen page-bg overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <header className="header-bar px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3">
          <div>
            <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Profile</h1>
            <p className="text-xs text-gray-400 hidden sm:block">Manage your account settings</p>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-4 sm:space-y-6 pb-24 md:pb-8 animate-fade-in-up">

          {/* Avatar card */}
          <div className="card p-6">
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-5 uppercase tracking-wide">
              Profile Photo
            </h2>

            <div className="flex items-center gap-6">
              {/* Avatar preview */}
              <div className="relative flex-shrink-0">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt="Profile"
                    className="w-20 h-20 rounded-2xl object-cover shadow-md ring-4 ring-indigo-500/20"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md ring-4 ring-indigo-500/20">
                    <span className="text-white text-3xl font-bold">{avatarLetter}</span>
                  </div>
                )}

                {/* Upload spinner overlay */}
                {uploading && (
                  <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center">
                    <svg
                      className="animate-spin w-6 h-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                  </div>
                )}

                {profile.avatar && !uploading && (
                  <button
                    onClick={removeAvatar}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
                    title="Remove photo"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Drop zone */}
              <div className="flex-1 flex flex-col gap-2">
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => !uploading && fileRef.current?.click()}
                  className={[
                    'border-2 border-dashed rounded-xl p-5 text-center transition-all',
                    uploading
                      ? 'opacity-60 cursor-not-allowed border-gray-200 dark:border-gray-700'
                      : 'cursor-pointer',
                    !uploading && dragOver
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : !uploading
                      ? 'border-gray-200 dark:border-gray-700 hover:border-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      : '',
                  ].join(' ')}
                >
                  <div className="text-3xl mb-2">{uploading ? '⏳' : '📸'}</div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {uploading
                      ? 'Uploading…'
                      : <>Drop an image here or <span className="text-indigo-500 font-semibold">browse</span></>}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF up to 5MB</p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                </div>

                {/* Upload error */}
                {uploadError && (
                  <p className="text-xs text-red-500 dark:text-red-400">{uploadError}</p>
                )}
              </div>
            </div>
          </div>

          {/* Info card */}
          <div className="card p-6">
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-5 uppercase tracking-wide">
              Account Info
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Email — read only */}
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  Email address
                </label>
                <div className="input-base opacity-60 cursor-not-allowed select-all">
                  {user?.email || '—'}
                </div>
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
              </div>

              {/* Display name */}
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  Display name
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="How should we call you?"
                  className="input-base w-full"
                  maxLength={40}
                />
              </div>

              {/* Bio */}
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  Bio <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us a bit about yourself…"
                  rows={3}
                  maxLength={160}
                  className="input-base w-full resize-none"
                />
                <p className="text-xs text-gray-400 mt-1 text-right">{bio.length}/160</p>
              </div>

              <button
                type="submit"
                className={[
                  'w-full py-3 rounded-xl text-sm font-semibold text-white transition-all shadow-md active:scale-[0.98]',
                  saved
                    ? 'bg-emerald-500 shadow-emerald-200'
                    : 'bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 hover:shadow-lg',
                ].join(' ')}
              >
                {saved ? '✓ Saved!' : 'Save Changes'}
              </button>
            </form>
          </div>

          {/* Appearance card */}
          <div className="card p-6">
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-5 uppercase tracking-wide">
              Appearance
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Dark Mode</p>
                <p className="text-xs text-gray-400 mt-0.5">Switch between light and dark theme</p>
              </div>
              {/* Toggle switch */}
              <button
                type="button"
                onClick={toggle}
                className={[
                  'relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2',
                  dark ? 'bg-indigo-500' : 'bg-gray-200',
                ].join(' ')}
                role="switch"
                aria-checked={dark}
              >
                <span
                  className={[
                    'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300',
                    dark ? 'translate-x-6' : 'translate-x-0',
                  ].join(' ')}
                />
              </button>
            </div>
          </div>

          {/* Stats card */}
          <div className="card p-6">
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">
              Account
            </h2>
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Verified account</p>
                <p className="text-xs text-gray-400">{user?.email}</p>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  );
}
