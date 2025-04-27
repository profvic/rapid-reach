// src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Navigation, Clock, Eye, MapPin } from 'lucide-react';
import { getNearbyEmergencies } from '../redux/slices/emergencySlice';
import { setCurrentLocation, updateUserLocation } from '../redux/slices/userSlice';
import MapComponent from '../components/MapComponent';

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { emergencies, loading, error } = useSelector(state => state.emergency);
  const { currentLocation } = useSelector(state => state.user);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);
  
  const [mapMarkers, setMapMarkers] = useState([]);
  
  // Default to San Francisco if no location is available
  const defaultLocation = [-122.4194, 37.7749]; // San Francisco coordinates
  const initialCenter = currentLocation || defaultLocation;
  
  // Fetch nearby emergencies when location changes
  useEffect(() => {
    if (currentLocation) {
      const [longitude, latitude] = currentLocation;
      dispatch(getNearbyEmergencies({ longitude, latitude }));
    } else {
      // Use default location if no current location
      const [longitude, latitude] = defaultLocation;
      dispatch(getNearbyEmergencies({ longitude, latitude }));
    }
  }, [currentLocation, dispatch]);
  
  // Prepare emergency markers for the map
  useEffect(() => {
    if (emergencies.length > 0) {
      const markers = emergencies.map(emergency => {
        if (emergency.location && emergency.location.coordinates) {
          const [lng, lat] = emergency.location.coordinates;
          return {
            id: emergency._id,
            longitude: lng,
            latitude: lat,
            color: getEmergencyColor(emergency.emergencyType),
            popupContent: `
              <h3 class="text-base font-bold">${emergency.emergencyType.toUpperCase()}</h3>
              <p class="text-sm">${emergency.description}</p>
              <p class="text-xs text-gray-500 mt-1">
                ${new Date(emergency.createdAt).toLocaleTimeString()}
              </p>
            `,
            onClick: () => navigate(`/emergency/${emergency._id}`)
          };
        }
        return null;
      }).filter(Boolean);
      
      setMapMarkers(markers);
    }
  }, [emergencies, navigate]);
  
  // Helper to get color based on emergency type
  const getEmergencyColor = (type) => {
    switch (type.toLowerCase()) {
      case 'fire':
        return '#FF4136'; // Red
      case 'medical':
        return '#2ECC40'; // Green
      case 'security':
        return '#0074D9'; // Blue
      case 'natural_disaster':
        return '#FF851B'; // Orange
      default:
        return '#B10DC9'; // Purple
    }
  };
  
  // Format time elapsed
  const formatTimeElapsed = (dateString) => {
    const created = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - created) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };
  
  // Handle locate me button click
  const handleLocateMe = () => {
    setIsLocating(true);
    setLocationError(null);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          console.log(`Location obtained with accuracy: ${accuracy} meters`);
          
          // Update Redux store with new location
          // Note: Mapbox uses [longitude, latitude] format
          dispatch(setCurrentLocation([longitude, latitude]));
          
          // Also update location on server
          dispatch(updateUserLocation({ longitude, latitude }))
            .unwrap()
            .then(() => {
              console.log("Location successfully updated on server");
            })
            .catch(err => {
              console.error("Failed to update location on server:", err);
            });
          
          setIsLocating(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          let errorMessage = "Could not get your location. ";
          
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += "Location permission denied.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += "Location information is unavailable.";
              break;
            case error.TIMEOUT:
              errorMessage += "Location request timed out.";
              break;
            default:
              errorMessage += "Unknown error occurred.";
          }
          
          setLocationError(errorMessage);
          setIsLocating(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0 // Always get a fresh position
        }
      );
    } else {
      setLocationError("Geolocation is not supported by this browser.");
      setIsLocating(false);
    }
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <div className="bg-card rounded-lg shadow-md overflow-hidden h-[500px] relative">
          <MapComponent
            initialCenter={initialCenter}
            initialZoom={13}
            height="500px"
            width="100%"
            markerColor="#0074D9"
            markers={mapMarkers}
          />
          
          {/* Locate Me Button */}
          <div className="absolute bottom-4 right-4 z-10 flex flex-col items-end">
            {locationError && (
              <div className="bg-destructive text-destructive-foreground px-3 py-2 rounded-md mb-2 text-sm max-w-xs">
                {locationError}
              </div>
            )}
            <button
              onClick={handleLocateMe}
              disabled={isLocating}
              className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md shadow-md transition-colors"
            >
              {isLocating ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                  <span>Locating...</span>
                </>
              ) : (
                <>
                  <MapPin size={16} />
                  <span>Locate Me</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      <div>
        <div className="bg-card rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold">Nearby Emergencies</h2>
          </div>
          
          <div className="p-0 max-h-[460px] overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">
                Loading emergencies...
              </div>
            ) : error ? (
              <div className="p-4 text-center text-destructive">
                Error: {error}
              </div>
            ) : emergencies.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No emergencies nearby
              </div>
            ) : (
              <div className="divide-y divide-border">
                {emergencies.map(emergency => (
                  <div 
                    key={emergency._id} 
                    className="p-4 hover:bg-muted transition-colors cursor-pointer"
                    onClick={() => navigate(`/emergency/${emergency._id}`)}
                  >
                    <div className="flex items-start">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center mr-3 mt-1"
                        style={{ backgroundColor: `${getEmergencyColor(emergency.emergencyType)}20` }}
                      >
                        <AlertCircle 
                          size={20} 
                          className="text-foreground" 
                          style={{ color: getEmergencyColor(emergency.emergencyType) }} 
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">
                          {emergency.emergencyType.charAt(0).toUpperCase() + emergency.emergencyType.slice(1)} Emergency
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {emergency.description}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                          <div className="flex items-center">
                            <Clock size={12} className="mr-1" />
                            {formatTimeElapsed(emergency.createdAt)}
                          </div>
                          <div className="flex items-center">
                            <Navigation size={12} className="mr-1" />
                            {emergency.location?.address 
                              ? emergency.location.address.split(',')[0] 
                              : 'Unknown location'}
                          </div>
                          <div className="flex items-center">
                            <Eye size={12} className="mr-1" />
                            {emergency.responders?.length || 0} {emergency.responders?.length === 1 ? 'responder' : 'responders'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;