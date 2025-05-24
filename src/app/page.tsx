'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { findNearestDrivers, cancelDriver, getDefaultUserLocation, Driver, addDriver, updateAllDriversPositions } from '@/lib/driverUtils';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';

// Dynamically import MapComponent to avoid SSR issues with Leaflet
const DynamicMapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] w-full flex items-center justify-center bg-gray-100 rounded-lg">
      <p>Loading Map...</p>
    </div>
  ),
});

export default function Home() {
  const [activeTab, setActiveTab] = useState('visualization');
  const [userLocation, setUserLocation] = useState(getDefaultUserLocation());
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [nearestDrivers, setNearestDrivers] = useState<Driver[]>([]);

  // Use localStorage to persist driver data between tabs
  useEffect(() => {
    // Try to get data from localStorage
    const storedDrivers = localStorage.getItem('drivers');
    const storedNearestDrivers = localStorage.getItem('nearestDrivers');
    
    if (storedDrivers) {
      setDrivers(JSON.parse(storedDrivers));
    }
    
    if (storedNearestDrivers) {
      setNearestDrivers(JSON.parse(storedNearestDrivers));
    } else {
      // Initialize nearest drivers if not in localStorage
      const nearest = findNearestDrivers(userLocation.lat, userLocation.lng, drivers, 5);
      setNearestDrivers(nearest);
      localStorage.setItem('nearestDrivers', JSON.stringify(nearest));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update localStorage when drivers or nearest drivers change
  useEffect(() => {
    localStorage.setItem('drivers', JSON.stringify(drivers));
    localStorage.setItem('nearestDrivers', JSON.stringify(nearestDrivers));
  }, [drivers, nearestDrivers]);

  // Function to handle driver cancellation
  const handleCancelDriver = (driverId: number) => {
    // Update drivers list
    const updatedDrivers = cancelDriver(driverId, drivers);
    setDrivers(updatedDrivers);
    
    // Get the new nearest drivers
    const nearest = findNearestDrivers(userLocation.lat, userLocation.lng, updatedDrivers, 5);
    setNearestDrivers(nearest);
    
    toast.success(`Driver #${driverId} has been canceled`, {
      description: 'Refreshing with the next 5 nearest drivers',
    });
  };

  // Function to handle adding a new driver from the map
  const handleAddDriver = (lat: number, lng: number) => {
    const updatedDrivers = addDriver(lat, lng, drivers);
    setDrivers(updatedDrivers);
    
    // Get the new nearest drivers
    const nearest = findNearestDrivers(userLocation.lat, userLocation.lng, updatedDrivers, 5);
    setNearestDrivers(nearest);
    
    toast.success('New driver added', {
      description: `Driver added at location [${lat.toFixed(6)}, ${lng.toFixed(6)}]`,
    });
  };

  // Function to get user's current location
  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(newLocation);
          
          // Update nearest drivers based on new location
          const nearest = findNearestDrivers(newLocation.lat, newLocation.lng, drivers, 5);
          setNearestDrivers(nearest);
          
          toast.success('Location updated', {
            description: 'Using your current location',
          });
        },
        () => {
          toast.error('Unable to retrieve your location', {
            description: 'Using default location instead',
          });
        }
      );
    } else {
      toast.error('Geolocation is not supported by this browser', {
        description: 'Using default location instead',
      });
    }
  };

  // Clear all drivers
  const handleClearDrivers = () => {
    setDrivers([]);
    setNearestDrivers([]);
    
    toast.success('All drivers cleared', {
      description: 'The map has been reset',
    });
    
    // Also clear localStorage
    localStorage.removeItem('drivers');
    localStorage.removeItem('nearestDrivers');
  };

  const handleUpdateAllDrivers = () => {
    const updatedDrivers = updateAllDriversPositions(drivers);
    setDrivers(updatedDrivers);
    
    const nearest = findNearestDrivers(userLocation.lat, userLocation.lng, updatedDrivers, 5);
    setNearestDrivers(nearest);
    
    toast.success('All drivers updated', {
      description: 'Driver positions have been randomly updated',
    });
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="container mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-indigo-700">KD-Tree Driver Finder</h1>
          {/*<p className="text-gray-600 max-w-2xl mx-auto">*/}
          {/*  Visualize the top 5 nearest drivers using KD-tree algorithm implementation in C++*/}
          {/*</p>*/}
        </div>
        
        <div className="flex justify-center gap-4 my-6">
          <Button onClick={handleGetCurrentLocation}>
            Use My Current Location
          </Button>
          <Button variant="destructive" onClick={handleClearDrivers}>
            Clear All Drivers
          </Button>
          <Button variant="secondary" onClick={handleUpdateAllDrivers}>
            Update All Drivers
          </Button>
        </div>
        
        <Tabs 
          defaultValue="visualization" 
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="visualization">Driver Visualization</TabsTrigger>
            <TabsTrigger value="management">Driver Management</TabsTrigger>
          </TabsList>
          
          <TabsContent value="visualization" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Top 5 Nearest Drivers</CardTitle>
                <CardDescription>
                  Visualizing nearest drivers from your current location using KD-tree
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DynamicMapComponent 
                  userLocation={userLocation}
                  drivers={nearestDrivers}
                />
                {nearestDrivers.length === 0 && (
                  <div className="text-center p-4 mt-4 bg-gray-100 rounded-md">
                    <p className="text-gray-500">No drivers available. Add drivers in the Management tab.</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Nearest Drivers List</CardTitle>
              </CardHeader>
              <CardContent>
                {nearestDrivers.length > 0 ? (
                  <div className="space-y-4">
                    {nearestDrivers.map((driver) => (
                      <div 
                        key={driver.id} 
                        className="p-4 border rounded-lg flex justify-between items-center bg-white"
                      >
                        <div>
                          <p className="font-medium">{driver.name}</p>
                          <p className="text-sm text-gray-500">
                            ID: {driver.id} • Location: {driver.lat.toFixed(4)}, {driver.lng.toFixed(4)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-4 bg-gray-100 rounded-md">
                    <p className="text-gray-500">No drivers available. Add drivers in the Management tab.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="management" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Driver Management</CardTitle>
                <CardDescription>
                  Manage drivers - click on the map to add a new driver, or cancel existing ones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DynamicMapComponent 
                  userLocation={userLocation}
                  drivers={drivers}
                  onDriverCancel={handleCancelDriver}
                  onAddDriver={handleAddDriver}
                  isManagementMode={true}
                />
                {drivers.length === 0 && (
                  <div className="text-center p-4 mt-4 bg-blue-50 rounded-md">
                    <p className="text-blue-700">Click anywhere on the map to add your first driver!</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>All Drivers</CardTitle>
              </CardHeader>
              <CardContent>
                {drivers.length > 0 ? (
                  <div className="space-y-4">
                    {drivers.map((driver) => (
                      <div 
                        key={driver.id} 
                        className="p-4 border rounded-lg flex justify-between items-center bg-white"
                      >
                        <div>
                          <p className="font-medium">{driver.name}</p>
                          <p className="text-sm text-gray-500">
                            ID: {driver.id} • Location: {driver.lat.toFixed(6)}, {driver.lng.toFixed(6)}
                          </p>
                          <p className="text-xs text-gray-400">
                            Status: {driver.available ? 'Available' : 'Canceled'}
                          </p>
                        </div>
                        {driver.available && (
                          <Button 
                            variant="destructive" 
                            onClick={() => handleCancelDriver(driver.id)}
                          >
                            Cancel Driver
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-4 bg-gray-100 rounded-md">
                    <p className="text-gray-500">No drivers added yet. Click on the map to add drivers.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
} 