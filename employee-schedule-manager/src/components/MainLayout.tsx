import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';

export default function MainLayout() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/';

  return (
    <div className="flex min-h-screen">
      {/* Sidebar (Navbar) */}
      {!isLoginPage && <Navbar isLoginPage={isLoginPage} />}
      {/* Main content area, shifted right on desktop */}
      <main className="flex-1 md:ml-48">
        <Outlet />
      </main>
    </div>
  );
}