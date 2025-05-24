'use client';

import { useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Driver } from '@/lib/driverUtils';
import { mapStyles } from '@/lib/mapStyles';

// Component to update map center when props change
function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMapEvents({});
  map.setView(center, zoom);
  return null;
}

// Component to handle map clicks for adding drivers
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface MapComponentProps {
  userLocation: { lat: number; lng: number };
  drivers: Driver[];
  onDriverCancel?: (driverId: number) => void;
  onAddDriver?: (lat: number, lng: number) => void;
  isManagementMode?: boolean;
}

const MapComponent: React.FC<MapComponentProps> = ({
  userLocation,
  drivers,
  onDriverCancel,
  onAddDriver,
  isManagementMode = false,
}) => {
  const center: [number, number] = [userLocation.lat, userLocation.lng];
  const zoom = 17; // Higher zoom level

  // Create simple icon divs for markers instead of images
  const createSimpleIcon = (color: string, text: string) => {
    return L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: ${color}; color: white; 
             width: 30px; height: 30px; border-radius: 50%; 
             display: flex; align-items: center; justify-content: center;
             font-weight: bold; border: 2px solid white;
             cursor: pointer;">${text}</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15],
    });
  };

  // User and driver icons
  const userIcon = createSimpleIcon('#4a89dc', 'You');
  
  // Handle map click to add a new driver
  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (isManagementMode && onAddDriver) {
      onAddDriver(lat, lng);
    }
  }, [isManagementMode, onAddDriver]);

  // Add style tag for cursor styles
  useEffect(() => {
    const styleTag = document.createElement('style');
    styleTag.innerHTML = mapStyles;
    document.head.appendChild(styleTag);
    
    return () => {
      document.head.removeChild(styleTag);
    };
  }, []);
  
  return (
    <div className="flex flex-col h-[600px] w-full">
      <div className="flex justify-end items-center mb-2 px-2">
        {isManagementMode && onAddDriver && (
          <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-md">
            Click on map to add a driver
          </div>
        )}
      </div>
      <div className={`flex-grow rounded-lg overflow-hidden border border-gray-200 ${isManagementMode ? 'management-mode' : ''}`}>
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <ChangeView center={center} zoom={zoom} />
          {isManagementMode && onAddDriver && (
            <MapClickHandler onMapClick={handleMapClick} />
          )}
          
          {/* Plain map layer */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* User Marker */}
          <Marker position={center} icon={userIcon}>
            <Tooltip permanent direction="top" offset={[0, -10]}>
              Your Location
            </Tooltip>
            <Popup>
              <div className="font-medium">Your Current Location</div>
              <div className="text-xs text-gray-500">
                Lat: {userLocation.lat.toFixed(6)}, Lng: {userLocation.lng.toFixed(6)}
              </div>
            </Popup>
          </Marker>
          
          {/* Driver Markers */}
          {drivers.map((driver) => {
            // Create a unique icon for each driver with first letter of name or ID number
            const driverInitial = driver.name.charAt(0) || driver.id.toString();
            const driverIcon = createSimpleIcon(
              driver.available ? '#5cb85c' : '#d9534f', 
              driverInitial
            );
            
            return (
              <Marker
                key={driver.id}
                position={[driver.lat, driver.lng]}
                icon={driverIcon}
              >
                <Tooltip permanent direction="top" offset={[0, -10]}>
                  {driver.name}
                </Tooltip>
                <Popup>
                  <div className="flex flex-col gap-2">
                    <p className="font-medium">{driver.name}</p>
                    <p className="text-sm text-gray-500">Driver ID: {driver.id}</p>
                    <p className="text-xs text-gray-400">Lat: {driver.lat.toFixed(6)}, Lng: {driver.lng.toFixed(6)}</p>
                    {onDriverCancel && driver.available && (
                      <button
                        onClick={() => onDriverCancel(driver.id)}
                        className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600 transition-colors cursor-pointer"
                      >
                        Cancel Driver
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};

export default MapComponent; 