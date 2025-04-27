import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MapComponent = ({
  initialCenter = [-74.0066, 40.7135],
  initialZoom = 15.5,
  markerColor = "red",
  onLocationChange = null,
  height = "400px",
  width = "100%",
  showControls = true,
  draggableMarker = false,
  markers = [],
  routeCoordinates = null,
  showDirections = false,
  enableRealTimeTracking = false,
  userLocation = null
}) => {
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);
  const [mainMarker, setMainMarker] = useState(null);
  const markersRef = useRef([]);
  const routeRef = useRef(null);
  const userMarkerRef = useRef(null);
  const watchPositionId = useRef(null);
  const [isTracking, setIsTracking] = useState(false);
  const [location, setLocation] = useState({
    latitude: Array.isArray(initialCenter) ? initialCenter[1] : initialCenter.latitude,
    longitude: Array.isArray(initialCenter) ? initialCenter[0] : initialCenter.longitude
  });

  // Update location when initialCenter prop changes
  useEffect(() => {
    if (initialCenter) {
      setLocation({
        latitude: Array.isArray(initialCenter) ? initialCenter[1] : initialCenter.latitude,
        longitude: Array.isArray(initialCenter) ? initialCenter[0] : initialCenter.longitude
      });
    }
  }, [initialCenter]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    // Set Mapbox access token
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

    // Create map
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [location.longitude, location.latitude],
      zoom: initialZoom,
      antialias: true,
    });

    // Save map instance
    mapInstance.current = map;

    // Add navigation controls if needed
    if (showControls) {
      map.addControl(new mapboxgl.NavigationControl(), 'top-right');
      map.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: true
        }),
        'top-right'
      );
    }

    // Add main marker if draggable or no other markers
    if (draggableMarker || markers.length === 0) {
      const newMarker = new mapboxgl.Marker({
        color: markerColor,
        draggable: draggableMarker
      })
        .setLngLat([location.longitude, location.latitude])
        .addTo(map);
      
      setMainMarker(newMarker);

      // Handle marker drag events if marker is draggable
      if (draggableMarker) {
        newMarker.on('dragend', () => {
          const lngLat = newMarker.getLngLat();
          const newLocation = {
            latitude: lngLat.lat,
            longitude: lngLat.lng
          };
          setLocation(newLocation);
          
          // Call the callback if provided
          if (onLocationChange) {
            onLocationChange(newLocation);
          }
        });
      }
    }

    // Add additional markers if provided
    if (markers && markers.length > 0) {
      markers.forEach(markerData => {
        try {
          // Create custom marker element if needed
          let element = null;
          if (markerData.element) {
            element = markerData.element;
          } else if (markerData.color) {
            element = document.createElement('div');
            element.style.width = '25px';
            element.style.height = '25px';
            element.style.borderRadius = '50%';
            element.style.backgroundColor = markerData.color;
            element.style.border = '2px solid white';
            element.style.cursor = 'pointer';
            element.style.boxShadow = '0 0 0 2px rgba(0,0,0,0.1)';
          }

          // Create marker
          const marker = new mapboxgl.Marker(element || { color: markerData.color || markerColor })
            .setLngLat([markerData.longitude, markerData.latitude]);
          
          // Add popup if content provided
          if (markerData.popupContent) {
            marker.setPopup(
              new mapboxgl.Popup({ offset: 25 })
                .setHTML(markerData.popupContent)
            );
          }
          
          // Add to map
          marker.addTo(map);
          
          // Add click handler if provided
          if (markerData.onClick && element) {
            element.addEventListener('click', markerData.onClick);
          }
          
          // Store reference to marker
          markersRef.current.push(marker);
        } catch (error) {
          console.error('Error adding marker:', error);
        }
      });
    }

    // Clean up on unmount
    return () => {
      if (map) map.remove();
      if (mainMarker) mainMarker.remove();
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
    };
  }, []);

  // Start or stop real-time tracking
  useEffect(() => {
    if (enableRealTimeTracking && !isTracking) {
      startRealTimeTracking();
    } else if (!enableRealTimeTracking && isTracking) {
      stopRealTimeTracking();
    }

    return () => {
      if (watchPositionId.current) {
        stopRealTimeTracking();
      }
    };
  }, [enableRealTimeTracking]);

  // Update user marker when userLocation changes
  useEffect(() => {
    if (mapInstance.current && userLocation && enableRealTimeTracking) {
      updateUserMarker(userLocation.longitude, userLocation.latitude);
    }
  }, [userLocation, enableRealTimeTracking]);

  // Function to start real-time tracking
  const startRealTimeTracking = () => {
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by this browser.");
      return;
    }

    // Create user marker if it doesn't exist
    if (!userMarkerRef.current && mapInstance.current) {
      const el = document.createElement('div');
      el.className = 'user-location-marker';
      el.style.width = '25px';
      el.style.height = '25px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = '#4285F4';
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 0 5px rgba(0,0,0,0.5)';
      el.style.position = 'relative';
      
      // Add pulsing effect
      const pulse = document.createElement('div');
      pulse.style.position = 'absolute';
      pulse.style.width = '25px';
      pulse.style.height = '25px';
      pulse.style.borderRadius = '50%';
      pulse.style.backgroundColor = 'rgba(66, 133, 244, 0.4)';
      pulse.style.border = '3px solid rgba(66, 133, 244, 0.4)';
      pulse.style.animation = 'pulse 1.5s infinite';
      pulse.style.boxSizing = 'border-box';
      pulse.style.top = '0';
      pulse.style.left = '0';
      el.appendChild(pulse);
      
      // Add CSS animation
      const style = document.createElement('style');
      style.innerHTML = `
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          70% { transform: scale(2); opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
      
      // Create the marker
      userMarkerRef.current = new mapboxgl.Marker(el)
        .setLngLat([location.longitude, location.latitude])
        .addTo(mapInstance.current);
    }

    // Start watching position
    watchPositionId.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        console.log(`Real-time location updated with accuracy: ${accuracy} meters`);
        
        const newLocation = { latitude, longitude };
        
        // Update user marker position
        updateUserMarker(longitude, latitude);
        
        // Call the callback if provided
        if (onLocationChange) {
          onLocationChange(newLocation);
        }
      },
      (error) => {
        console.error("Error tracking location:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0 // Always get a fresh position
      }
    );
    
    setIsTracking(true);
  };

  // Function to stop real-time tracking
  const stopRealTimeTracking = () => {
    if (watchPositionId.current) {
      navigator.geolocation.clearWatch(watchPositionId.current);
      watchPositionId.current = null;
    }
    setIsTracking(false);
  };

  // Function to update user marker position
  const updateUserMarker = (longitude, latitude) => {
    if (userMarkerRef.current) {
      userMarkerRef.current.setLngLat([longitude, latitude]);
    }
    
    // If we're showing directions, check if we need to recalculate the route
    if (showDirections && routeCoordinates && routeCoordinates.length > 0) {
      // In a real implementation, you might want to check the distance from the route
      // and only recalculate if the user has deviated significantly
      
      // For now, we'll just update the map view to keep the user and route visible
      if (mapInstance.current) {
        const bounds = new mapboxgl.LngLatBounds();
        
        // Add user location to bounds
        bounds.extend([longitude, latitude]);
        
        // Add destination (last point in route) to bounds
        const destination = routeCoordinates[routeCoordinates.length - 1];
        bounds.extend(destination);
        
        // Fit map to bounds
        mapInstance.current.fitBounds(bounds, {
          padding: 100,
          maxZoom: 15
        });
      }
    }
  };

  // Add or update route on the map when routeCoordinates change
  useEffect(() => {
    if (mapInstance.current && routeCoordinates && showDirections) {
      // Remove existing route if it exists
      if (routeRef.current) {
        if (mapInstance.current.getSource('route')) {
          mapInstance.current.removeLayer('route-layer');
          mapInstance.current.removeSource('route');
        }
      }

      // Add the route to the map
      if (mapInstance.current.loaded()) {
        addRouteToMap();
      } else {
        mapInstance.current.on('load', addRouteToMap);
      }
    }
  }, [routeCoordinates, showDirections]);

  // Function to add route to map
  const addRouteToMap = () => {
    if (!mapInstance.current || !routeCoordinates) return;

    // Check if the map is already loaded and has the source
    if (mapInstance.current.getSource('route')) {
      mapInstance.current.removeLayer('route-layer');
      mapInstance.current.removeSource('route');
    }

    // Add the route source
    mapInstance.current.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: routeCoordinates
        }
      }
    });

    // Add the route layer
    mapInstance.current.addLayer({
      id: 'route-layer',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#3887be',
        'line-width': 5,
        'line-opacity': 0.75
      }
    });

    // Store reference to route
    routeRef.current = true;

    // Fit the map to the route
    if (routeCoordinates.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      routeCoordinates.forEach(coord => bounds.extend(coord));
      
      mapInstance.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15
      });
    }
  };

  // Update marker position when location changes
  useEffect(() => {
    if (mainMarker && mapInstance.current) {
      mainMarker.setLngLat([location.longitude, location.latitude]);
      
      mapInstance.current.flyTo({
        center: [location.longitude, location.latitude],
        zoom: initialZoom,
        essential: true // This animation is considered essential for the user experience
      });
    }
  }, [location, initialZoom]);

  // Update markers when markers prop changes
  useEffect(() => {
    if (mapInstance.current && markers && markers.length > 0) {
      // Remove existing markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      
      // Add new markers
      markers.forEach(markerData => {
        try {
          // Create custom marker element if needed
          let element = null;
          if (markerData.element) {
            element = markerData.element;
          } else if (markerData.color) {
            element = document.createElement('div');
            element.style.width = '25px';
            element.style.height = '25px';
            element.style.borderRadius = '50%';
            element.style.backgroundColor = markerData.color;
            element.style.border = '2px solid white';
            element.style.cursor = 'pointer';
            element.style.boxShadow = '0 0 0 2px rgba(0,0,0,0.1)';
          }

          // Create marker
          const marker = new mapboxgl.Marker(element || { color: markerData.color || markerColor })
            .setLngLat([markerData.longitude, markerData.latitude]);
          
          // Add popup if content provided
          if (markerData.popupContent) {
            marker.setPopup(
              new mapboxgl.Popup({ offset: 25 })
                .setHTML(markerData.popupContent)
            );
          }
          
          // Add to map
          marker.addTo(mapInstance.current);
          
          // Add click handler if provided
          if (markerData.onClick && element) {
            element.addEventListener('click', markerData.onClick);
          }
          
          // Store reference to marker
          markersRef.current.push(marker);
        } catch (error) {
          console.error('Error adding marker:', error);
        }
      });
    }
  }, [markers, markerColor]);

  // Function to locate user
  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          console.log(`Location obtained with accuracy: ${accuracy} meters`);
          
          const newLocation = { latitude, longitude };
          setLocation(newLocation);
          
          // Call the callback if provided
          if (onLocationChange) {
            onLocationChange(newLocation);
          }
          
          // Fly to the new location
          if (mapInstance.current) {
            mapInstance.current.flyTo({
              center: [longitude, latitude],
              zoom: initialZoom,
              essential: true
            });
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          alert(`Could not get your location: ${error.message}. Please try again.`);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0 // Always get a fresh position
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  return (
    <div style={{ position: "relative", width, height }}>
      <div
        ref={mapContainer}
        style={{ width: "100%", height: "100%", borderRadius: "4px" }}
      />
      <div style={{
        position: "absolute",
        bottom: "10px",
        right: "10px",
        zIndex: 1,
        display: "flex",
        flexDirection: "column",
        gap: "10px"
      }}>
        {enableRealTimeTracking ? (
          <button
            onClick={stopRealTimeTracking}
            style={{
              padding: "8px 12px",
              borderRadius: "5px",
              border: "none",
              backgroundColor: "#4285F4",
              color: "white",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.3)"
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18"></path>
              <path d="M6 6l12 12"></path>
            </svg>
            Stop Tracking
          </button>
        ) : (
          <button
            onClick={handleLocateMe}
            style={{
              padding: "8px 12px",
              borderRadius: "5px",
              border: "none",
              backgroundColor: "#FF3A3A",
              color: "white",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.3)"
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            Locate Me
          </button>
        )}
      </div>
    </div>
  );
};

export default MapComponent;