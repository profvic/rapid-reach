// src/pages/EmergencyReport.jsx
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ImagePlus } from 'lucide-react';
import { createEmergency } from '../redux/slices/emergencySlice';
import MapComponent from '../components/MapComponent';
import AudioAssistantBot from '../components/AudioAssistantBot';
import mapboxgl from 'mapbox-gl';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

const EMERGENCY_TYPES = [
  { id: 'wild_fire', label: 'Wild Fire', color: '#FF4136' },
  { id: 'electrical_fire', label: 'Electrical Fire', color: '#2ECC40' },
  { id: 'fuel_fire', label: 'Fuel Fire', color: '#0074D9' },
  { id: 'domestic_fire', label: 'Domestic Fire', color: '#FF851B' },
  { id: 'other', label: 'Other', color: '#B10DC9' }
];

const EmergencyReport = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, error } = useSelector(state => state.emergency);
  const { currentLocation } = useSelector(state => state.user);

  const defaultLocation = [-122.4194, 37.7749];
  const initialCenter = currentLocation || defaultLocation;

  const [formData, setFormData] = useState({
    emergencyType: '',
    description: '',
    longitude: initialCenter[0],
    latitude: initialCenter[1],
    address: ''
  });

  // ✅ Dummy media state (frontend only)
  const [mediaFiles, setMediaFiles] = useState([]);

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);
    setMediaFiles(files);
  };

  const handleLocationChange = (newLocation) => {
    setFormData(prev => ({
      ...prev,
      longitude: newLocation.longitude,
      latitude: newLocation.latitude
    }));

    reverseGeocode(newLocation.longitude, newLocation.latitude);
  };

  useEffect(() => {
    if (currentLocation) {
      const [longitude, latitude] = currentLocation;

      setFormData(prev => ({
        ...prev,
        longitude,
        latitude
      }));

      reverseGeocode(longitude, latitude);
    }
  }, [currentLocation]);

  const reverseGeocode = async (lng, lat) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}`
      );
      const data = await response.json();

      if (data.features?.length) {
        setFormData(prev => ({
          ...prev,
          address: data.features[0].place_name
        }));
      }
    } catch (err) {
      console.error('Reverse geocode error:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.emergencyType || !formData.description) {
      alert('Please complete all required fields');
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
        {/* MAP */}
        <div className="md:col-span-2">
          <div className="bg-card rounded-lg shadow-md overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="font-medium">Select Location</h3>
              <p className="text-sm text-muted-foreground">
                Drag the marker to the exact emergency location
              </p>
            </div>

            <MapComponent
              initialCenter={[formData.longitude, formData.latitude]}
              initialZoom={15}
              height="400px"
              width="100%"
              markerColor="#FF4136"
              draggableMarker
              onLocationChange={handleLocationChange}
              showSOSButton={false}
            />

            {formData.address && (
              <div className="p-3 bg-muted/50 text-sm">
                <strong>Address:</strong> {formData.address}
              </div>
            )}
          </div>
        </div>

        {/* FORM */}
        <div>
          <div className="bg-card rounded-lg shadow-md p-4">
            <form onSubmit={handleSubmit}>
              {/* Emergency Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Emergency Type
                </label>

                <div className="grid grid-cols-2 gap-2">
                  {EMERGENCY_TYPES.map(type => (
                    <label
                      key={type.id}
                      className={`flex items-center p-3 rounded-md border cursor-pointer
                        ${formData.emergencyType === type.id
                          ? 'border-red-600 bg-red-100'
                          : 'hover:border-red-500 hover:bg-red-50'}
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
                      <span
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: type.color }}
                      />
                      <span className="text-sm">{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  rows="4"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-red-500"
                  placeholder="Describe the emergency situation..."
                  required
                />
              </div>

              {/* ✅ Dummy Media Upload */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Upload Images / Videos (Optional)
                </label>

                <label className="flex items-center justify-center gap-2 p-3 border border-dashed rounded-md cursor-pointer hover:bg-muted">
                  <ImagePlus size={18} />
                  <span className="text-sm">Add Media</span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleMediaChange}
                    className="hidden"
                  />
                </label>

                <p className="text-xs text-muted-foreground mt-1">
                  Files should be in the correct format.
                </p>

                {mediaFiles.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {mediaFiles.map((file, index) => {
                      const url = URL.createObjectURL(file);

                      return file.type.startsWith('image') ? (
                        <img
                          key={index}
                          src={url}
                          alt="preview"
                          className="h-20 w-full object-cover rounded"
                        />
                      ) : (
                        <video
                          key={index}
                          src={url}
                          className="h-20 w-full object-cover rounded"
                          controls
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-100 text-red-600 px-4 py-2 rounded text-sm mb-3">
                  {error}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-70"
                >
                  {loading ? 'Reporting...' : (
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

      <AudioAssistantBot />
    </div>
  );
};

export default EmergencyReport;
