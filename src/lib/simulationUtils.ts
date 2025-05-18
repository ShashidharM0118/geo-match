import { Driver, findNearestDrivers } from './driverUtils';

// Constants for simulation
const MAX_SPEED = 0.0005; // Maximum movement per tick (in lat/lng units)
const DIRECTION_CHANGE_PROBABILITY = 0.2; // Probability to change direction each tick
const UPDATE_INTERVAL = 500; // Update interval in milliseconds (0.5 second)

// Driver movement simulation
interface DriverMovement {
  driverId: number;
  directionX: number;
  directionY: number;
  speed: number;
}

// Keep track of driver movements
let driverMovements: Map<number, DriverMovement> = new Map();

/**
 * Initialize movement data for a driver
 */
const initializeDriverMovement = (driverId: number): DriverMovement => {
  // Random direction vector (normalized)
  const angle = Math.random() * 2 * Math.PI;
  return {
    driverId,
    directionX: Math.cos(angle),
    directionY: Math.sin(angle),
    speed: MAX_SPEED * (0.2 + Math.random() * 0.8), // Between 20-100% of max speed
  };
};

/**
 * Update a driver's position based on its movement vector
 */
const updateDriverPosition = (driver: Driver, movement: DriverMovement): Driver => {
  // Randomly change direction sometimes
  if (Math.random() < DIRECTION_CHANGE_PROBABILITY) {
    const angle = Math.random() * 2 * Math.PI;
    movement.directionX = Math.cos(angle);
    movement.directionY = Math.sin(angle);
    
    // Also randomly adjust speed
    movement.speed = MAX_SPEED * (0.2 + Math.random() * 0.8);
  }
  
  // Calculate new position
  const newLat = driver.lat + movement.directionY * movement.speed;
  const newLng = driver.lng + movement.directionX * movement.speed;
  
  // Update driver position
  return {
    ...driver,
    lat: newLat,
    lng: newLng,
  };
};

/**
 * Start the real-time driver simulation
 */
export const startDriverSimulation = (
  setDrivers: React.Dispatch<React.SetStateAction<Driver[]>>,
  setNearestDrivers: React.Dispatch<React.SetStateAction<Driver[]>>,
  userLocation: { lat: number; lng: number }
) => {
  // Clear any existing interval
  stopDriverSimulation();
  
  // Store the reference to the current user location
  let currentUserLocation = { ...userLocation };
  
  // Function to update user location reference
  (window as any).__updateSimulationUserLocation = (newLocation: { lat: number; lng: number }) => {
    currentUserLocation = { ...newLocation };
  };
  
  // Reference to the interval for cleanup
  const intervalId = setInterval(() => {
    setDrivers(currentDrivers => {
      // Create a new array to avoid mutations
      const updatedDrivers = currentDrivers.map(driver => {
        // Skip unavailable drivers
        if (!driver.available) return driver;
        
        // Get or initialize movement data for this driver
        let movement = driverMovements.get(driver.id);
        if (!movement) {
          movement = initializeDriverMovement(driver.id);
          driverMovements.set(driver.id, movement);
        }
        
        // Update the driver's position
        return updateDriverPosition(driver, movement);
      });
      
      // Also update nearest drivers
      const nearest = findNearestDrivers(
        currentUserLocation.lat, 
        currentUserLocation.lng, 
        updatedDrivers, 
        5
      );
      
      // Use setTimeout to avoid state update conflicts
      setTimeout(() => {
        setNearestDrivers(nearest);
      }, 0);
      
      return updatedDrivers;
    });
  }, UPDATE_INTERVAL);
  
  // Store the interval ID in window for cleanup
  (window as any).__driverSimulationInterval = intervalId;
  
  return intervalId;
};

/**
 * Update the user location for the ongoing simulation
 */
export const updateSimulationUserLocation = (userLocation: { lat: number; lng: number }) => {
  if (typeof window !== 'undefined' && (window as any).__updateSimulationUserLocation) {
    (window as any).__updateSimulationUserLocation(userLocation);
  }
};

/**
 * Stop the driver simulation
 */
export const stopDriverSimulation = () => {
  if (typeof window !== 'undefined') {
    if ((window as any).__driverSimulationInterval) {
      clearInterval((window as any).__driverSimulationInterval);
      (window as any).__driverSimulationInterval = null;
    }
    
    // Clear updater function
    (window as any).__updateSimulationUserLocation = null;
  }
  
  // Clear movement data
  driverMovements.clear();
}; 