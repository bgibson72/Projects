import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Menu, X, Home, Calendar, Users, Megaphone, LogOut, Moon, Sun } from 'lucide-react';

interface NavbarProps {
  isLoginPage: boolean;
}

export default function Navbar({ isLoginPage }: NavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Dark mode state and logic
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  if (isLoginPage) {
    return (
      <>
        <nav className="bg-bradley-red text-white px-6 py-4 flex items-center justify-center">
          <div className="flex items-center justify-center">
            <img src="/logo.png" alt="Logo" className="h-8 mr-2" />
            <span className="text-xl font-bold">IT Service Desk Scheduler</span>
          </div>
        </nav>
        {/* Bottom bar for UI mode toggle */}
        <div className="fixed bottom-0 left-0 w-full bg-bradley-red py-3 flex items-center justify-between z-50 px-6">
          <div className="flex items-center">
            <span className="mr-2 text-bradley-light-gray"><Sun size={18} /></span>
            <button
              type="button"
              aria-pressed={darkMode}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-bradley-red bg-bradley-dark-gray border-0`}
              onClick={() => setDarkMode((v) => !v)}
            >
              <span className="sr-only">Toggle dark mode</span>
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${darkMode ? 'translate-x-5' : 'translate-x-1'}`}
              />
            </button>
            <span className="ml-2 text-bradley-light-gray"><Moon size={18} /></span>
          </div>
          <span className="text-bradley-light-gray text-xs font-medium">Copyright 2025 - Bryan Gibson, All Rights Reserved</span>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Static Sidebar for desktop */}
      <aside className="hidden md:flex md:w-60 md:flex-col h-screen fixed left-0 top-0 bg-bradley-red text-white shadow-lg z-40 transition-colors duration-300">
        <div className="flex flex-col grow gap-y-5 overflow-y-auto px-4 py-6 h-full">
          <div className="flex flex-col items-center h-20 shrink-0 mb-2">
            <img src="/logo.png" alt="Logo" className="h-12 mb-2" />
            <span className="text-base font-bold text-white text-center leading-tight">Bradley IT Service Desk Scheduler</span>
          </div>
          <div className="h-8" /> {/* Spacer between title and nav */}
          <nav className="flex flex-1 flex-col">
            <ul className="flex flex-1 flex-col gap-y-2">
              <li>
                <Link to="/dashboard" className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold ${isActive('/dashboard') ? 'bg-white/20 text-white shadow-inner' : 'text-white hover:bg-white/10'}` + (isActive('/dashboard') ? ' ring-2 ring-white' : '')}>
                  <Home size={20} />
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/schedule" className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold ${isActive('/schedule') ? 'bg-white/20 text-white shadow-inner' : 'text-white hover:bg-white/10'}` + (isActive('/schedule') ? ' ring-2 ring-white' : '')}>
                  <Calendar size={20} />
                  Schedule
                </Link>
              </li>
              {/* My Profile link for employees only */}
              {user?.role === 'employee' && (
                <li>
                  <Link to="/profile" className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold ${isActive('/profile') ? 'bg-white/20 text-white shadow-inner' : 'text-white hover:bg-white/10'}` + (isActive('/profile') ? ' ring-2 ring-white' : '')}>
                    <Users size={20} />
                    My Profile
                  </Link>
                </li>
              )}
              {user?.role === 'admin' && (
                <>
                  <li>
                    <Link to="/employees" className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold ${isActive('/employees') ? 'bg-white/20 text-white shadow-inner' : 'text-white hover:bg-white/10'}` + (isActive('/employees') ? ' ring-2 ring-white' : '')}>
                      <Users size={20} />
                      Employees
                    </Link>
                  </li>
                  <li>
                    <Link to="/announcements" className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold ${isActive('/announcements') ? 'bg-white/20 text-white shadow-inner' : 'text-white hover:bg-white/10'}` + (isActive('/announcements') ? ' ring-2 ring-white' : '')}>
                      <Megaphone size={20} />
                      Announcements
                    </Link>
                  </li>
                </>
              )}
              <li className="mt-auto">
                <button onClick={handleLogout} className="group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-white hover:bg-white/10 w-full text-left">
                  <LogOut size={20} />
                  Logout
                </button>
              </li>
            </ul>
          </nav>
          {/* Dark mode toggle at bottom */}
          <div className="mt-8 flex items-center justify-center">
            <span className="mr-2 text-bradley-light-gray"><Sun size={18} /></span>
            <button
              type="button"
              aria-pressed={darkMode}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-bradley-red ${darkMode ? 'bg-bradley-dark-gray' : 'bg-bradley-medium-gray'} border-0`}
              onClick={() => setDarkMode((d) => !d)}
            >
              <span className="sr-only">Toggle dark mode</span>
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${darkMode ? 'translate-x-5' : 'translate-x-1'}`}
              />
            </button>
            <span className="ml-2 text-bradley-light-gray"><Moon size={18} /></span>
          </div>
        </div>
      </aside>
      {/* Mobile sidebar overlay */}
      <div className={sidebarOpen ? "absolute inset-0 z-50 flex md:hidden" : "hidden"}>
        <div className="fixed inset-0 bg-black bg-opacity-40" onClick={() => setSidebarOpen(false)}></div>
        <div className="relative flex w-60 flex-col bg-bradley-red text-white px-4 py-6 shadow-lg h-full transition-colors duration-300">
          <button className="absolute top-4 right-4 text-white" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">
            <X size={28} />
          </button>
          <div className="flex flex-col items-center h-20 shrink-0 mb-2">
            <img src="/logo.png" alt="Logo" className="h-12 mb-2" />
            <span className="text-base font-bold text-white text-center leading-tight">Bradley IT Service Desk Scheduler</span>
          </div>
          <div className="h-8" /> {/* Spacer between title and nav */}
          <nav className="flex flex-1 flex-col">
            <ul className="flex flex-1 flex-col gap-y-2">
              <li>
                <Link to="/dashboard" className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold ${isActive('/dashboard') ? 'bg-white/20 text-white shadow-inner' : 'text-white hover:bg-white/10'}` + (isActive('/dashboard') ? ' ring-2 ring-white' : '')} onClick={() => setSidebarOpen(false)}>
                  <Home size={20} />
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/schedule" className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold ${isActive('/schedule') ? 'bg-white/20 text-white shadow-inner' : 'text-white hover:bg-white/10'}` + (isActive('/schedule') ? ' ring-2 ring-white' : '')} onClick={() => setSidebarOpen(false)}>
                  <Calendar size={20} />
                  Schedule
                </Link>
              </li>
              {/* My Profile link for employees only */}
              {user?.role === 'employee' && (
                <li>
                  <Link to="/profile" className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold ${isActive('/profile') ? 'bg-white/20 text-white shadow-inner' : 'text-white hover:bg-white/10'}` + (isActive('/profile') ? ' ring-2 ring-white' : '')} onClick={() => setSidebarOpen(false)}>
                    <Users size={20} />
                    My Profile
                  </Link>
                </li>
              )}
              {user?.role === 'admin' && (
                <>
                  <li>
                    <Link to="/employees" className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold ${isActive('/employees') ? 'bg-white/20 text-white shadow-inner' : 'text-white hover:bg-white/10'}` + (isActive('/employees') ? ' ring-2 ring-white' : '')} onClick={() => setSidebarOpen(false)}>
                      <Users size={20} />
                      Employees
                    </Link>
                  </li>
                  <li>
                    <Link to="/announcements" className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold ${isActive('/announcements') ? 'bg-white/20 text-white shadow-inner' : 'text-white hover:bg-white/10'}` + (isActive('/announcements') ? ' ring-2 ring-white' : '')} onClick={() => setSidebarOpen(false)}>
                      <Megaphone size={20} />
                      Announcements
                    </Link>
                  </li>
                </>
              )}
              <li className="mt-auto">
                <button onClick={() => { handleLogout(); setSidebarOpen(false); }} className="group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-white hover:bg-white/10 w-full text-left">
                  <LogOut size={20} />
                  Logout
                </button>
              </li>
            </ul>
          </nav>
          {/* Dark mode toggle at bottom of mobile drawer */}
          <div className="mt-8 flex items-center justify-center">
            <span className="mr-2 text-bradley-light-gray"><Sun size={18} /></span>
            <button
              type="button"
              aria-pressed={darkMode}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-bradley-red ${darkMode ? 'bg-bradley-dark-gray' : 'bg-bradley-medium-gray'} border-0`}
              onClick={() => setDarkMode((d) => !d)}
            >
              <span className="sr-only">Toggle dark mode</span>
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${darkMode ? 'translate-x-5' : 'translate-x-1'}`}
              />
            </button>
            <span className="ml-2 text-bradley-light-gray"><Moon size={18} /></span>
          </div>
        </div>
      </div>

      {/* Top bar for mobile to open sidebar */}
      <div className="md:hidden flex items-center bg-bradley-red text-white px-4 py-3 shadow">
        <button onClick={() => setSidebarOpen(true)} className="mr-3" aria-label="Open sidebar">
          <Menu size={28} />
        </button>
        <span className="text-base font-bold flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="h-7" />
          Bradley IT Service Desk Scheduler
        </span>
      </div>
    </>
  );
}