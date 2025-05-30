import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { sendPasswordResetEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';

export default function Login() {
  const navigate = useNavigate();
  const { user, login, isLoading } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetVerifyPassword, setResetVerifyPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showResetNewPassword, setShowResetNewPassword] = useState(false);
  const [showResetVerifyPassword, setShowResetVerifyPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    if (user) {
      if (user.passwordResetRequired) {
        setShowResetPassword(true);
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, navigate]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Helper: map username to email (now supports Firestore lookup)
  const usernameToEmail = async (username: string) => {
    // If input looks like an email, use it directly
    if (username.includes('@')) return username;
    // Query Firestore for employee with matching username
    const q = query(collection(db, 'employees'), where('username', '==', username));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const employee = snapshot.docs[0].data();
      return employee.email;
    }
    // fallback: treat as email (will fail if not valid)
    return username;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const email = await usernameToEmail(username);
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    // Since we're using Firebase Auth, password reset will need to be handled differently
    // For now, we'll skip this as Firebase Auth typically handles password resets via email
    setShowResetPassword(false);
    navigate('/dashboard');
  };

  const handleSendResetEmail = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setResetEmailSent(false);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetEmailSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email.');
    }
  };

  const handlePasswordResetPopup = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) throw new Error('User not found.');
      if (resetNewPassword !== resetVerifyPassword) throw new Error('Passwords do not match.');
      // Re-authenticate
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      // Update password
      await updatePassword(currentUser, resetNewPassword);
      // Update Firestore flag
      await updateDoc(doc(db, 'users', currentUser.uid), { passwordResetRequired: false });
      setShowResetPassword(false);
      setCurrentPassword('');
      setResetNewPassword('');
      setResetVerifyPassword('');
      setResetLoading(false);
      navigate('/dashboard');
    } catch (err: any) {
      setResetError(err.message || 'Failed to reset password.');
      setResetLoading(false);
    }
  };

  if (isLoading) {
    return <div className="p-6 text-center text-bradley-dark-gray">Loading...</div>;
  }

  return (
    <div className="flex items-start justify-center min-h-screen bg-bradley-light-gray dark:bg-bradley-dark-bg pt-16">
      <div className="w-full max-w-md mx-auto bg-white dark:bg-bradley-dark-card rounded-lg border-2 border-bradley-medium-gray shadow-[0_6px_0_0_#939598FF] dark:border-bradley-light-gray dark:shadow-[0_6px_0_0_#E2E8F0FF] p-8 mt-16">
        <h1 className="text-3xl font-bold mb-6 text-bradley-dark-gray text-center dark:text-bradley-light-gray">Login</h1>
        {error && <p className="text-bradley-red text-sm mb-4">{error}</p>}
        {showForgotPassword ? (
          <form onSubmit={handleSendResetEmail} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-bradley-dark-gray dark:text-bradley-light-gray">Registered Email Address</label>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="mt-1 w-full px-2 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray bg-white focus:outline-none focus:ring-2 focus:ring-bradley-blue dark:text-bradley-dark-card-text dark:bg-bradley-dark-input"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2 bg-bradley-blue text-white rounded-md shadow-[0_4px_0_0_#1E3A8A] active:shadow-[0_1px_1px_0_#1E3A8A]"
            >
              Send Reset Email
            </button>
            <button
              type="button"
              className="w-full text-sm text-bradley-blue underline mt-2"
              onClick={() => {
                setShowForgotPassword(false);
                setResetEmail('');
                setResetEmailSent(false);
                setError('');
              }}
            >
              Back to Login
            </button>
            {resetEmailSent && (
              <p className="text-green-600 text-sm mt-2">Password reset email sent!</p>
            )}
          </form>
        ) : !showResetPassword ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-bradley-dark-gray dark:text-bradley-light-gray">Email</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`mt-1 w-full px-4 py-2 border border-bradley-medium-gray rounded-md bg-white dark:bg-bradley-dark-card focus:outline-none focus:ring-2 focus:ring-bradley-blue text-lg text-bradley-dark-gray dark:text-bradley-light-gray`}
                style={{ minWidth: 320 }}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-bradley-dark-gray dark:text-bradley-light-gray">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md bg-white dark:bg-bradley-dark-card focus:outline-none focus:ring-2 focus:ring-bradley-blue text-bradley-dark-gray dark:text-bradley-light-gray`}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2 bg-bradley-red text-white rounded-md shadow-[0_4px_0_0_#870F0F] active:shadow-[0_1px_1px_0_#870F0F]"
            >
              Login
            </button>
            <button
              type="button"
              className="w-full text-sm text-bradley-blue underline mt-2"
              onClick={() => {
                setShowForgotPassword(true);
                setError('');
                setResetEmail('');
                setResetEmailSent(false);
              }}
            >
              Forgot password?
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasswordResetPopup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-bradley-dark-gray">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray bg-white focus:outline-none focus:ring-2 focus:ring-bradley-blue"
                  required
                />
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-bradley-dark-gray"
                  onClick={() => setShowCurrentPassword(v => !v)}
                >
                  {showCurrentPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.956 9.956 0 012.223-3.592m3.1-2.727A9.956 9.956 0 0112 5c4.478 0 8.268 2.943 9.542 7a9.973 9.973 0 01-4.293 5.411M15 12a3 3 0 11-6 0 3 3 0 016 0zm6 6L6 6" /></svg>
                  )}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-bradley-dark-gray">New Password</label>
              <div className="relative">
                <input
                  type={showResetNewPassword ? 'text' : 'password'}
                  value={resetNewPassword}
                  onChange={e => setResetNewPassword(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray bg-white focus:outline-none focus:ring-2 focus:ring-bradley-blue"
                  required
                />
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-bradley-dark-gray"
                  onClick={() => setShowResetNewPassword(v => !v)}
                >
                  {showResetNewPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.956 9.956 0 012.223-3.592m3.1-2.727A9.956 9.956 0 0112 5c4.478 0 8.268 2.943 9.542 7a9.973 9.973 0 01-4.293 5.411M15 12a3 3 0 11-6 0 3 3 0 016 0zm6 6L6 6" /></svg>
                  )}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-bradley-dark-gray">Verify New Password</label>
              <div className="relative">
                <input
                  type={showResetVerifyPassword ? 'text' : 'password'}
                  value={resetVerifyPassword}
                  onChange={e => setResetVerifyPassword(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray bg-white focus:outline-none focus:ring-2 focus:ring-bradley-blue"
                  required
                />
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-bradley-dark-gray"
                  onClick={() => setShowResetVerifyPassword(v => !v)}
                >
                  {showResetVerifyPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.956 9.956 0 012.223-3.592m3.1-2.727A9.956 9.956 0 0112 5c4.478 0 8.268 2.943 9.542 7a9.973 9.973 0 01-4.293 5.411M15 12a3 3 0 11-6 0 3 3 0 016 0zm6 6L6 6" /></svg>
                  )}
                </span>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-bradley-red text-white rounded-md shadow-[0_4px_0_0_#870F0F] active:shadow-[0_1px_1px_0_#870F0F]"
                disabled={resetLoading}
              >
                {resetLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
            {resetError && <p className="text-bradley-red text-sm mt-2">{resetError}</p>}
          </form>
        )}
      </div>
      {showResetPassword && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white text-bradley-dark-gray p-6 rounded-lg border border-bradley-medium-gray shadow-bradley max-w-md mx-auto dark:bg-bradley-dark-card dark:text-bradley-dark-card-text dark:border-bradley-light-border">
            <h2 className="text-xl font-bold mb-4">Set New Password</h2>
            <form onSubmit={handlePasswordResetPopup} className="space-y-4">
              {resetError && <p className="text-bradley-red text-sm mb-2">{resetError}</p>}
              <div>
                <label className="block text-sm font-medium text-bradley-dark-gray">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray bg-white focus:outline-none focus:ring-2 focus:ring-bradley-blue"
                    required
                  />
                  <span
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-bradley-dark-gray"
                    onClick={() => setShowCurrentPassword(v => !v)}
                  >
                    {showCurrentPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.956 9.956 0 012.223-3.592m3.1-2.727A9.956 9.956 0 0112 5c4.478 0 8.268 2.943 9.542 7a9.973 9.973 0 01-4.293 5.411M15 12a3 3 0 11-6 0 3 3 0 016 0zm6 6L6 6" /></svg>
                    )}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-bradley-dark-gray">New Password</label>
                <div className="relative">
                  <input
                    type={showResetNewPassword ? 'text' : 'password'}
                    value={resetNewPassword}
                    onChange={e => setResetNewPassword(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray bg-white focus:outline-none focus:ring-2 focus:ring-bradley-blue"
                    required
                  />
                  <span
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-bradley-dark-gray"
                    onClick={() => setShowResetNewPassword(v => !v)}
                  >
                    {showResetNewPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.956 9.956 0 012.223-3.592m3.1-2.727A9.956 9.956 0 0112 5c4.478 0 8.268 2.943 9.542 7a9.973 9.973 0 01-4.293 5.411M15 12a3 3 0 11-6 0 3 3 0 016 0zm6 6L6 6" /></svg>
                    )}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-bradley-dark-gray">Verify New Password</label>
                <div className="relative">
                  <input
                    type={showResetVerifyPassword ? 'text' : 'password'}
                    value={resetVerifyPassword}
                    onChange={e => setResetVerifyPassword(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray bg-white focus:outline-none focus:ring-2 focus:ring-bradley-blue"
                    required
                  />
                  <span
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-bradley-dark-gray"
                    onClick={() => setShowResetVerifyPassword(v => !v)}
                  >
                    {showResetVerifyPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.956 9.956 0 012.223-3.592m3.1-2.727A9.956 9.956 0 0112 5c4.478 0 8.268 2.943 9.542 7a9.973 9.973 0 01-4.293 5.411M15 12a3 3 0 11-6 0 3 3 0 016 0zm6 6L6 6" /></svg>
                    )}
                  </span>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-bradley-red text-white rounded-md shadow-[0_4px_0_0_#870F0F] active:shadow-[0_1px_1px_0_#870F0F]"
                  disabled={resetLoading}
                >
                  {resetLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}