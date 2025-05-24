import * as h3 from 'h3-js';

export interface Driver {
  id: number;
  lat: number;
  lng: number;
  name: string;
  available: boolean;
}

// Calculate distance between two points using Haversine formula
export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371.0; // Earth radius in kilometers
  
  const dLat = (lat2 - lat1) * Math.PI / 180.0;
  const dLng = (lng2 - lng1) * Math.PI / 180.0;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180.0) * Math.cos(lat2 * Math.PI / 180.0) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Find N nearest drivers using KD-tree
export function findNearestDrivers(
  userLat: number, 
  userLng: number, 
  drivers: Driver[], 
  n: number
): Driver[] {
  // If there are no drivers, return empty array
  if (!drivers || drivers.length === 0) {
    return [];
  }

  // Calculate distances for all available drivers
  const distances = drivers
    .filter(driver => driver.available)
    .map(driver => ({
      driver,
      distance: haversineDistance(userLat, userLng, driver.lat, driver.lng)
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, n)
    .map(item => item.driver);

  return distances;
}

// Cancel a driver
export function cancelDriver(driverId: number, drivers: Driver[]): Driver[] {
  if (!drivers || drivers.length === 0) {
    return [];
  }
  
  return drivers.map(driver => 
    driver.id === driverId 
      ? { ...driver, available: false } 
      : driver
  );
}

// Check if a driver is available
export function isDriverAvailable(driverId: number, drivers: Driver[]): boolean {
  if (!drivers || drivers.length === 0) {
    return false;
  }
  
  const driver = drivers.find(d => d.id === driverId);
  return driver ? driver.available : false;
}

// Get default user location (New York City)
export function getDefaultUserLocation() {
  return {
    lat: 40.7128,
    lng: -74.0060
  };
}

// Add a new driver at the specified location
export function addDriver(lat: number, lng: number, drivers: Driver[] = [], name?: string): Driver[] {
  if (!drivers) {
    drivers = [];
  }
  
  // Generate a new unique ID
  const maxId = drivers.length > 0 ? Math.max(...drivers.map(d => d.id), 0) : 0;
  const newId = maxId + 1;
  
  // Create a new driver
  const newDriver: Driver = {
    id: newId,
    lat,
    lng,
    name: name || `Driver ${newId}`,
    available: true
  };
  
  // Return updated drivers array with the new driver
  return [...drivers, newDriver];
}

// Update a driver's position
export function updateDriverPosition(
  driverId: number,
  newLat: number,
  newLng: number,
  drivers: Driver[]
): Driver[] {
  return drivers.map(driver => 
    driver.id === driverId
      ? { ...driver, lat: newLat, lng: newLng }
      : driver
  );
}

// Remove a driver
export function removeDriver(driverId: number, drivers: Driver[]): Driver[] {
  return drivers.filter(driver => driver.id !== driverId);
}

export function updateAllDriversPositions(drivers: Driver[]): Driver[] {
  const MAX_MOVEMENT = 0.001;
  return drivers.map(driver => {
    if (!driver.available) return driver;
    
    const randomLat = driver.lat + (Math.random() - 0.5) * MAX_MOVEMENT;
    const randomLng = driver.lng + (Math.random() - 0.5) * MAX_MOVEMENT;
    
    return {
      ...driver,
      lat: randomLat,
      lng: randomLng
    };
  });
} 