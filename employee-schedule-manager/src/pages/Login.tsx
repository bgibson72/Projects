import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { loginUser } from '@/api/mockApi';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Clear authentication state on initial mount only
    if (!isAuthenticated) {
      console.log('Login: Clearing auth state on mount');
      logout();
      localStorage.removeItem('auth-storage');
      console.log('Login: Cleared auth state, isAuthenticated =', isAuthenticated);
      console.log('Login: localStorage auth-storage =', localStorage.getItem('auth-storage'));
    }
  }, [isAuthenticated, logout]); // Run only when logout changes

  console.log('Login: isAuthenticated =', isAuthenticated);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login: handleLogin called with email:', email, 'password:', password);
    setError(''); // Clear previous errors
    try {
      console.log('Login: Calling loginUser');
      const user = await loginUser(email, password);
      console.log('Login: loginUser response:', user);
      if (user) {
        console.log('Login: User found, calling login');
        login(user);
        console.log('Login: Navigating to /dashboard');
        navigate('/dashboard', { replace: true });
      } else {
        console.log('Login: No user found');
        setError('Invalid email or password');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Login: Failed to login:', errorMessage);
      const newError = errorMessage.includes('HTML instead of JSON')
        ? 'Server error: Unable to access user data. Please check API configuration.'
        : `Login failed: ${errorMessage}`;
      setError(newError);
      console.log('Login: Set error state:', newError);
    }
    console.log('Login: handleLogin completed, error state:', error);
  };

  return (
    <div className='min-h-screen bg-bradley-gray flex items-center justify-center'>
      <div className='bg-white p-8 rounded-lg shadow-lg w-full max-w-md'>
        <h1 className='text-2xl font-bold mb-6 text-center text-bradley-dark-gray'>Login</h1>
        {error && <p className='text-bradley-red text-center mb-4'>{error}</p>}
        <form onSubmit={handleLogin} className='space-y-6'>
          <div>
            <label htmlFor='email' className='block text-sm font-medium text-bradley-dark-gray'>
              Email
            </label>
            <input
              type='email'
              id='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className='mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md shadow-sm focus:outline-none focus:ring-bradley-dark-red focus:border-bradley-dark-red'
              required
            />
          </div>
          <div>
            <label htmlFor='password' className='block text-sm font-medium text-bradley-dark-gray'>
              Password
            </label>
            <div className='relative'>
              <input
                type={showPassword ? 'text' : 'password'}
                id='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className='mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md shadow-sm focus:outline-none focus:ring-bradley-dark-red focus:border-bradley-dark-red'
                required
              />
              <button
                type='button'
                className='absolute right-2 top-1/2 transform -translate-y-1/2 text-bradley-medium-gray hover:text-bradley-dark-gray'
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <button
            type='submit'
            className='w-full bg-bradley-red text-white py-2 px-4 rounded-md hover:bg-bradley-dark-red focus:outline-none focus:ring-2 focus:ring-bradley-dark-red focus:ring-offset-2'
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
