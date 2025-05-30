import React, { useEffect, useMemo, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import Dashboard from './components/Dashboard';
import Schedule from './pages/Schedule';
import Employees from './components/Employees';
import Announcements from './components/Announcements';
import NotFound from './pages/NotFound';
import MyProfile from './components/MyProfile';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, checkAuth } = useAuthStore();
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    console.log('App useEffect triggered, location:', location.pathname);
    if (!checkAuth() && location.pathname !== '/') {
      navigate('/');
    }
  }, [checkAuth, navigate, location]);

  useEffect(() => {
    // Fetch employees from Firestore on mount
    const fetchEmployees = async () => {
      const querySnapshot = await getDocs(collection(db, 'employees'));
      const emps = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEmployees(emps);
    };
    fetchEmployees();
  }, []);

  console.log('App rendered, location:', location.pathname, 'user:', user);

  const isLoginPage = location.pathname === '/';

  const routes = useMemo(() => (
    <Routes>
      <Route path="/" element={<Login />} />
      {user && (
        <>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/schedule" element={<Schedule employees={employees} setEmployees={setEmployees} />} />
          {user.role === 'admin' && (
            <>
              <Route path="/employees" element={<Employees employees={employees} setEmployees={setEmployees} />} />
              <Route path="/announcements" element={<Announcements />} />
            </>
          )}
          <Route path="/profile" element={<MyProfile />} />
        </>
      )}
      <Route path="*" element={<NotFound />} />
    </Routes>
  ), [user, employees, setEmployees]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar isLoginPage={isLoginPage} />
      <div
        className={`flex-1 ${isLoginPage ? 'flex items-center justify-center min-h-[calc(100vh-64px)]' : 'container mx-auto p-4 bg-transparent'}`}
      >
        {routes}
      </div>
    </div>
  );
}