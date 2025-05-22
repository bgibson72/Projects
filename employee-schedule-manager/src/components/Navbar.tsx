import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Menu, X, Home, Calendar, Users, Megaphone, Clock, LogOut } from 'lucide-react';

interface NavbarProps {
  isLoginPage: boolean;
}

export default function Navbar({ isLoginPage }: NavbarProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (isLoginPage) {
    return (
      <nav className="bg-bradley-red text-white p-4">
        <div className="container mx-auto flex justify-center items-center">
          <Link to="/" className="flex items-center space-x-2">
            <img src="/logo.png" alt="Logo" className="h-8" />
            <span className="text-xl font-bold">Bradley IT Service Desk Scheduler</span>
          </Link>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-bradley-red text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/dashboard" className="flex items-center space-x-2">
          <img src="/logo.png" alt="Logo" className="h-8" />
          <span className="text-xl font-bold">Bradley IT Service Desk Scheduler</span>
        </Link>

        {/* Hamburger Menu for Mobile */}
        <div className="md:hidden">
          <button onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex space-x-4">
          {user && (
            <>
              <Link to="/dashboard" className="flex items-center space-x-1 hover:underline">
                <Home size={18} />
                <span>Dashboard</span>
              </Link>
              <Link to="/schedule" className="flex items-center space-x-1 hover:underline">
                <Calendar size={18} />
                <span>Schedule</span>
              </Link>
              {user.role === 'admin' && (
                <>
                  <Link to="/employees" className="flex items-center space-x-1 hover:underline">
                    <Users size={18} />
                    <span>Employees</span>
                  </Link>
                  <Link to="/announcements" className="flex items-center space-x-1 hover:underline">
                    <Megaphone size={18} />
                    <span>Announcements</span>
                  </Link>
                </>
              )}
              {user.role === 'employee' && (
                <Link to="/time-off" className="flex items-center space-x-1 hover:underline">
                  <Clock size={18} />
                  <span>Time Off</span>
                </Link>
              )}
              <button onClick={handleLogout} className="flex items-center space-x-1 hover:underline">
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden mt-4 space-y-2">
          {user && (
            <>
              <Link to="/dashboard" className="flex items-center space-x-1 w-full hover:underline" onClick={() => setIsOpen(false)}>
                <Home size={18} />
                <span>Dashboard</span>
              </Link>
              <Link to="/schedule" className="flex items-center space-x-1 w-full hover:underline" onClick={() => setIsOpen(false)}>
                <Calendar size={18} />
                <span>Schedule</span>
              </Link>
              {user.role === 'admin' && (
                <>
                  <Link to="/employees" className="flex items-center space-x-1 w-full hover:underline" onClick={() => setIsOpen(false)}>
                    <Users size={18} />
                    <span>Employees</span>
                  </Link>
                  <Link to="/announcements" className="flex items-center space-x-1 w-full hover:underline" onClick={() => setIsOpen(false)}>
                    <Megaphone size={18} />
                    <span>Announcements</span>
                  </Link>
                </>
              )}
              {user.role === 'employee' && (
                <Link to="/time-off" className="flex items-center space-x-1 w-full hover:underline" onClick={() => setIsOpen(false)}>
                  <Clock size={18} />
                  <span>Time Off</span>
                </Link>
              )}
              <button onClick={() => { handleLogout(); setIsOpen(false); }} className="flex items-center space-x-1 w-full hover:underline">
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}