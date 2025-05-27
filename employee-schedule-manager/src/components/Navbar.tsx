import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Menu, X, Home, Calendar, Users, Megaphone, LogOut } from 'lucide-react';

interface NavbarProps {
  isLoginPage: boolean;
}

export default function Navbar({ isLoginPage }: NavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  if (isLoginPage) {
    return (
      <nav className="bg-bradley-red text-white px-6 py-4">
        <div className="flex flex-col items-center">
          <img src="/logo.png" alt="Logo" className="h-8 mb-2" />
          <span className="text-xl font-bold">Bradley IT Service Desk Scheduler</span>
        </div>
      </nav>
    );
  }

  return (
    <>
      {/* Static Sidebar for desktop */}
      <aside className="hidden md:flex md:w-48 md:flex-col h-screen fixed left-0 top-0 bg-bradley-red shadow-lg z-40">
        <div className="flex flex-col grow gap-y-5 overflow-y-auto px-4 py-6 h-full">
          <div className="flex flex-col items-center h-16 shrink-0 mb-2">
            <img src="/logo.png" alt="Logo" className="h-8 mb-2" />
            <span className="text-lg font-bold text-white text-center leading-tight">Bradley Scheduler</span>
          </div>
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
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      <div className={sidebarOpen ? "absolute inset-0 z-50 flex md:hidden" : "hidden"}>
        <div className="fixed inset-0 bg-black bg-opacity-40" onClick={() => setSidebarOpen(false)}></div>
        <div className="relative flex w-48 flex-col bg-bradley-red px-4 py-6 shadow-lg h-full">
          <button className="absolute top-4 right-4 text-white" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">
            <X size={28} />
          </button>
          <div className="flex flex-col items-center h-16 shrink-0 mb-2">
            <img src="/logo.png" alt="Logo" className="h-8 mb-2" />
            <span className="text-lg font-bold text-white text-center leading-tight">Bradley Scheduler</span>
          </div>
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
        </div>
      </div>

      {/* Top bar for mobile to open sidebar */}
      <div className="md:hidden flex items-center bg-bradley-red text-white px-4 py-3 shadow">
        <button onClick={() => setSidebarOpen(true)} className="mr-3" aria-label="Open sidebar">
          <Menu size={28} />
        </button>
        <span className="text-lg font-bold flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="h-7" />
          Bradley Scheduler
        </span>
      </div>
    </>
  );
}