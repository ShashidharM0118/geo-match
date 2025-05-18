#include <iostream>
#include <vector>
#include <algorithm>
#include <cmath>
#include <string>
#include <sstream>

// Structure to represent a driver
struct Driver {
    int id;
    double lat;
    double lng;
    std::string name;
    bool available;
};

// Function to calculate distance between two points using Haversine formula
double haversineDistance(double lat1, double lng1, double lat2, double lng2) {
    const double R = 6371.0; // Earth radius in kilometers
    
    double dLat = (lat2 - lat1) * M_PI / 180.0;
    double dLng = (lng2 - lng1) * M_PI / 180.0;
    
    double a = sin(dLat/2) * sin(dLat/2) +
               cos(lat1 * M_PI / 180.0) * cos(lat2 * M_PI / 180.0) * 
               sin(dLng/2) * sin(dLng/2);
    
    double c = 2 * atan2(sqrt(a), sqrt(1-a));
    return R * c;
}

// Function to find N nearest drivers
std::vector<Driver> findNearestDrivers(double userLat, double userLng, 
                                      std::vector<Driver>& drivers, int n) {
    // Calculate distances
    std::vector<std::pair<double, Driver>> distances;
    
    for (const auto& driver : drivers) {
        if (driver.available) {
            double distance = haversineDistance(userLat, userLng, driver.lat, driver.lng);
            distances.push_back({distance, driver});
        }
    }
    
    // Sort by distance
    std::sort(distances.begin(), distances.end(), 
              [](const auto& a, const auto& b) {
                  return a.first < b.first;
              });
    
    // Get top N drivers
    std::vector<Driver> nearestDrivers;
    int count = 0;
    for (const auto& pair : distances) {
        if (count >= n) break;
        nearestDrivers.push_back(pair.second);
        count++;
    }
    
    return nearestDrivers;
}

// Function to cancel a driver
void cancelDriver(int driverId, std::vector<Driver>& drivers) {
    for (auto& driver : drivers) {
        if (driver.id == driverId) {
            driver.available = false;
            break;
        }
    }
}

// Main function for testing
int main() {
    // Sample drivers
    std::vector<Driver> drivers = {
        {1, 40.7128, -74.0060, "John", true},
    };
    
    // User location (New York)
    double userLat = 40.7128;
    double userLng = -74.0060;
    
    // Find 5 nearest drivers
    auto nearestDrivers = findNearestDrivers(userLat, userLng, drivers, 5);
    
    // Print results
    std::cout << "Top 5 nearest drivers:" << std::endl;
    for (const auto& driver : nearestDrivers) {
        std::cout << "Driver ID: " << driver.id << ", Name: " << driver.name << std::endl;
    }
    
    // Cancel a driver
    cancelDriver(1, drivers);
    
    // Find nearest drivers again
    nearestDrivers = findNearestDrivers(userLat, userLng, drivers, 5);
    
    // Print updated results
    std::cout << "\nTop 5 nearest drivers after cancellation:" << std::endl;
    for (const auto& driver : nearestDrivers) {
        std::cout << "Driver ID: " << driver.id << ", Name: " << driver.name << std::endl;
    }
    
    return 0;
} 