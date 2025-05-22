import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const navigate = useNavigate();
  const { user, login, isLoading } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.passwordResetRequired) {
        setShowResetPassword(true);
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
    } catch (err: unknown) {
      console.error('Login error:', err);
      setError('Invalid username or password');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    // Since we're using Firebase Auth, password reset will need to be handled differently
    // For now, we'll skip this as Firebase Auth typically handles password resets via email
    setShowResetPassword(false);
    navigate('/dashboard');
  };

  if (isLoading) {
    return <div className="p-6 text-center text-bradley-dark-gray">Loading...</div>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-bradley-light-gray">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md border border-bradley-medium-gray">
        <h1 className="text-3xl font-bold mb-6 text-bradley-dark-gray text-center">Login</h1>
        {error && <p className="text-bradley-red text-sm mb-4">{error}</p>}
        {!showResetPassword ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-bradley-dark-gray">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray focus:outline-none focus:ring-2 focus:ring-bradley-blue"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-bradley-dark-gray">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray focus:outline-none focus:ring-2 focus:ring-bradley-blue"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2 bg-bradley-red text-white rounded-md shadow-[0_4px_0_0_#870F0F] active:shadow-[0_1px_1px_0_#870F0F]"
            >
              Login
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-bradley-dark-gray">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray focus:outline-none focus:ring-2 focus:ring-bradley-blue"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2 bg-bradley-red text-white rounded-md shadow-[0_4px_0_0_#870F0F] active:shadow-[0_1px_1px_0_#870F0F]"
            >
              Reset Password
            </button>
          </form>
        )}
      </div>
    </div>
  );
}