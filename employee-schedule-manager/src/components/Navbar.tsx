import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LayoutDashboard, Calendar, Clock, Users, UserCog, LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const minimal = !user;
  const isLoginPage = location.pathname === '/';

  const handleLogout = () => {
    logout();
    localStorage.removeItem('auth-storage');
    navigate('/');
    setIsMenuOpen(false);
  };

  console.log('Navbar: minimal =', minimal);

  return (
    <nav className='bg-bradley-red text-white shadow-md'>
      <div className={`container mx-auto px-4 py-3 flex items-center ${isLoginPage ? 'justify-center' : 'justify-between'}`}>
        <div className='flex items-center space-x-3'>
          <img
            src='/logo.png'
            alt='Bradley IT Logo'
            className='h-10'
            onLoad={() => console.log('Navbar: Logo loaded successfully')}
          />
          <span className='text-xl font-bold'>Bradley IT Service Desk Scheduler</span>
        </div>
        {!isLoginPage && (
          <>
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
              {!minimal && (
                <ul className='flex flex-col md:flex-row md:space-x-6 space-y-2 md:space-y-0'>
                  <li>
                    <NavLink
                      to='/dashboard'
                      className='flex items-center space-x-1 text-white'
                    >
                      <LayoutDashboard size={20} />
                      <span className='hidden md:flex hover:underline'>Dashboard</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to='/schedule'
                      className='flex items-center space-x-1 text-white'
                    >
                      <Calendar size={20} />
                      <span className='hidden md:flex hover:underline'>Schedule</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to='/time-off'
                      className='flex items-center space-x-1 text-white'
                    >
                      <Clock size={20} />
                      <span className='hidden md:flex hover:underline'>Time Off</span>
                    </NavLink>
                  </li>
                  {user?.role === 'admin' && (
                    <li>
                      <NavLink
                        to='/employees'
                        className='flex items-center space-x-1 text-white'
                      >
                        <Users size={20} />
                        <span className='hidden md:flex hover:underline'>Employees</span>
                      </NavLink>
                    </li>
                  )}
                  <li>
                    <NavLink
                      to='/profile'
                      className='flex items-center space-x-1 text-white'
                    >
                      <UserCog size={20} />
                      <span className='hidden md:flex hover:underline'>Profile</span>
                    </NavLink>
                  </li>
                  <li>
                    <button
                      onClick={handleLogout}
                      className='flex items-center space-x-1 text-white'
                    >
                      <LogOut size={20} />
                      <span className='hidden md:flex hover:underline'>Logout</span>
                    </button>
                  </li>
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </nav>
  );
}