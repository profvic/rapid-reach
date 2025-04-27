// src/App.jsx (updated)
import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster } from './components/ui/toaster';
import { getCurrentUser } from './redux/slices/userSlice';
import { initializeSocket, disconnectSocket } from './services/socketService';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import EmergencyReport from './pages/EmergencyReport';
import EmergencyDetail from './pages/EmergencyDetail';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Layout
import AppLayout from './layouts/AppLayout';
import AuthLayout from './layouts/AuthLayout';

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector(state => state.auth);
  
  // Initialize socket and fetch user data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(getCurrentUser());
      // Initialize socket and make it available globally
      const socket = initializeSocket();
      window.socket = socket;
    } else {
      disconnectSocket();
      window.socket = null;
    }
    
    return () => {
      disconnectSocket();
      window.socket = null;
    };
  }, [isAuthenticated, dispatch]);

  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Protected routes */}
        <Route 
          element={
            isAuthenticated ? <AppLayout /> : <Navigate to="/login" />
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/report" element={<EmergencyReport />} />
          <Route path="/emergency/:id" element={<EmergencyDetail />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      
      <Toaster />
    </>
  );
}

export default App;