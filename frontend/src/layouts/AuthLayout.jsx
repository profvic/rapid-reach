// src/layouts/AuthLayout.jsx
import { Outlet, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { AlertTriangle } from 'lucide-react';

const AuthLayout = () => {
  const { isAuthenticated } = useSelector(state => state.auth);

  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
      <div className="w-full max-w-md p-6 bg-background border border-border rounded-lg shadow-lg">
        <div className="mb-8 text-center">
          <div className="flex flex-col items-center">
            {/* Red circular background with centered icon */}
            <div className="bg-red-500 rounded-full p-2 mb-2 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-primary">Fire Alert</h1>
          </div>
          <p className="text-muted-foreground">Fire Emergency Reporting and Response System</p>
          <p>A PHD Project by Chamberlain Osueke</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
