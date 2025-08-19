class LocationService {
  constructor() {
    this.baseURL = 'http://localhost:8000/api';
    this.userLocation = null;
  }

  /**
   * Gets the user's location based on IP address
   * @returns {Promise<Object>} Location data with lat, lon, city, region, country
   */
  async getUserLocation() {
    try {
      if (this.userLocation) {
        return this.userLocation;
      }

      const response = await fetch(`${this.baseURL}/location`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          this.userLocation = data.location;
          console.log(`User location detected: ${this.userLocation.city}, ${this.userLocation.region}`);
          return this.userLocation;
        } else {
          throw new Error('Failed to get location from server');
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error getting user location:', error);
      
      // If there's an error with fetcing the user's location, then Philadelphia is used as a fallback
      this.userLocation = {
        lat: 39.9526,
        lon: -75.1652,
        city: 'Philadelphia',
        region: 'Pennsylvania',
        country: 'US',
        place: 'Philadelphia, Pennsylvania, USA'
      };
      
      return this.userLocation;
    }
  }

  clearLocation() {
    this.userLocation = null;
  }
}

export default new LocationService();
