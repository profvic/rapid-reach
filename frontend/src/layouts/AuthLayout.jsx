// src/layouts/AuthLayout.jsx
import { Outlet, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

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
          <h1 className="text-3xl font-bold text-primary">RapidReach</h1>
          <p className="text-muted-foreground">Emergency Response System</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;