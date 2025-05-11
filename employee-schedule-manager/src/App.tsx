import { Routes, Route, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import Navbar from '@/components/Navbar';
import Login from '@/pages/Login';
import Dashboard from '@/components/Dashboard';
import Schedule from '@/pages/Schedule';
import TimeOffRequest from '@/components/TimeOffRequest';
import Employees from '@/components/Employees';
import EditProfile from '@/components/EditProfile';
import NotFound from '@/pages/NotFound';

export default function App() {
  const { user, isAuthenticated } = useAuthStore();
  const location = useLocation();

  console.log(
    'App: Current route:',
    location.pathname,
    'isAuthenticated:',
    isAuthenticated,
    'user:',
    user,
  );

  const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
    console.log(
      'ProtectedRoute: Checking auth, isAuthenticated =',
      isAuthenticated,
      'user =',
      user,
    );
    return isAuthenticated ? children : <Login />;
  };

  return (
    <div className='min-h-screen bg-bradley-light-gray'>
      <Navbar minimal={location.pathname === '/'} />
      <div className='container mx-auto p-4'>
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
                <Employees />
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
          <Route path='*' element={<NotFound />} />
        </Routes>
      </div>
    </div>
  );
}
