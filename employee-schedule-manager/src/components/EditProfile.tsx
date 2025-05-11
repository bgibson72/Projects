import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { updateProfile } from '@/api/mockApi';

export default function EditProfile() {
  const { user } = useAuthStore();
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    position: user?.position || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (user) {
        await updateProfile(user.id, form);
        console.log('Profile updated:', form);
      }
    } catch {
      console.error('Failed to update profile');
    }
  };

  return (
    <div className='bg-white p-6 rounded-lg shadow-lg'>
      <h1 className='text-3xl font-bold mb-6'>Edit Profile</h1>
      <form onSubmit={handleSubmit} className='space-y-4'>
        <div>
          <label className='block text-sm font-medium text-gray-700'>Last Name</label>
          <input
            type='text'
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            className='mt-1 w-full px-3 py-2 border border-gray-300 rounded-md'
            required
          />
        </div>
        <div>
          <label className='block text-sm font-medium text-gray-700'>First Name</label>
          <input
            type='text'
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            className='mt-1 w-full px-3 py-2 border border-gray-300 rounded-md'
            required
          />
        </div>
        <div>
          <label className='block text-sm font-medium text-gray-700'>Position</label>
          <input
            type='text'
            value={form.position}
            onChange={(e) => setForm({ ...form, position: e.target.value })}
            className='mt-1 w-full px-3 py-2 border border-gray-300 rounded-md'
            required
          />
        </div>
        <div>
          <label className='block text-sm font-medium text-gray-700'>Email</label>
          <input
            type='email'
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className='mt-1 w-full px-3 py-2 border border-gray-300 rounded-md'
            required
          />
        </div>
        <div>
          <label className='block text-sm font-medium text-gray-700'>Phone</label>
          <input
            type='tel'
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className='mt-1 w-full px-3 py-2 border border-gray-300 rounded-md'
          />
        </div>
        <div>
          <label className='block text-sm font-medium text-gray-700'>Color (Admin Only)</label>
          <input
            type='text'
            value={user?.color || '#60A5FA'}
            disabled
            className='mt-1 w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100'
          />
        </div>
        <div>
          <label className='block text-sm font-medium text-gray-700'>ID Number (Admin Only)</label>
          <input
            type='text'
            value={user?.idNumber || 'EMPXXX'}
            disabled
            className='mt-1 w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100'
          />
        </div>
        <button
          type='submit'
          className='w-full bg-bradley-accent text-white py-2 px-4 rounded-md hover:bg-bradley-blue'
        >
          Save Profile
        </button>
      </form>
    </div>
  );
}
