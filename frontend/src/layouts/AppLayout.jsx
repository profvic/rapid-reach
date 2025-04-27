// src/layouts/AppLayout.jsx
import { useEffect, useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Bell, Home, AlertTriangle, User, LogOut, MenuIcon, X } from 'lucide-react';
import { logout } from '../redux/slices/authSlice';
import { getNotifications } from '../redux/slices/notificationSlice';
import { updateUserLocation } from '../redux/slices/userSlice';
import NotificationDropdown from '../components/NotificationDropdown';

const AppLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const { profile } = useSelector(state => state.user);
  const { unreadCount } = useSelector(state => state.notification);

  // Handle location tracking
  useEffect(() => {
    // Get initial notifications
    dispatch(getNotifications());

    // Setup location tracking
    if (navigator.geolocation) {
      // Get initial location
      navigator.geolocation.getCurrentPosition(
        position => {
          const { longitude, latitude } = position.coords;
          dispatch(updateUserLocation({ longitude, latitude }));
        },
        error => {
          console.error('Error getting location:', error);
        }
      );

      // Setup continuous tracking
      const watchId = navigator.geolocation.watchPosition(
        position => {
          const { longitude, latitude } = position.coords;
          dispatch(updateUserLocation({ longitude, latitude }));
        },
        error => {
          console.error('Error watching location:', error);
        },
        { enableHighAccuracy: true }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    }
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-primary">RapidReach</h1>
          </div>
          
          <div className="flex items-center space-x-2 md:hidden">
            <NotificationDropdown />
            <button onClick={toggleMobileMenu} className="p-2 text-foreground">
              {mobileMenuOpen ? <X size={24} /> : <MenuIcon size={24} />}
            </button>
          </div>
          
          <nav className="hidden md:flex items-center space-x-4">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-md ${
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-foreground hover:bg-muted'
                }`
              }
            >
              <Home size={18} className="mr-2" />
              <span>Dashboard</span>
            </NavLink>
            <NavLink
              to="/report"
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-md ${
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-foreground hover:bg-muted'
                }`
              }
            >
              <AlertTriangle size={18} className="mr-2" />
              <span>Report</span>
            </NavLink>
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-md ${
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-foreground hover:bg-muted'
                }`
              }
            >
              <User size={18} className="mr-2" />
              <span>Profile</span>
            </NavLink>

            <NotificationDropdown />

            <button
              onClick={handleLogout}
              className="flex items-center px-3 py-2 rounded-md text-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut size={18} className="mr-2" />
              <span>Logout</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-background border-b border-border">
          <nav className="container mx-auto px-4 py-2 flex flex-col">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-md ${
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-foreground hover:bg-muted'
                }`
              }
              onClick={() => setMobileMenuOpen(false)}
            >
              <Home size={18} className="mr-2" />
              <span>Dashboard</span>
            </NavLink>
            <NavLink
              to="/report"
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-md ${
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-foreground hover:bg-muted'
                }`
              }
              onClick={() => setMobileMenuOpen(false)}
            >
              <AlertTriangle size={18} className="mr-2" />
              <span>Report</span>
            </NavLink>
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-md ${
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-foreground hover:bg-muted'
                }`
              }
              onClick={() => setMobileMenuOpen(false)}
            >
              <User size={18} className="mr-2" />
              <span>Profile</span>
            </NavLink>
            <button
              onClick={handleLogout}
              className="flex items-center px-3 py-2 rounded-md text-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut size={18} className="mr-2" />
              <span>Logout</span>
            </button>
          </nav>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-4">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          &copy; {new Date().getFullYear()} RapidReach. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default AppLayout;