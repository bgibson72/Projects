import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const MyProfile: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.photoUrl || '');
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  if (!user) {
    return <div className="p-8">Loading...</div>;
  }

  // Profile fields (all non-editable, role and color removed)
  const profileFields = [
    { label: 'First Name', value: user.firstName || '' },
    { label: 'Last Name', value: user.lastName || '' },
    { label: 'Username', value: user.username || '' },
    { label: 'Email', value: user.email || '' },
    { label: 'Phone', value: user.phone || '' },
    { label: 'Position', value: user.position || '' },
  ];

  // Password change logic
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    if (!newPassword || !confirmPassword) {
      setPasswordError('Please enter and confirm your new password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        setPasswordSuccess('Password updated successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError('User not authenticated.');
      }
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  // Helper: get initials
  const getInitials = (first: string, last: string) => {
    return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase();
  };

  // Helper: get color
  const getColor = () => user?.color || '#8884d8';

  // Handle avatar update from modal
  const handleAvatarUpdate = async (file: File) => {
    if (!user || !auth.currentUser) return;
    setAvatarLoading(true);
    setAvatarError('');
    try {
      const storage = getStorage();
      const uid = auth.currentUser.uid;
      console.log('[AvatarUpload] Firebase Auth UID:', uid);
      console.log('[AvatarUpload] Firestore user.id:', user.id);
      const fileRef = storageRef(storage, `profilePictures/${uid}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      try {
        await updateDoc(doc(db, 'employees', user.id), { photoUrl: url });
        // Fetch updated user doc and update local state
        const updatedDoc = await (await import('firebase/firestore')).getDoc(doc(db, 'employees', user.id));
        if (updatedDoc.exists()) {
          const updatedUser = { ...user, ...updatedDoc.data(), id: user.id };
          if (typeof useAuthStore.setState === 'function') {
            useAuthStore.setState({ user: updatedUser });
          }
        }
      } catch (firestoreErr: any) {
        console.error('[AvatarUpload] Firestore update error:', firestoreErr);
        setAvatarError('Photo uploaded, but failed to update profile: ' + (firestoreErr.message || firestoreErr.code || 'Unknown error'));
        return;
      }
      setAvatarUrl(url);
      setShowPhotoModal(false);
    } catch (err: any) {
      console.error('[AvatarUpload] Storage upload error:', err);
      setAvatarError(err.message || 'Failed to upload photo.');
    } finally {
      setAvatarLoading(false);
    }
  };

  // Handle avatar removal
  const handleAvatarRemove = async () => {
    if (!user || !auth.currentUser) return;
    setAvatarLoading(true);
    setAvatarError('');
    try {
      const storage = getStorage();
      const uid = auth.currentUser.uid;
      const fileRef = storageRef(storage, `profilePictures/${uid}`);
      await deleteObject(fileRef);
      await updateDoc(doc(db, 'employees', user.id), { photoUrl: '' });
      setAvatarUrl('');
      setShowPhotoModal(false);
    } catch (err: any) {
      setAvatarError(err.message || 'Failed to remove photo.');
    } finally {
      setAvatarLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 p-8 max-w-4xl w-full mx-auto">
      {/* Profile Info (Wider Card) */}
      <div className="bg-white text-bradley-dark-gray p-6 rounded-lg border border-bradley-medium-gray shadow-bradley max-w-xl mx-auto dark:bg-bradley-dark-card dark:text-bradley-dark-card-text dark:border-bradley-dark-border">
        <div className="flex items-center justify-between p-6 border-b border-bradley-medium-gray dark:border-bradley-dark-border">
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border-4 border-white shadow"
                />
              ) : (
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold shadow"
                  style={{ background: getColor(), color: '#fff' }}
                >
                  {getInitials(user.firstName || '', user.lastName || '')}
                </div>
              )}
              <button
                className="absolute bottom-0 right-0 bg-bradley-red text-white rounded-full p-1 shadow hover:bg-bradley-dark-red transition"
                style={{ transform: 'translate(25%, 25%)' }}
                onClick={() => setShowPhotoModal(true)}
                aria-label="Edit Photo"
                type="button"
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M15.232 5.232a3 3 0 1 1 4.243 4.243L7.5 21H3v-4.5L15.232 5.232Z"/></svg>
              </button>
            </div>
            <h2 className="text-xl font-semibold text-bradley-dark-gray">My Profile</h2>
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-bradley-red text-white rounded-md shadow-[0_4px_0_0_#870F0F] hover:bg-bradley-dark-red transition"
            onClick={() => setShowPasswordForm(v => !v)}
            aria-label="Change Password"
          >
            <Lock size={20} />
            <span className="hidden sm:inline">Change Password</span>
          </button>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {profileFields.map((field) => (
              <div key={field.label} className="flex flex-col">
                <label className="text-sm font-medium text-gray-600">{field.label}</label>
                <input
                  className="bg-gray-100 border border-gray-200 rounded px-3 py-2 text-gray-700 cursor-not-allowed"
                  value={field.value}
                  readOnly
                  disabled
                />
              </div>
            ))}
          </div>
          <div className="mt-6 text-sm text-gray-500 bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded dark:bg-yellow-900/30 dark:border-yellow-700">
            To update your profile information, please contact your administrator.
          </div>
        </div>
        {/* Change Password Form (collapsible) */}
        {showPasswordForm && (
          <div className="p-6 border-t border-bradley-medium-gray bg-bradley-light-gray/30 dark:bg-bradley-dark-card/70 dark:border-bradley-dark-border">
            <form className="space-y-4" onSubmit={handlePasswordChange}>
              <div className="flex flex-col relative">
                <label className="text-sm font-medium text-gray-600">New Password</label>
                <input
                  type={showNew ? 'text' : 'password'}
                  className="border rounded px-3 py-2 pr-10 bg-white dark:bg-bradley-dark-input dark:text-bradley-dark-card-text border-gray-200 dark:border-bradley-dark-border"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-9 text-bradley-dark-gray"
                  tabIndex={-1}
                  onClick={() => setShowNew(v => !v)}
                  style={{ top: '38px' }}
                >
                  {showNew ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <div className="flex flex-col relative">
                <label className="text-sm font-medium text-gray-600">Confirm New Password</label>
                <input
                  type={showVerify ? 'text' : 'password'}
                  className="border rounded px-3 py-2 pr-10 bg-white dark:bg-bradley-dark-input dark:text-bradley-dark-card-text border-gray-200 dark:border-bradley-dark-border"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-9 text-bradley-dark-gray"
                  tabIndex={-1}
                  onClick={() => setShowVerify(v => !v)}
                  style={{ top: '38px' }}
                >
                  {showVerify ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {passwordError && <div className="text-red-600 text-sm">{passwordError}</div>}
              {passwordSuccess && <div className="text-green-600 text-sm">{passwordSuccess}</div>}
              <button type="submit" disabled={loading} className="w-full px-4 py-2 bg-bradley-red text-white rounded-md shadow-[0_4px_0_0_#870F0F] active:shadow-[0_1px_1px_0_#870F0F]">
                {loading ? 'Updating...' : 'Change Password'}
              </button>
            </form>
          </div>
        )}
      </div>
      {/* Avatar Upload Modal */}
      {showPhotoModal && (
        <AvatarUploadModal
          onClose={() => setShowPhotoModal(false)}
          onUpload={handleAvatarUpdate}
          onRemove={handleAvatarRemove}
          loading={avatarLoading}
          error={avatarError}
          currentUrl={avatarUrl}
        />
      )}
    </div>
  );
};

export default MyProfile;

// AvatarUploadModal component
function AvatarUploadModal({ onClose, onUpload, onRemove, loading, error, currentUrl }: any) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>(currentUrl || '');

  useEffect(() => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }, [file]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={onClose} aria-label="Close">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
        <h3 className="text-lg font-semibold mb-4">Update Profile Photo</h3>
        <div className="flex flex-col items-center gap-4">
          {preview ? (
            <img src={preview} alt="Preview" className="w-24 h-24 rounded-full object-cover border-2 border-bradley-medium-gray" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-3xl text-gray-400">
              <svg width="40" height="40" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5Z"/></svg>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            id="avatar-upload-input"
            onChange={e => setFile(e.target.files?.[0] || null)}
            disabled={loading}
          />
          <label htmlFor="avatar-upload-input" className="px-4 py-2 bg-bradley-red text-white rounded-md shadow-[0_4px_0_0_#870F0F] hover:bg-bradley-dark-red cursor-pointer">
            Choose Photo
          </label>
          {file && (
            <button
              className="px-4 py-2 bg-bradley-light-gray text-bradley-dark-gray rounded-md shadow-[0_4px_0_0_#939598] hover:bg-bradley-dark-gray hover:text-white"
              onClick={async () => {
                try {
                  await onUpload(file);
                } catch (err: any) {
                  console.error('Avatar upload failed:', err);
                }
              }}
              disabled={loading}
            >
              {loading ? 'Uploading...' : 'Save Photo'}
            </button>
          )}
          {currentUrl && !file && (
            <button
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md shadow hover:bg-gray-300"
              onClick={onRemove}
              disabled={loading}
            >
              Remove Photo
            </button>
          )}
          {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
        </div>
      </div>
    </div>
  );
}
