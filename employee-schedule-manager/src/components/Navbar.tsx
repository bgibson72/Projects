import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export default function Navbar({ minimal = false }: { minimal?: boolean }) {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  console.log('Navbar: minimal =', minimal, 'isAuthenticated =', isAuthenticated, 'user =', user);
  console.log('Navbar: Rendering logo with src=/logo.png');

  const handleLogout = () => {
    logout();
    localStorage.removeItem('auth-storage');
    navigate('/');
  };

  return (
    <nav className='bg-bradley-red text-white shadow-md'>
      <div className='container mx-auto px-4 py-3 flex items-center justify-between'>
        <div className='flex items-center space-x-3'>
          <img
            src='/logo.png'
            alt='Bradley IT Service Desk Logo'
            className='h-10 w-10'
            onError={() => console.error('Navbar: Logo failed to load')}
            onLoad={() => console.log('Navbar: Logo loaded successfully')}
          />
          <span className='text-xl font-bold'>Bradley IT Service Desk Scheduler</span>
        </div>
        <div className='md:hidden'>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className='text-white focus:outline-none'
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        <div
          className={`md:flex items-center space-x-4 ${isMenuOpen ? 'block' : 'hidden'} md:block`}
        >
          {!minimal && isAuthenticated ? (
            <ul className='flex flex-col md:flex-row md:space-x-2 space-y-2 md:space-y-0'>
              <li>
                <NavLink
                  to='/dashboard'
                  className={({ isActive }) =>
                    `block px-3 py-1 rounded-md text-center shadow-[0_4px_2px_0_#870F0F] active:shadow-none ${
                      isActive
                        ? 'bg-bradley-dark-red text-white font-semibold'
                        : 'bg-bradley-dark-red text-white'
                    }`
                  }
                >
                  Dashboard
                </NavLink>
              </li>
              <li>
                <NavLink
                  to='/schedule'
                  className={({ isActive }) =>
                    `block px-3 py-1 rounded-md text-center shadow-[0_4px_2px_0_#870F0F] active:shadow-none ${
                      isActive
                        ? 'bg-bradley-dark-red text-white font-semibold'
                        : 'bg-bradley-dark-red text-white'
                    }`
                  }
                >
                  Schedule
                </NavLink>
              </li>
              <li>
                <NavLink
                  to='/time-off'
                  className={({ isActive }) =>
                    `block px-3 py-1 rounded-md text-center shadow-[0_4px_2px_0_#870F0F] active:shadow-none ${
                      isActive
                        ? 'bg-bradley-dark-red text-white font-semibold'
                        : 'bg-bradley-dark-red text-white'
                    }`
                  }
                >
                  Time Off
                </NavLink>
              </li>
              {user?.role === 'admin' && (
                <li>
                  <NavLink
                    to='/employees'
                    className={({ isActive }) =>
                      `block px-3 py-1 rounded-md text-center shadow-[0_4px_2px_0_#870F0F] active:shadow-none ${
                        isActive
                          ? 'bg-bradley-dark-red text-white font-semibold'
                          : 'bg-bradley-dark-red text-white'
                      }`
                    }
                  >
                    Employees
                  </NavLink>
                </li>
              )}
              <li>
                <NavLink
                  to='/profile'
                  className={({ isActive }) =>
                    `block px-3 py-1 rounded-md text-center shadow-[0_4px_2px_0_#870F0F] active:shadow-none ${
                      isActive
                        ? 'bg-bradley-dark-red text-white font-semibold'
                        : 'bg-bradley-dark-red text-white'
                    }`
                  }
                >
                  Profile
                </NavLink>
              </li>
              <li>
                <button
                  onClick={handleLogout}
                  className='block px-3 py-1 rounded-md text-center shadow-[0_4px_2px_0_#870F0F] active:shadow-none bg-bradley-dark-red text-white'
                >
                  Logout
                </button>
              </li>
            </ul>
          ) : (
            <div className='flex items-center space-x-4'>
              <span className='text-white'>Welcome</span>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
