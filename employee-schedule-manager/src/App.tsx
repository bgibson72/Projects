import { useEffect, useMemo } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import Dashboard from './components/Dashboard';
import Schedule from './pages/Schedule';
import TimeOffRequest from './components/TimeOffRequest';
import Employees from './components/Employees';
import Announcements from './components/Announcements';
import NotFound from './pages/NotFound';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, checkAuth } = useAuthStore();

  useEffect(() => {
    console.log('App useEffect triggered, location:', location.pathname);
    if (!checkAuth() && location.pathname !== '/') {
      navigate('/');
    }
  }, [checkAuth, navigate, location]);

  console.log('App rendered, location:', location.pathname, 'user:', user);

  const isLoginPage = location.pathname === '/';

  const routes = useMemo(() => (
    <Routes>
      <Route path="/" element={<Login />} />
      {user && (
        <>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/schedule" element={<Schedule />} />
          {user.role === 'employee' && (
            <Route path="/time-off" element={<TimeOffRequest />} />
          )}
          {user.role === 'admin' && (
            <>
              <Route path="/employees" element={<Employees />} />
              <Route path="/announcements" element={<Announcements />} />
              <Route path="/time-off-request" element={<TimeOffRequest />} />
            </>
          )}
        </>
      )}
      <Route path="*" element={<NotFound />} />
    </Routes>
  ), [user]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar isLoginPage={isLoginPage} />
      <div
        className={`flex-1 ${isLoginPage ? 'flex items-center justify-center min-h-[calc(100vh-64px)]' : 'container mx-auto p-4 bg-transparent'}`}
      >
        {routes}
      </div>
      {!isLoginPage && <Footer />}
    </div>
  );
}