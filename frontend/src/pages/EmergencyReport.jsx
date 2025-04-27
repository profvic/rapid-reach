// src/pages/EmergencyReport.jsx
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { createEmergency } from '../redux/slices/emergencySlice';
import MapComponent from '../components/MapComponent';
import AudioAssistantBot from '../components/AudioAssistantBot';
import mapboxgl from 'mapbox-gl';

// Set your Mapbox access token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

const EMERGENCY_TYPES = [
  { id: 'fire', label: 'Fire', color: '#FF4136' },
  { id: 'medical', label: 'Medical', color: '#2ECC40' },
  { id: 'security', label: 'Security', color: '#0074D9' },
  { id: 'natural_disaster', label: 'Natural Disaster', color: '#FF851B' },
  { id: 'other', label: 'Other', color: '#B10DC9' }
];

const EmergencyReport = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { loading, error } = useSelector(state => state.emergency);
  const { currentLocation } = useSelector(state => state.user);
  
  // Default to San Francisco if no location is available
  const defaultLocation = [-122.4194, 37.7749]; // San Francisco coordinates
  const initialCenter = currentLocation || defaultLocation;
  
  const [formData, setFormData] = useState({
    emergencyType: '',
    description: '',
    longitude: initialCenter[0],
    latitude: initialCenter[1],
    address: ''
  });
  
  // Handle location change from map
  const handleLocationChange = (newLocation) => {
    setFormData(prev => ({
      ...prev,
      longitude: newLocation.longitude,
      latitude: newLocation.latitude
    }));
    
    // Reverse geocode to get address
    reverseGeocode(newLocation.longitude, newLocation.latitude);
  };
  
  // Initialize form data when component mounts
  useEffect(() => {
    if (currentLocation) {
      const [longitude, latitude] = currentLocation;
      
      // Update form data with location
      setFormData(prev => ({
        ...prev,
        longitude,
        latitude
      }));
      
      // Reverse geocode initial position
      reverseGeocode(longitude, latitude);
    }
  }, [currentLocation]);
  
  // Reverse geocode function
  const reverseGeocode = async (lng, lat) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        setFormData(prev => ({
          ...prev,
          address: data.features[0].place_name
        }));
      }
    } catch (error) {
      console.error('Error in reverse geocoding:', error);
    }
  };
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Update marker color if emergency type changes
    if (name === 'emergencyType') {
      // The marker color will be updated on the next render
    }
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.emergencyType) {
      alert('Please select an emergency type');
      return;
    }
    
    if (!formData.description) {
      alert('Please provide a description of the emergency');
      return;
    }
    
    dispatch(createEmergency(formData))
      .unwrap()
      .then(result => {
        navigate(`/emergency/${result.emergency._id}`);
      })
      .catch(err => {
        console.error('Error creating emergency:', err);
      });
  };
  
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Report Emergency</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="bg-card rounded-lg shadow-md overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="font-medium">Select Location</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Drag the marker to the exact emergency location
              </p>
            </div>
            <MapComponent
              initialCenter={[formData.longitude, formData.latitude]}
              initialZoom={15}
              height="400px"
              width="100%"
              markerColor="#FF4136"
              draggableMarker={true}
              onLocationChange={handleLocationChange}
              showSOSButton={false} // Hide SOS button on emergency report page
            />
            {formData.address && (
              <div className="p-3 bg-muted/50 text-sm">
                <strong>Address:</strong> {formData.address}
              </div>
            )}
          </div>
        </div>
        
        <div>
          <div className="bg-card rounded-lg shadow-md p-4">
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Emergency Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {EMERGENCY_TYPES.map(type => (
                    <label
                      key={type.id}
                      className={`
                        flex items-center p-3 rounded-md border cursor-pointer
                        ${formData.emergencyType === type.id 
                          ? 'border-primary bg-primary/10' 
                          : 'border-input hover:bg-muted'}
                      `}
                    >
                      <input
                        type="radio"
                        name="emergencyType"
                        value={type.id}
                        checked={formData.emergencyType === type.id}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: type.color }}
                      />
                      <span className="text-sm">{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Describe the emergency situation..."
                  required
                />
              </div>
              
              {error && (
                <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md mb-4 text-sm">
                  {error}
                </div>
              )}
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-70"
                >
                  {loading ? (
                    'Reporting...'
                  ) : (
                    <>
                      <AlertTriangle size={18} className="mr-2" />
                      Report Emergency
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      {/* AI Assistant Bot */}
      <AudioAssistantBot />
    </div>
  );
};

export default EmergencyReport;