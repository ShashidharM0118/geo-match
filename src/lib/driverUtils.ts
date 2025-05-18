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

// Find N nearest drivers
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

  try {
    // Get the H3 index for the user location at resolution 9
    const userH3Index = h3.latLngToCell(userLat, userLng, 9);
    
    // Calculate distances and use H3 for optimization
    const distances = drivers
      .filter(driver => driver.available)
      .map(driver => {
        try {
          // Get H3 index for driver
          const driverH3Index = h3.latLngToCell(driver.lat, driver.lng, 9);
          
          // Calculate H3 grid distance
          const gridDistance = h3.gridDistance(userH3Index, driverH3Index);
          
          // Use haversine for actual distance calculation
          const distance = haversineDistance(userLat, userLng, driver.lat, driver.lng);
          
          return { driver, distance, gridDistance };
        } catch (_error) {
          // If H3 calculation fails for a driver, fall back to haversine distance only
          const distance = haversineDistance(userLat, userLng, driver.lat, driver.lng);
          return { driver, distance, gridDistance: Number.MAX_SAFE_INTEGER };
        }
      })
      // Sort first by H3 grid distance, then by actual distance
      .sort((a, b) => a.gridDistance - b.gridDistance || a.distance - b.distance)
      .slice(0, n)
      .map(item => item.driver);

    return distances;
  } catch (error) {
    console.error("Error in findNearestDrivers:", error);
    
    // Fallback to simple distance calculation
    return drivers
      .filter(driver => driver.available)
      .map(driver => ({
        driver,
        distance: haversineDistance(userLat, userLng, driver.lat, driver.lng)
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, n)
      .map(item => item.driver);
  }
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
  return { lat: 40.7128, lng: -74.0060 };
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