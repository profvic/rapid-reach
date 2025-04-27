import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  AlertTriangle,
  Clock,
  Navigation,
  Check,
  X,
  MapPin,
  ArrowRight,
  Phone,
  User
} from 'lucide-react';
import {
  getEmergencyDetails,
  respondToEmergency,
  updateEmergencyStatus
} from '../redux/slices/emergencySlice';
import MapComponent from '../components/MapComponent';
import mapboxgl from 'mapbox-gl';

// Set your Mapbox access token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

const EmergencyDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { currentEmergency, loading, error } = useSelector(state => state.emergency);
  const { profile, currentLocation } = useSelector(state => state.user);
  
  const [routeDetails, setRouteDetails] = useState(null);
  const [responding, setResponding] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [mapMarkers, setMapMarkers] = useState([]);
  const [routeCoordinates, setRouteCoordinates] = useState(null);
  const [showDirections, setShowDirections] = useState(false);
  const [enableRealTimeTracking, setEnableRealTimeTracking] = useState(false);
  const [realTimeLocation, setRealTimeLocation] = useState(null);
  const mapRef = useRef(null);
  
  // Default to San Francisco if no location is available
  const defaultUserLocation = [-122.4194, 37.7749]; // San Francisco coordinates
  
  // Fetch emergency details
  useEffect(() => {
    dispatch(getEmergencyDetails(id));
  }, [dispatch, id]);
  
  // Setup map markers when emergency data is available
  useEffect(() => {
    if (currentEmergency && currentLocation) {
      const emergencyCoords = currentEmergency.location.coordinates;
      const [userLng, userLat] = currentLocation || defaultUserLocation;
      
      // Set up markers
      const markers = [
        // Emergency marker
        {
          id: 'emergency',
          longitude: emergencyCoords[0],
          latitude: emergencyCoords[1],
          color: '#FF4136',
          popupContent: `
            <h3 class="text-base font-bold">${currentEmergency.emergencyType.toUpperCase()}</h3>
            <p class="text-sm">${currentEmergency.description}</p>
          `
        },
        // User marker (only show if not using real-time tracking)
        {
          id: 'user',
          longitude: userLng,
          latitude: userLat,
          color: '#0074D9',
          popupContent: '<p>Your location</p>'
        }
      ];
      
      setMapMarkers(markers);
      
      // Get directions
      getDirections(userLng, userLat, emergencyCoords[0], emergencyCoords[1]);
      
      // If user is a responder, automatically show directions and enable tracking
      if (isResponder()) {
        setShowDirections(true);
        setEnableRealTimeTracking(true);
      }
    }
  }, [currentEmergency, currentLocation]);
  
  // Get directions from Mapbox
  const getDirections = async (startLng, startLat, endLng, endLat) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${startLng},${startLat};${endLng},${endLat}?geometries=geojson&overview=full&steps=true&access_token=${mapboxgl.accessToken}`
      );
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        setRouteDetails({
          distance: (route.distance / 1000).toFixed(1), // km
          duration: Math.round(route.duration / 60), // minutes
          steps: route.legs[0].steps
        });
        
        // Store route coordinates for map display
        setRouteCoordinates(route.geometry.coordinates);
      }
    } catch (error) {
      console.error('Error getting directions:', error);
    }
  };
  
  // Handle respond to emergency
  const handleRespond = () => {
    setResponding(true);
    dispatch(respondToEmergency(id))
      .unwrap()
      .then(() => {
        setResponding(false);
        // Automatically show directions when user responds
        setShowDirections(true);
        // Enable real-time tracking
        setEnableRealTimeTracking(true);
        
        // If we already have route coordinates, no need to fetch again
        if (!routeCoordinates && currentLocation) {
          const emergencyCoords = currentEmergency.location.coordinates;
          const [userLng, userLat] = currentLocation || defaultUserLocation;
          getDirections(userLng, userLat, emergencyCoords[0], emergencyCoords[1]);
        }
      })
      .catch(err => {
        console.error('Error responding to emergency:', err);
        setResponding(false);
      });
  };
  
  // Handle update emergency status
  const handleUpdateStatus = (status) => {
    setUpdatingStatus(true);
    dispatch(updateEmergencyStatus({ emergencyId: id, status }))
      .unwrap()
      .then(() => {
        setUpdatingStatus(false);
      })
      .catch(err => {
        console.error('Error updating emergency status:', err);
        setUpdatingStatus(false);
      });
  };
  
  // Check if user is responder
  const isResponder = () => {
    if (!currentEmergency || !profile) return false;
    return currentEmergency.responders.some(
      responder => responder.userId === profile._id || 
                  (responder.userId && typeof responder.userId === 'object' && 
                   responder.userId._id === profile._id)
    );
  };
  
  // Get user's responder status
  const getResponderStatus = () => {
    if (!currentEmergency || !profile) return null;
    const responder = currentEmergency.responders.find(
      responder => responder.userId === profile._id || 
                  (responder.userId && typeof responder.userId === 'object' && 
                   responder.userId._id === profile._id)
    );
    return responder ? responder.status : null;
  };
  
  // Handle real-time location updates
  const handleLocationUpdate = (location) => {
    setRealTimeLocation(location);
    
    // If we're showing directions and have an emergency, check if we need to recalculate the route
    if (showDirections && currentEmergency && routeCoordinates) {
      // In a real implementation, you might want to check the distance from the route
      // and only recalculate if the user has deviated significantly
      
      // For now, we'll just update the user's location and let the MapComponent handle the rest
      const emergencyCoords = currentEmergency.location.coordinates;
      
      // Recalculate route every 30 seconds or when user deviates significantly
      // This is a simplified implementation - in a real app, you'd want more sophisticated logic
      const lastRouteUpdate = localStorage.getItem('lastRouteUpdate');
      const now = Date.now();
      
      if (!lastRouteUpdate || (now - parseInt(lastRouteUpdate)) > 30000) {
        getDirections(location.longitude, location.latitude, emergencyCoords[0], emergencyCoords[1]);
        localStorage.setItem('lastRouteUpdate', now.toString());
      }
    }
  };
  
  // Get emergency status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-destructive';
      case 'responding':
        return 'text-primary';
      case 'resolved':
        return 'text-green-600';
      case 'cancelled':
        return 'text-gray-500';
      default:
        return 'text-foreground';
    }
  };
  
  if (loading) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading emergency details...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center p-8">
        <AlertTriangle size={32} className="text-destructive mx-auto mb-4" />
        <p className="text-destructive mb-2">Error: {error}</p>
        <button
          onClick={() => navigate('/')}
          className="text-primary hover:underline"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }
  
  if (!currentEmergency) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">No emergency details found</p>
        <button
          onClick={() => navigate('/')}
          className="text-primary hover:underline mt-2"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Emergency Details</h2>
        <div className="flex items-center">
          <span className="text-sm mr-2">Status:</span>
          <span className={`font-medium ${getStatusColor(currentEmergency.status)}`}>
            {currentEmergency.status.toUpperCase()}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="bg-card rounded-lg shadow-md overflow-hidden mb-6">
            {currentEmergency && (
              <MapComponent
                initialCenter={currentEmergency.location.coordinates}
                initialZoom={14}
                height="400px"
                width="100%"
                markers={mapMarkers}
                routeCoordinates={routeCoordinates}
                showDirections={showDirections || isResponder()}
                enableRealTimeTracking={enableRealTimeTracking || isResponder()}
                userLocation={realTimeLocation}
                onLocationChange={handleLocationUpdate}
                showSOSButton={true} // Explicitly enable SOS button on emergency detail page
                ref={mapRef}
              />
            )}
          </div>
          
          {routeDetails && (
            <div className="bg-card rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="font-medium">Route Information</h3>
              </div>
              
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Navigation className="text-primary mr-2" size={18} />
                    <span className="text-sm font-medium">{routeDetails.distance} km</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Clock className="text-primary mr-2" size={18} />
                    <span className="text-sm font-medium">{routeDetails.duration} min</span>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  {routeDetails.steps.map((step, index) => (
                    <div key={index} className="flex items-start py-2 border-b border-border last:border-0">
                      <div className="bg-primary/10 text-primary rounded-full p-1 mr-3 mt-0.5">
                        <ArrowRight size={14} />
                      </div>
                      <div dangerouslySetInnerHTML={{ __html: step.maneuver.instruction }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div>
          <div className="bg-card rounded-lg shadow-md overflow-hidden mb-6">
            <div className="p-4 border-b border-border">
              <h3 className="font-medium">Actions</h3>
            </div>
            
            <div className="p-4">
              {currentEmergency.status === 'active' && !isResponder() && (
                <button
                  onClick={handleRespond}
                  disabled={responding}
                  className="w-full flex items-center justify-center bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {responding ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2"></div>
                      Responding...
                    </>
                  ) : (
                    <>
                      <Navigation className="mr-2" size={16} />
                      Respond to Emergency
                    </>
                  )}
                </button>
              )}
              
              {isResponder() && getResponderStatus() === 'en-route' && (
                <button
                  onClick={() => handleUpdateStatus('arrived')}
                  disabled={updatingStatus}
                  className="w-full flex items-center justify-center bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-3"
                >
                  {updatingStatus ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <MapPin className="mr-2" size={16} />
                      Mark as Arrived
                    </>
                  )}
                </button>
              )}
              
              {(currentEmergency.status === 'responding' || currentEmergency.status === 'active') &&
               (profile.role === 'admin' || isResponder()) && (
                <button
                  onClick={() => handleUpdateStatus('resolved')}
                  disabled={updatingStatus}
                  className="w-full flex items-center justify-center bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-3"
                >
                  {updatingStatus ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2" size={16} />
                      Mark as Resolved
                    </>
                  )}
                </button>
              )}
              
              {(currentEmergency.status === 'active' || currentEmergency.status === 'responding') &&
               profile.role === 'admin' && (
                <button
                  onClick={() => handleUpdateStatus('cancelled')}
                  disabled={updatingStatus}
                  className="w-full flex items-center justify-center bg-destructive text-destructive-foreground py-2 px-4 rounded-md hover:bg-destructive/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updatingStatus ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-destructive-foreground border-t-transparent rounded-full mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <X className="mr-2" size={16} />
                      Cancel Emergency
                    </>
                  )}
                </button>
              )}
              
              {(currentEmergency.status === 'resolved' || currentEmergency.status === 'cancelled') && (
                <button
                  onClick={() => navigate('/')}
                  className="w-full flex items-center justify-center bg-secondary text-secondary-foreground py-2 px-4 rounded-md hover:bg-secondary/90 transition-colors"
                >
                  Return to Dashboard
                </button>
              )}
            </div>
          </div>
          
          <div className="bg-card rounded-lg shadow-md overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="font-medium">Responders</h3>
            </div>
            
            <div className="p-4">
              {currentEmergency.responders.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-4">
                  No responders yet
                </div>
              ) : (
                <div className="space-y-3">
                  {currentEmergency.responders.map((responder, index) => {
                    const responderUserId = typeof responder.userId === 'object' ? 
                      responder.userId._id : responder.userId;
                    const responderName = typeof responder.userId === 'object' ? 
                      responder.userId.name : 'Responder';
                    const responderPhone = typeof responder.userId === 'object' ? 
                      responder.userId.phone : null;
                      
                    return (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-3">
                            <User size={16} />
                          </div>
                          <div>
                            <div className="font-medium text-sm">
                              {responderUserId === profile._id ? 'You' : responderName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Status: {responder.status}
                            </div>
                          </div>
                        </div>
                        
                        {responderUserId !== profile._id && responderPhone && (
                          <a
                            href={`tel:${responderPhone}`}
                            className="p-2 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
                          >
                            <Phone size={16} />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyDetail;
