import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Eye, EyeOff } from 'lucide-react';

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const [personalFormData, setPersonalFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
  });
  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: '',
    newPassword: '',
    verifyPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showVerifyPassword, setShowVerifyPassword] = useState(false);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);

  useEffect(() => {
    if (user) {
      const [firstName, lastName] = user.name.split(' ');
      setPersonalFormData({
        firstName: firstName || '',
        lastName: lastName || '',
        phone: user.phone || '',
        email: user.email,
      });
    }
  }, [user]);

  const handlePersonalInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPersonalFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePersonalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const updates = {
        ...user,
        name: `${personalFormData.firstName} ${personalFormData.lastName}`,
        phone: personalFormData.phone,
      };
      const response = await fetch(`/api/employees/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update employee');
      updateUser(updates);
      setError('');
      navigate('/dashboard');
    } catch (err: unknown) {
      setError('Failed to update profile. Please try again.');
      console.error('EditProfile: Failed to update employee:', err);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (passwordFormData.newPassword !== passwordFormData.verifyPassword) {
      setPasswordError('New password and verify password do not match.');
      return;
    }
    if (passwordFormData.currentPassword !== user.password) {
      setPasswordError('Current password is incorrect.');
      return;
    }
    setShowConfirmPopup(true);
  };

  const confirmPasswordChange = async () => {
    if (!user) return;
    try {
      const updates = {
        ...user,
        password: passwordFormData.newPassword,
      };
      const response = await fetch(`/api/employees/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update password');
      updateUser(updates);
      setPasswordError('');
      setPasswordFormData({
        currentPassword: '',
        newPassword: '',
        verifyPassword: '',
      });
      setShowConfirmPopup(false);
      navigate('/dashboard');
    } catch (err: unknown) {
      setPasswordError('Failed to update password. Please try again.');
      console.error('EditProfile: Failed to update password:', err);
      setShowConfirmPopup(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className='p-6'>
      <h1 className='text-3xl font-bold mb-6 text-bradley-dark-gray'>Edit Profile</h1>
      <div className='space-y-6'>
        {/* Card 1: Personal Info */}
        <div className='bg-white p-6 rounded-lg border border-bradley-medium-gray shadow-[0_4px_0_0_#939598]'>
          <h2 className='text-xl font-semibold mb-4 text-bradley-dark-gray'>Personal Information</h2>
          {error && <p className='text-bradley-red mb-4'>{error}</p>}
          <form onSubmit={handlePersonalSubmit} className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-bradley-dark-gray'>First Name</label>
              <input
                type='text'
                name='firstName'
                value={personalFormData.firstName}
                onChange={handlePersonalInputChange}
                className='mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray'
                required
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-bradley-dark-gray'>Last Name</label>
              <input
                type='text'
                name='lastName'
                value={personalFormData.lastName}
                onChange={handlePersonalInputChange}
                className='mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray'
                required
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-bradley-dark-gray'>Phone</label>
              <input
                type='text'
                name='phone'
                value={personalFormData.phone}
                onChange={handlePersonalInputChange}
                className='mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-bradley-dark-gray'>Email (Not Editable)</label>
              <input
                type='email'
                name='email'
                value={personalFormData.email}
                className='mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray bg-gray-100'
                disabled
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
                className='px-4 py-2 bg-bradley-red text-white rounded-md shadow-[0_4px_0_0_#870F0F] active:shadow-[0_1px_1px_0_#870F0F]'
              >
                Save
              </button>
            </div>
          </form>
        </div>

        {/* Card 2: Password Change */}
        <div className='bg-white p-6 rounded-lg border border-bradley-medium-gray shadow-[0_4px_0_0_#939598]'>
          <h2 className='text-xl font-semibold mb-4 text-bradley-dark-gray'>Change Password</h2>
          {passwordError && <p className='text-bradley-red mb-4'>{passwordError}</p>}
          <form onSubmit={handlePasswordSubmit} className='space-y-4'>
            <div className='relative'>
              <label className='block text-sm font-medium text-bradley-dark-gray'>Current Password</label>
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                name='currentPassword'
                value={passwordFormData.currentPassword}
                onChange={handlePasswordInputChange}
                className='mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray'
                required
              />
              <button
                type='button'
                className='absolute right-3 top-9 text-bradley-dark-gray'
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <div className='relative'>
              <label className='block text-sm font-medium text-bradley-dark-gray'>New Password</label>
              <input
                type={showNewPassword ? 'text' : 'password'}
                name='newPassword'
                value={passwordFormData.newPassword}
                onChange={handlePasswordInputChange}
                className='mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray'
                required
              />
              <button
                type='button'
                className='absolute right-3 top-9 text-bradley-dark-gray'
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <div className='relative'>
              <label className='block text-sm font-medium text-bradley-dark-gray'>Verify Password</label>
              <input
                type={showVerifyPassword ? 'text' : 'password'}
                name='verifyPassword'
                value={passwordFormData.verifyPassword}
                onChange={handlePasswordInputChange}
                className='mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray'
                required
              />
              <button
                type='button'
                className='absolute right-3 top-9 text-bradley-dark-gray'
                onClick={() => setShowVerifyPassword(!showVerifyPassword)}
              >
                {showVerifyPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <div className='flex justify-end'>
              <button
                type='submit'
                className='px-4 py-2 bg-bradley-red text-white rounded-md shadow-[0_4px_0_0_#870F0F] active:shadow-[0_1px_1px_0_#870F0F]'
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Confirmation Pop-up */}
      {showConfirmPopup && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center'>
          <div className='bg-white p-6 rounded-lg shadow-lg w-full max-w-sm'>
            <h2 className='text-xl font-semibold mb-4 text-bradley-dark-gray'>Confirm Password Change</h2>
            <p className='text-bradley-dark-gray mb-6'>Are you sure you want to change your password?</p>
            <div className='flex justify-end space-x-2'>
              <button
                className='px-4 py-2 bg-bradley-light-gray text-bradley-dark-gray rounded-md shadow-[0_4px_0_0_#939598] active:shadow-[0_1px_1px_0_#939598]'
                onClick={() => setShowConfirmPopup(false)}
              >
                Cancel
              </button>
              <button
                className='px-4 py-2 bg-bradley-red text-white rounded-md shadow-[0_4px_0_0_#870F0F] active:shadow-[0_1px_1px_0_#870F0F]'
                onClick={confirmPasswordChange}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}