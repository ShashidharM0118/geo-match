#include <iostream>
#include <vector>
#include <algorithm>
#include <cmath>
#include <memory>
#include <limits>

struct Driver {
    int id;
    double lat;
    double lng;
    std::string name;
    bool available;
};

struct KDNode {
    Driver driver;
    std::shared_ptr<KDNode> left;
    std::shared_ptr<KDNode> right;
    int depth;

    KDNode(const Driver& d, int dpt) : driver(d), left(nullptr), right(nullptr), depth(dpt) {}
};

// KD-tree class
class KDTree {
private:
    std::shared_ptr<KDNode> root;

    // Calculate squared distance between two points
    double squaredDistance(double lat1, double lng1, double lat2, double lng2) {
        double dlat = lat2 - lat1;
        double dlng = lng2 - lng1;
        return dlat * dlat + dlng * dlng;
    }


    std::shared_ptr<KDNode> insertRecursive(std::shared_ptr<KDNode> node, const Driver& driver, int depth) {
        if (!node) {
            return std::make_shared<KDNode>(driver, depth);
        }

        bool useLat = (depth % 2 == 0);
        double currentValue = useLat ? node->driver.lat : node->driver.lng;
        double newValue = useLat ? driver.lat : driver.lng;

        if (newValue < currentValue) {
            node->left = insertRecursive(node->left, driver, depth + 1);
        } else {
            node->right = insertRecursive(node->right, driver, depth + 1);
        }

        return node;
    }


    void findNearestNeighborsRecursive(
        std::shared_ptr<KDNode> node,
        double targetLat,
        double targetLng,
        int k,
        std::vector<std::pair<double, Driver>>& nearest,
        int depth
    ) {
        if (!node) return;


        double dist = squaredDistance(targetLat, targetLng, node->driver.lat, node->driver.lng);


        if (node->driver.available) {
            if (nearest.size() < k) {
                nearest.push_back({dist, node->driver});
                std::sort(nearest.begin(), nearest.end());
            } else if (dist < nearest.back().first) {
                nearest.back() = {dist, node->driver};
                std::sort(nearest.begin(), nearest.end());
            }
        }

        // Determine which branch to explore first
        bool useLat = (depth % 2 == 0);
        double currentValue = useLat ? node->driver.lat : node->driver.lng;
        double targetValue = useLat ? targetLat : targetLng;

        std::shared_ptr<KDNode> first = (targetValue < currentValue) ? node->left : node->right;
        std::shared_ptr<KDNode> second = (targetValue < currentValue) ? node->right : node->left;

        // Explore first branch
        if (first) {
            findNearestNeighborsRecursive(first, targetLat, targetLng, k, nearest, depth + 1);
        }

        // Check if we need to explore second branch
        if (second && nearest.size() < k) {
            double axisDist = (targetValue - currentValue) * (targetValue - currentValue);
            if (axisDist < nearest.back().first) {
                findNearestNeighborsRecursive(second, targetLat, targetLng, k, nearest, depth + 1);
            }
        }
    }

    // Delete a driver from the KD-tree
    std::shared_ptr<KDNode> deleteRecursive(std::shared_ptr<KDNode> node, const Driver& driver, int depth) {
        if (!node) return nullptr;

        bool useLat = (depth % 2 == 0);
        double currentValue = useLat ? node->driver.lat : node->driver.lng;
        double targetValue = useLat ? driver.lat : driver.lng;

        if (node->driver.id == driver.id) {
            // Node to delete found
            if (!node->right) {
                return node->left;
            }
            if (!node->left) {
                return node->right;
            }

            // Find minimum in right subtree
            std::shared_ptr<KDNode> minNode = node->right;
            while (minNode->left) {
                minNode = minNode->left;
            }

            // Copy minimum node's data
            node->driver = minNode->driver;

            // Delete minimum node
            node->right = deleteRecursive(node->right, minNode->driver, depth + 1);
        } else if (targetValue < currentValue) {
            node->left = deleteRecursive(node->left, driver, depth + 1);
        } else {
            node->right = deleteRecursive(node->right, driver, depth + 1);
        }

        return node;
    }

public:
    KDTree() : root(nullptr) {}

    // Insert a driver
    void insert(const Driver& driver) {
        root = insertRecursive(root, driver, 0);
    }

    // Find k nearest neighbors
    std::vector<Driver> findNearestNeighbors(double targetLat, double targetLng, int k) {
        std::vector<std::pair<double, Driver>> nearest;
        findNearestNeighborsRecursive(root, targetLat, targetLng, k, nearest, 0);
        
        std::vector<Driver> result;
        for (const auto& pair : nearest) {
            result.push_back(pair.second);
        }
        return result;
    }

    // Delete a driver
    void remove(const Driver& driver) {
        root = deleteRecursive(root, driver, 0);
    }

    // Update a driver's position
    void update(const Driver& driver) {
        remove(driver);
        insert(driver);
    }
};

// Main function for testing
int main() {
    KDTree tree;
    
    // Sample drivers
    std::vector<Driver> drivers = {
        {1, 40.7128, -74.0060, "John", true},
        {2, 40.7589, -73.9851, "Alice", true},
        {3, 40.7829, -73.9654, "Bob", true}
    };

    // Insert drivers
    for (const auto& driver : drivers) {
        tree.insert(driver);
    }

    // Test finding nearest neighbors
    double userLat = 40.7128;
    double userLng = -74.0060;
    auto nearest = tree.findNearestNeighbors(userLat, userLng, 2);

    std::cout << "Nearest drivers:" << std::endl;
    for (const auto& driver : nearest) {
        std::cout << "Driver ID: " << driver.id << ", Name: " << driver.name << std::endl;
    }

    return 0;
} 