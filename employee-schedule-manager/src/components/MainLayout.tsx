import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';

export default function MainLayout() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/';

  return (
    <div className="min-h-screen bg-white text-bradley-dark-gray dark:bg-bradley-dark-bg dark:text-bradley-dark-card-text">
      {/* Sidebar (Navbar) */}
      {!isLoginPage && <Navbar isLoginPage={isLoginPage} />}
      {/* Main content area, shifted right on desktop */}
      <main className="flex-1 md:ml-48 relative bg-bradley-light-gray dark:bg-bradley-dark-bg transition-colors duration-300">
        <Outlet />
      </main>
    </div>
  );
}