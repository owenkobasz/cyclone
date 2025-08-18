import React, { useEffect, useState, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Button from './Button';
import { useAuthModal } from '../contexts/AuthModalContext';
import { useAuth } from '../contexts/AuthContext';
import { homeBackground } from '../assets/home';

export default function UserProfile() {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ distanceKm: 0, elevationM: 0 });
  const [routes, setRoutes] = useState([]);
  const [routeAddresses, setRouteAddresses] = useState({});
  const navigate = useNavigate();
  const { openAuthModal } = useAuthModal();
  const GEOAPIFY_API_KEY = 'b7a0cb4137164bf5b2717fd3a450ef73';

  // Helper function to build correct avatar URL
  const getAvatarUrl = (user) => {
    // Use profilePicture as primary, else uses default avatar
    const avatar = user?.profilePicture || user?.avatar;
    if (!avatar || avatar === '/avatars/default-avatar.png') {
      // For default avatar, use it directly
      return '/avatars/default-avatar.png';
    }
    if (avatar.startsWith('http')) return avatar;
    const base = import.meta.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';
    return `${base}${avatar}`;
  };

  useEffect(() => {
    if (!authUser) return;

    const fetchProfile = async () => {
      try {
        const base = import.meta.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';
        // use session-backed endpoint to avoid undefined username
        const res = await fetch(`${base}/api/user/profile`, { credentials: 'include' });
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        const profileData = await res.json();
        setUser(profileData);
        return profileData;
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
        return null;
      }
    };

    const fetchStats = async (username) => {
      try {
        const base = import.meta.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';
        const res = await fetch(`${base}/api/user/profile/${username}/stats`, { credentials: 'include' });
        if (res.ok) setStats(await res.json());
      } catch (err) {
        console.error('Failed to load user stats', err);
      }
    };

    const fetchRoutes = async () => {
      try {
        const base = import.meta.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';
        const res = await fetch(`${base}/api/routes`, { credentials: 'include' });
        if (!res.ok) {
          if (res.status === 401) {
            console.error('Not authenticated for routes - user may need to log in again');
            return;
          }
          console.error('Failed to fetch routes:', res.status, res.statusText);
          return;
        }
        const data = await res.json();
        setRoutes(data);

        const addresses = {};
        for (const route of data) {
          const start = route.waypoints[0];
          const end = route.waypoints[route.waypoints.length - 1];
          addresses[route.id] = {
            start: { address: 'Loading...', error: null },
            end: { address: 'Loading...', error: null },
          };

          try {
            const startRes = await fetch(
              `https://api.geoapify.com/v1/geocode/reverse?lat=${start.lat}&lon=${start.lon}&type=street&apiKey=${GEOAPIFY_API_KEY}`
            );
            const startData = await startRes.json();
            addresses[route.id].start.address =
              startData.features?.[0]?.properties?.formatted || 'No address found';
          } catch (err) {
            addresses[route.id].start.address = 'Error fetching address';
            addresses[route.id].start.error = err.message;
          }

          try {
            const endRes = await fetch(
              `https://api.geoapify.com/v1/geocode/reverse?lat=${end.lat}&lon=${end.lon}&type=street&apiKey=${GEOAPIFY_API_KEY}`
            );
            const endData = await endRes.json();
            addresses[route.id].end.address =
              endData.features?.[0]?.properties?.formatted || 'No address found';
          } catch (err) {
            addresses[route.id].end.address = 'Error fetching address';
            addresses[route.id].end.error = err.message;
          }
        }
        setRouteAddresses(addresses);
      } catch (err) {
        console.error('Failed to load user routes:', err);
      }
    };

    // Fetch profile first, then use that data for other requests
    const loadUserData = async () => {
      const profileData = await fetchProfile();
      if (profileData && profileData.username) {
        fetchStats(profileData.username);
        fetchRoutes();
      }
    };

    loadUserData();
  }, [authUser]);

  const handleRouteClick = (route) => {
    navigate('/#generate-routes', {
      state: {
        selectedRoute: route,
        fromProfile: true,
        stats: {
          distanceKm: route.total_distance_km || route.distance || 0,
          elevationM: route.elevation_gain_m || route.elevation || 0,
          totalRideTime: route.total_ride_time || null
        },
        cueSheet: route.instructions || []
      }
    });
  };

  if (!authUser) {
    return (
      <div className="p-4 text-center text-n-1 font-code">
        Please log in to view your profile.
        <Button className="mt-4" onClick={() => openAuthModal('login')}>
          Sign in
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-n-8/90 backdrop-blur-sm border-t border-n-6">
      <div className="fixed inset-0 w-screen h-screen z-0">
        <div className="relative w-full h-full">
          <img
            src={homeBackground}
            className="w-full h-full object-cover opacity-80"
            alt="home-background"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-n-8/2 via-n-8/5 to-n-8/10 backdrop-blur-[1px]"></div>
        </div>
      </div>

      {/* Page Content */}
      <div className="relative z-10">
        {/* Profile Section */}
        <div className="pt-24 px-2 lg:px-4 xl:px-6 max-w-4xl mx-auto">
          <h2 className="font-code text-2xl lg:text-3xl uppercase text-n-1 text-center mb-8">
            User Profile
          </h2>

          <Card className="flex flex-col items-center gap-6 p-6 bg-transparent backdrop-blur-sm border border-n-6 shadow-lg hover:shadow-xl">
            <img
              src={getAvatarUrl(user)}
              alt="User Avatar"
              className="w-24 h-24 rounded-full border-2 border-n-6 object-cover"
            />
            <div className="flex-1 space-y-3 text-center">
              <p className="font-code text-n-1 text-base lg:text-lg">
                <strong>Name:</strong> {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : (user?.name || 'N/A')}
              </p>
              <p className="font-code text-n-1 text-base lg:text-lg">
                <strong>Address:</strong> {user?.address || 'Not set'}
              </p>
            </div>
          </Card>

          <h3 className="font-code text-xl lg:text-2xl uppercase text-n-1 mt-10 mb-4">
            Saved Routes
          </h3>

          {routes.length === 0 ? (
            <p className="text-n-1/50 font-code text-base lg:text-lg">
              No routes saved yet.
            </p>
          ) : (
            <ul className="space-y-4">
              {routes.map((route, idx) => {
                const startAddress = routeAddresses[route.id]?.start?.address || 'Loading...';
                const endAddress = routeAddresses[route.id]?.end?.address || 'Loading...';
                return (
                  <li
                    key={route.id || idx}
                    className="border border-n-6 rounded p-4 bg-transparent backdrop-blur-sm shadow-sm transition-all duration-300 hover:bg-n-6/50 hover:scale-[1.01] hover:shadow-md"
                    onClick={() => handleRouteClick(route)}
                  >
                    <p className="font-code text-n-1 font-semibold text-base lg:text-lg">
                      {route.routeName || 'Unnamed Route'}
                    </p>
                    <p className="font-code text-n-1/50 text-sm lg:text-base">
                      From: {startAddress}
                    </p>
                    <p className="font-code text-n-1/50 text-sm lg:text-base">
                      To: {endAddress}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}