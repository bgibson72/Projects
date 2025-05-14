import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    password: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        password: '',
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const updates = {
        ...user,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        ...(formData.password && { password: formData.password }),
      };
      const response = await fetch(`http://localhost:3001/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update user');
      updateUser(updates);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError('Failed to update profile. Please try again.');
      console.error('EditProfile: Failed to update user:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (!user) {
    return null;
  }

  return (
    <div className='bg-white p-6 rounded-lg shadow-lg'>
      <h1 className='text-3xl font-bold mb-6 text-bradley-dark-gray'>Edit Profile</h1>
      {error && <p className='text-bradley-red mb-4'>{error}</p>}
      <form onSubmit={handleSubmit} className='space-y-4'>
        <div>
          <label className='block text-sm font-medium text-bradley-dark-gray'>Name</label>
          <input
            type='text'
            name='name'
            value={formData.name}
            onChange={handleInputChange}
            className='mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray'
            required
          />
        </div>
        <div>
          <label className='block text-sm font-medium text-bradley-dark-gray'>Email</label>
          <input
            type='email'
            name='email'
            value={formData.email}
            onChange={handleInputChange}
            className='mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray'
            required
          />
        </div>
        <div>
          <label className='block text-sm font-medium text-bradley-dark-gray'>Phone</label>
          <input
            type='text'
            name='phone'
            value={formData.phone}
            onChange={handleInputChange}
            className='mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray'
          />
        </div>
        <div>
          <label className='block text-sm font-medium text-bradley-dark-gray'>New Password (optional)</label>
          <input
            type='password'
            name='password'
            value={formData.password}
            onChange={handleInputChange}
            className='mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray'
            placeholder='Leave blank to keep current password'
          />
        </div>
        <div className='flex justify-end space-x-2'>
          <button
            type='button'
            className='px-4 py-2 bg-bradley-light-gray text-bradley-dark-gray rounded-md shadow-[0_4px_0_0_#939598] active:shadow-[0_1px_1px_0_#939598]'
            onClick={() => navigate('/dashboard')}
          >
            Cancel
          </button>
          <button
            type='submit'
            className='px-4 py-2 bg-[#f7695f] text-white rounded-md shadow-[0_4px_0_0_#b71c1c] active:shadow-[0_1px_1px_0_#b71c1c]'
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}