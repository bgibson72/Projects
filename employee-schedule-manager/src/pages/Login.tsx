import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3001/api/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const users = await response.json();
      const user = users.find((u: any) => u.email === email && u.password === password);
      if (user) {
        login(user);
        navigate('/dashboard');
      } else {
        setError('Invalid email or password');
      }
    } catch (err: unknown) {
      setError('An error occurred. Please try again.');
      console.error('Login error:', err);
    }
  };

  return (
    <div className='flex items-center justify-center min-h-screen bg-bradley-light-gray'>
      <div className='bg-white p-8 rounded-lg shadow-lg w-full max-w-md'>
        <h1 className='text-3xl font-bold mb-6 text-bradley-dark-gray text-center'>Login</h1>
        {error && <p className='text-bradley-red mb-4 text-center'>{error}</p>}
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-bradley-dark-gray'>Email</label>
            <input
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className='mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray focus:ring-bradley-dark-red focus:border-bradley-dark-red'
              required
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-bradley-dark-gray'>Password</label>
            <input
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className='mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray focus:ring-bradley-dark-red focus:border-bradley-dark-red'
              required
            />
          </div>
          <div className='flex justify-center'>
            <button
              type='submit'
              className='block bg-bradley-red text-white py-2 px-4 rounded-md shadow-[0_4px_0_0_#870F0F]'
            >
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}