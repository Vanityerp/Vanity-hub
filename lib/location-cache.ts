/**
 * Location Cache Service
 *
 * This service provides a centralized cache for location data to ensure
 * consistent location information across the application.
 */

import { Location, SettingsStorage } from "@/lib/settings-storage"
import { locationEventBus } from "@/lib/location-event-bus"

class LocationCacheService {
  private cache: Map<string, Location> = new Map()
  private initialized: boolean = false
  private specialLocations: Map<string, Location> = new Map()

  constructor() {
    // Initialize default special locations
    const defaultHomeService = {
      id: "home",
      name: "Home Service",
      address: "Client's Location",
      city: "Doha",
      state: "Doha",
      zipCode: "",
      country: "Qatar",
      phone: "(974) 456-7890",
      email: "homeservice@salonhub.com",
      status: "Active",
      description: "We come to you! Available within city limits.",
      enableOnlineBooking: true,
      displayOnWebsite: true,
      staffCount: 4,
      servicesCount: 8,
    };

    // Set default home service location
    this.specialLocations.set("home", defaultHomeService);

    // Set default online location for client portal transactions
    const defaultOnlineLocation: Location = {
      id: "online",
      name: "Online Store",
      address: "Client Portal",
      city: "Online",
      state: "Online",
      zipCode: "",
      country: "Online",
      phone: "",
      email: "support@salonhub.com",
      status: "Active",
      description: "Online orders placed through the client portal",
      enableOnlineBooking: false,
      displayOnWebsite: false,
      staffCount: 0,
      servicesCount: 0,
    };
    this.specialLocations.set("online", defaultOnlineLocation);

    // Try to load saved home service location from storage
    this.loadHomeServiceLocationFromStorage();

    // Subscribe to location events
    locationEventBus.subscribe('location-added', (event) => {
      const location = event.payload as Location
      this.cache.set(location.id, location)
    })

    locationEventBus.subscribe('location-updated', (event) => {
      const location = event.payload as Location
      this.cache.set(location.id, location)
    })

    locationEventBus.subscribe('location-removed', (event) => {
      const locationId = event.payload as string
      this.cache.delete(locationId)
    })

    locationEventBus.subscribe('locations-refreshed', (event) => {
      this.refreshCache()
    })
  }

  /**
   * Initialize the cache with locations from storage
   */
  initialize(): void {
    if (this.initialized) return

    this.refreshCache()
    this.initialized = true
  }

  /**
   * Refresh the cache with the latest locations from storage and database
   */
  async refreshCache(): Promise<void> {
    console.log("LocationCache: Refreshing cache");

    // Check if we should restore the default home service location
    const shouldResetHomeService = typeof window !== 'undefined' &&
      !localStorage.getItem("vanity_home_service_location");

    // Save the current home service location if it exists and we're not resetting
    const currentHomeService = !shouldResetHomeService ? this.cache.get("home") : null;

    if (currentHomeService) {
      console.log("LocationCache: Current home service before refresh:", currentHomeService);
      console.log("LocationCache: Current home service phone before refresh:", currentHomeService.phone);
    }

    // Clear the cache
    this.cache.clear()
    console.log("LocationCache: Cache cleared");

    // Load locations from database API (primary source)
    try {
      await this.loadLocationsFromDatabase();
    } catch (error) {
      console.warn("LocationCache: Failed to load database locations:", error);

      // Fallback to localStorage only if database fails
      const localStorageLocations = SettingsStorage.getLocations()
      const filteredLocalStorageLocations = localStorageLocations.filter(
        loc => loc.id !== "home" && loc.name !== "Home Service"
      )

      filteredLocalStorageLocations.forEach(location => {
        // Only add if not already in cache to prevent duplicates
        if (!this.cache.has(location.id)) {
          this.cache.set(location.id, location)
        }
      })
      console.log("LocationCache: Fallback to localStorage locations");
    }

    // Add special locations to cache (only if not already present from database)
    this.specialLocations.forEach((location, id) => {
      if (!this.cache.has(id)) {
        this.cache.set(id, location)
      }
    })
    console.log("LocationCache: Special locations added to cache");

    // If we had a home service location before and we're not resetting, restore it
    if (currentHomeService) {
      console.log("LocationCache: Restoring home service location with phone:", currentHomeService.phone);

      // Create a clean copy with all fields explicitly included
      const cleanHomeService = {
        ...currentHomeService,
        id: "home", // Ensure ID remains "home"
        phone: currentHomeService.phone, // Explicitly include phone to ensure it's preserved
      };

      // Only update if not already present from database to prevent duplicates
      if (!this.cache.has("home")) {
        this.specialLocations.set("home", cleanHomeService);
        this.cache.set("home", cleanHomeService);
        console.log("LocationCache: Home service location restored with phone:", cleanHomeService.phone);
      } else {
        console.log("LocationCache: Home service already exists in cache, skipping restoration");
      }
    } else if (shouldResetHomeService) {
      // Use the default home service location
      const defaultHomeService = this.specialLocations.get("home");
      if (defaultHomeService && !this.cache.has("home")) {
        console.log("LocationCache: Using default home service with phone:", defaultHomeService.phone);
        this.cache.set("home", defaultHomeService);
      }
    } else {
      // Try to load from localStorage only if not already in cache
      if (!this.cache.has("home")) {
        this.loadHomeServiceLocationFromStorage();
        console.log("LocationCache: Attempted to load home service from localStorage");
      }
    }

    // Final verification and deduplication
    const finalHomeService = this.cache.get("home");
    if (finalHomeService) {
      console.log("LocationCache: Final home service after refresh:", finalHomeService);
      console.log("LocationCache: Final home service phone after refresh:", finalHomeService.phone);
    }

    // Final deduplication step - ensure no duplicate IDs exist in cache
    const allCacheEntries = Array.from(this.cache.entries());
    const uniqueEntries = new Map<string, Location>();

    allCacheEntries.forEach(([id, location]) => {
      if (!uniqueEntries.has(id)) {
        uniqueEntries.set(id, location);
      }
    });

    // If duplicates were found, replace the cache with deduplicated entries
    if (allCacheEntries.length !== uniqueEntries.size) {
      console.warn('⚠️ LocationCache - Found and removed duplicate cache entries:',
        allCacheEntries.length - uniqueEntries.size);
      this.cache.clear();
      uniqueEntries.forEach((location, id) => {
        this.cache.set(id, location);
      });
    }
  }

  /**
   * Load locations from database API
   */
  private async loadLocationsFromDatabase(): Promise<void> {
    // Only run in browser environment
    if (typeof window === 'undefined') {
      return;
    }

    try {
      console.log("LocationCache: Loading locations from database API...");
      const response = await fetch('/api/locations');

      if (response.ok) {
        const data = await response.json();
        const dbLocations = data.locations || [];

        console.log(`LocationCache: Loaded ${dbLocations.length} locations from database`);

        // Convert database locations to our Location interface format and add to cache
        dbLocations.forEach((dbLoc: any) => {
          // Include ALL locations from database, including special ones
          const location: Location = {
            id: dbLoc.id,
            name: dbLoc.name,
            address: dbLoc.address || '',
            city: dbLoc.city || '',
            state: dbLoc.state || '',
            zipCode: dbLoc.zipCode || '',
            country: dbLoc.country || '',
            phone: dbLoc.phone || '',
            email: dbLoc.email || '',
            status: dbLoc.isActive ? 'Active' : 'Inactive',
            description: '',
            enableOnlineBooking: true,
            displayOnWebsite: true,
            staffCount: 0,
            servicesCount: 0,
          };

          this.cache.set(location.id, location);

          // If this is a special location, also update the special locations map
          if (dbLoc.id === "home" || dbLoc.id === "online") {
            this.specialLocations.set(dbLoc.id, location);
          }
        });

        console.log("LocationCache: Database locations added to cache");
      } else {
        console.warn("LocationCache: Failed to load locations from database API:", response.statusText);
        throw new Error(`API responded with status: ${response.status}`);
      }
    } catch (error) {
      console.warn("LocationCache: Error loading locations from database API:", error);
      throw error; // Re-throw to trigger fallback in caller
    }
  }

  /**
   * Get all locations (including special locations) with deduplication
   */
  getAllLocations(): Location[] {
    this.initialize()
    const allLocations = Array.from(this.cache.values())

    // Remove duplicates based on name, prioritizing special locations
    const seenNames = new Set<string>()
    const uniqueLocations: Location[] = []

    // First pass: Add special locations (home, online) and mark their names as seen
    allLocations.forEach(location => {
      if (location.id === "home" || location.id === "online") {
        uniqueLocations.push(location)
        seenNames.add(location.name.toLowerCase().trim())
      }
    })

    // Second pass: Add regular locations that don't have duplicate names
    allLocations.forEach(location => {
      // Skip special locations (already added)
      if (location.id === "home" || location.id === "online") {
        return
      }

      const normalizedName = location.name.toLowerCase().trim()

      // Check for name conflicts with special locations or other regular locations
      if (!seenNames.has(normalizedName)) {
        uniqueLocations.push(location)
        seenNames.add(normalizedName)
      }
    })

    // Log warning if duplicates were found and removed
    if (allLocations.length !== uniqueLocations.length) {
      console.warn('⚠️ LocationCache - Removed duplicate locations from cache by name:',
        allLocations.length - uniqueLocations.length)
      const duplicates = allLocations.filter(loc =>
        !uniqueLocations.some(unique => unique.id === loc.id)
      )
      console.warn('⚠️ LocationCache - Duplicate locations removed:',
        duplicates.map(loc => ({ id: loc.id, name: loc.name }))
      )
    }

    return uniqueLocations
  }

  /**
   * Get active locations with deduplication
   */
  getActiveLocations(): Location[] {
    this.initialize()
    const activeLocations = Array.from(this.cache.values()).filter(
      location => location.status === "Active"
    )

    // Remove duplicates based on name (keep the first occurrence)
    // This handles cases where database has duplicate locations with different IDs but same names
    const uniqueActiveLocations = activeLocations.filter((location, index, array) =>
      array.findIndex(loc => loc.name.toLowerCase().trim() === location.name.toLowerCase().trim()) === index
    )

    // Log warning if duplicates were found and removed
    if (activeLocations.length !== uniqueActiveLocations.length) {
      console.warn('⚠️ LocationCache - Removed duplicate active locations from cache by name:',
        activeLocations.length - uniqueActiveLocations.length)
      console.warn('⚠️ LocationCache - Duplicate active locations found:',
        activeLocations.filter((location, index, array) =>
          array.findIndex(loc => loc.name.toLowerCase().trim() === location.name.toLowerCase().trim()) !== index
        ).map(loc => ({ id: loc.id, name: loc.name }))
      )
    }

    return uniqueActiveLocations
  }

  /**
   * Get a location by ID
   */
  getLocationById(id: string): Location | undefined {
    this.initialize()

    // Special case for "all" locations
    if (id === "all") {
      return {
        id: "all",
        name: "All Locations",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
        phone: "",
        email: "",
        status: "Active",
        enableOnlineBooking: false,
        displayOnWebsite: false,
      }
    }

    // Special case for "online" location
    if (id === "online") {
      return {
        id: "online",
        name: "Online Store",
        address: "Client Portal",
        city: "Online",
        state: "Online",
        zipCode: "",
        country: "Online",
        phone: "",
        email: "support@salonhub.com",
        status: "Active",
        description: "Online orders placed through the client portal",
        enableOnlineBooking: false,
        displayOnWebsite: false,
        staffCount: 0,
        servicesCount: 0,
      }
    }

    return this.cache.get(id)
  }

  /**
   * Get a location name by ID
   */
  getLocationName(id: string): string {
    const location = this.getLocationById(id)
    return location ? location.name : "Unknown Location"
  }

  /**
   * Check if a location exists
   */
  locationExists(id: string): boolean {
    this.initialize()
    return this.cache.has(id)
  }

  /**
   * Update the Home Service location
   */
  updateHomeServiceLocation(location: Location): void {
    this.initialize()

    console.log("LocationCache: Updating home service location with data:", location);
    console.log("LocationCache: Home service phone number being updated:", location.phone);

    // Create a clean copy with all fields explicitly included
    const updatedLocation = {
      ...location,
      id: "home", // Ensure ID remains "home"
      phone: location.phone, // Explicitly include phone to ensure it's saved
      name: location.name || "Home Service",
      address: location.address || "Client's Location",
      city: location.city || "Doha",
      state: location.state || "Doha",
      zipCode: location.zipCode || "",
      country: location.country || "Qatar",
      email: location.email || "homeservice@salonhub.com",
      status: location.status || "Active",
      description: location.description || "We come to you! Available within city limits.",
      enableOnlineBooking: location.enableOnlineBooking !== undefined ? location.enableOnlineBooking : true,
      displayOnWebsite: location.displayOnWebsite !== undefined ? location.displayOnWebsite : true,
      staffCount: location.staffCount || 4,
      servicesCount: location.servicesCount || 8,
    };

    console.log("LocationCache: Clean home service location prepared:", updatedLocation);
    console.log("LocationCache: Clean home service phone prepared:", updatedLocation.phone);

    // Update the special location in the cache
    this.specialLocations.set("home", updatedLocation)
    console.log("LocationCache: Updated special locations map with phone:", updatedLocation.phone);

    // Update the cache
    this.cache.set("home", updatedLocation)
    console.log("LocationCache: Updated cache with phone:", updatedLocation.phone);

    // Store the updated home service location in localStorage for persistence
    // Only if we're in a browser environment
    if (typeof window !== 'undefined') {
      try {
        const storageKey = "vanity_home_service_location"
        const dataToSave = JSON.stringify(updatedLocation);
        localStorage.setItem(storageKey, dataToSave)
        console.log("LocationCache: Saved to localStorage with phone:", updatedLocation.phone);
        console.log("LocationCache: Raw data saved to localStorage:", dataToSave);

        // Verify the data was saved correctly
        const savedData = localStorage.getItem(storageKey);
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          console.log("LocationCache: Verified data in localStorage:", parsedData);
          console.log("LocationCache: Verified phone in localStorage:", parsedData.phone);
        }
      } catch (error) {
        console.error("Failed to save home service location to storage:", error)
      }
    }
  }

  /**
   * Load the Home Service location from localStorage if available
   */
  private loadHomeServiceLocationFromStorage(): void {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return; // Skip on server-side
    }

    try {
      const storageKey = "vanity_home_service_location"
      const storedLocation = localStorage.getItem(storageKey)
      console.log("LocationCache: Loading home service location from storage");

      if (storedLocation) {
        console.log("LocationCache: Found stored home service location:", storedLocation);
        const parsedLocation = JSON.parse(storedLocation) as Location
        console.log("LocationCache: Parsed home service location:", parsedLocation);
        console.log("LocationCache: Parsed home service phone:", parsedLocation.phone);

        // Create a clean copy with all fields explicitly included
        const cleanLocation = {
          ...parsedLocation,
          id: "home", // Ensure ID remains "home"
          phone: parsedLocation.phone, // Explicitly include phone to ensure it's loaded
          name: parsedLocation.name || "Home Service",
          address: parsedLocation.address || "Client's Location",
          city: parsedLocation.city || "Doha",
          state: parsedLocation.state || "Doha",
          zipCode: parsedLocation.zipCode || "",
          country: parsedLocation.country || "Qatar",
          email: parsedLocation.email || "homeservice@salonhub.com",
          status: parsedLocation.status || "Active",
          description: parsedLocation.description || "We come to you! Available within city limits.",
          enableOnlineBooking: parsedLocation.enableOnlineBooking !== undefined ? parsedLocation.enableOnlineBooking : true,
          displayOnWebsite: parsedLocation.displayOnWebsite !== undefined ? parsedLocation.displayOnWebsite : true,
          staffCount: parsedLocation.staffCount || 4,
          servicesCount: parsedLocation.servicesCount || 8,
        };

        console.log("LocationCache: Clean home service location prepared:", cleanLocation);
        console.log("LocationCache: Clean home service phone prepared:", cleanLocation.phone);

        // Update both caches only if not already present to prevent duplicates
        if (!this.cache.has("home")) {
          this.specialLocations.set("home", cleanLocation)
          this.cache.set("home", cleanLocation)
          console.log("LocationCache: Set home service location in specialLocations with phone:", cleanLocation.phone);
          console.log("LocationCache: Set home service location in cache with phone:", cleanLocation.phone);
        } else {
          console.log("LocationCache: Home service already exists in cache, skipping localStorage restoration");
        }
      } else {
        console.log("LocationCache: No stored home service location found");
      }
    } catch (error) {
      console.error("Failed to load home service location from storage:", error)
    }
  }
}

// Create a singleton instance
export const locationCache = new LocationCacheService()
