// src/components/NotificationDropdown.jsx
import { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Bell } from 'lucide-react';
import { 
  markNotificationAsRead, 
  markAllNotificationsAsRead 
} from '../redux/slices/notificationSlice';
import { useNavigate } from 'react-router-dom';

const NotificationDropdown = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const { notifications, unreadCount } = useSelector(state => state.notification);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };
  
  const handleMarkAllAsRead = () => {
    dispatch(markAllNotificationsAsRead());
  };
  
  const handleNotificationClick = (notification) => {
    // Mark as read
    if (notification.status !== 'read') {
      dispatch(markNotificationAsRead(notification._id));
    }
    
    // Navigate based on notification type
    if (notification.emergencyId) {
      navigate(`/emergency/${notification.emergencyId}`);
    }
    
    setIsOpen(false);
  };
  
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    }
    
    return date.toLocaleDateString();
  };
  
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="relative p-2 rounded-full bg-muted text-foreground hover:bg-muted-foreground/20"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-background border border-border rounded-md shadow-lg z-10">
          <div className="p-3 border-b border-border flex justify-between items-center">
            <h3 className="font-medium">Notifications</h3>
            {notifications.length > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-primary hover:text-primary/80"
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No notifications
              </div>
            ) : (
              <div>
                {notifications.map(notification => (
                  <div
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-3 border-b border-border cursor-pointer hover:bg-muted transition-colors ${
                      notification.type === 'sos_alert'
                        ? 'bg-destructive/10 border-l-4 border-l-destructive'
                        : notification.status !== 'read'
                          ? 'bg-primary/5'
                          : ''
                    }`}
                  >
                    <div className={`font-medium text-sm ${notification.type === 'sos_alert' ? 'text-destructive' : ''}`}>
                      {notification.type === 'sos_alert' && '🆘 '}
                      {notification.title}
                    </div>
                    <div className={`text-sm mt-1 ${notification.type === 'sos_alert' ? 'text-destructive/90 font-medium' : 'text-muted-foreground'}`}>
                      {notification.message}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatTimeAgo(notification.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;