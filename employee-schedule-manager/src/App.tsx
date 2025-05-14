import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import Navbar from '@/components/Navbar';
import Dashboard from '@/components/Dashboard';
import Schedule from '@/pages/Schedule';
import TimeOffRequest from '@/components/TimeOffRequest';
import Employees from '@/components/Employees';
import EditProfile from '@/components/EditProfile';
import Login from '@/pages/Login';
import NotFound from '@/pages/NotFound';
import ShiftCoverageRequest from '@/components/ShiftCoverageRequest';

export default function App() {
  const { user, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!user) {
      return <Navigate to='/' replace />;
    }
    return <>{children}</>;
  };

  return (
    <div className='min-h-screen bg-bradley-light-gray'>
      <Navbar />
      <div className='container mx-auto px-4 py-6'>
        <Routes>
          <Route path='/' element={<Login />} />
          <Route
            path='/dashboard'
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path='/schedule'
            element={
              <ProtectedRoute>
                <Schedule />
              </ProtectedRoute>
            }
          />
          <Route
            path='/time-off'
            element={
              <ProtectedRoute>
                <TimeOffRequest />
              </ProtectedRoute>
            }
          />
          <Route
            path='/employees'
            element={
              <ProtectedRoute>
                {user?.role === 'admin' ? <Employees /> : <Navigate to='/dashboard' replace />}
              </ProtectedRoute>
            }
          />
          <Route
            path='/profile'
            element={
              <ProtectedRoute>
                <EditProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path='/shift-coverage'
            element={
              <ProtectedRoute>
                <ShiftCoverageRequest />
              </ProtectedRoute>
            }
          />
          <Route path='*' element={<NotFound />} />
        </Routes>
      </div>
    </div>
  );
}