import React, { useEffect, useState, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { disablePageScroll, enablePageScroll } from 'scroll-lock';
import Card from '../components/Card';
import Button from './Button';
import MenuSvg from '../assets/svg/MenuSvg';
import { HamburgerMenu } from './design/Header';
import { cycloneLogo, navigation } from '../constants/index';
import { useAuthModal } from '../contexts/AuthModalContext';
import { homeBackground } from '../assets/home';

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [storedUser, setStoredUser] = useState(null);
  const [stats, setStats] = useState({ distanceKm: 0, elevationM: 0 });
  const [routes, setRoutes] = useState([]);
  const [routeAddresses, setRouteAddresses] = useState({});
  const [openNavigation, setOpenNavigation] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { openAuthModal } = useAuthModal();
  const GEOAPIFY_API_KEY = 'b7a0cb4137164bf5b2717fd3a450ef73';

  useEffect(() => {
    let localUser = JSON.parse(localStorage.getItem('user'));
    if (!localUser?.id) {
      localUser = { id: 'user123', username: 'devUser', profilePicture: '/default-avatar.png' };
      localStorage.setItem('user', JSON.stringify(localUser));
    }
    setStoredUser(localUser);

    const fetchProfile = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/user/profile?userId=${localUser.id}`);
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        setUser(await res.json());
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
      }
    };

    const fetchStats = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/user/stats?userId=${localUser.id}`);
        if (res.ok) setStats(await res.json());
      } catch (err) {
        console.error('Failed to load user stats', err);
      }
    };

    const fetchRoutes = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/user/routes?userId=${localUser.id}`);
        if (!res.ok) return;
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

    fetchProfile();
    fetchStats();
    fetchRoutes();
  }, [navigate]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleNavigation = () => {
    if (openNavigation) {
      setOpenNavigation(false);
      enablePageScroll();
    } else {
      setOpenNavigation(true);
      disablePageScroll();
    }
  };

  const handleClick = () => {
    if (openNavigation) {
      enablePageScroll();
      setOpenNavigation(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setStoredUser(null);
    navigate('/');
  };

  const handleRouteClick = (route) => {
    navigate('/', { state: { selectedRoute: route, stats: {
        distanceKm: route.total_distance_km || route.distance || 0,
        elevationM: route.elevation_gain_m || route.elevation || 0,
        totalRideTime: route.total_ride_time || null
      },
      cueSheet: route.instructions || [] } });
  };

  if (!storedUser) {
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
      {/* Background - same as Home.jsx */}
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
        {/* Header */}
        <div className="fixed top-0 left-0 w-full z-50 border-b border-n-6 bg-n-8/90 backdrop-blur-sm boarder boarder-n-6 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center px-2 lg:px-4 xl:px-6 max-lg:py-4">
            <Link
              to="/"
              className="flex items-center"
              onClick={() => {
                setTimeout(() => {
                  const homeElement = document.getElementById('home');
                  if (homeElement) {
                    homeElement.scrollIntoView({ behavior: 'smooth' });
                  }
                }, 100);
              }}
            >
              <img src={cycloneLogo} className="h-16 w-auto lg:h-20" alt="Cyclone" />
            </Link>

            <nav
              className={`${openNavigation ? 'flex' : 'hidden'} fixed top-[5rem] left-0 right-0 bottom-0 bg-n-8 lg:static lg:flex lg:mx-auto lg:bg-transparent`}
            >
              <div className="relative z-2 flex flex-col items-center justify-center m-auto lg:flex-row">
                {navigation.map((item) => (
                  <a
                    key={item.id}
                    href={item.url}
                    onClick={handleClick}
                    className={`block relative font-code text-2xl uppercase text-n-1 transition-all duration-300 hover:text-color-1 hover:scale-105 ${
                      item.onlyMobile ? 'lg:hidden' : ''
                    } px-6 py-6 md:py-8 lg:-mr-0.25 lg:text-base lg:font-semibold ${
                      item.url === location.pathname || item.url === location.hash
                        ? 'z-2 lg:text-n-1'
                        : 'lg:text-n-1/50'
                    } lg:leading-5 lg:hover:text-n-1 xl:px-12`}
                  >
                    {item.title}
                  </a>
                ))}
              </div>
              <HamburgerMenu />
            </nav>

            <div className="relative ml-auto" ref={dropdownRef}>
              <img
                src={user?.profilePicture || '/default-avatar.png'}
                alt="User Avatar"
                className="w-10 h-10 rounded-full border cursor-pointer hover:opacity-90"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              />
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-n-8/90 backdrop-blur-sm border border-n-6 rounded shadow-lg z-50">
                  <button
                    onClick={() => {
                      navigate('/profile');
                      setDropdownOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-n-1 hover:bg-n-6/50 transition-colors font-code"
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => {
                      navigate('/edit-profile');
                      setDropdownOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-n-1 hover:bg-n-6/50 transition-colors font-code"
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-n-1 hover:bg-n-6/50 transition-colors font-code"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>

            <Button className="ml-auto lg:hidden" px="px-3" onClick={toggleNavigation}>
              <MenuSvg openNavigation={openNavigation} />
            </Button>
          </div>
        </div>

        {/* Profile Section */}
        <div className="pt-24 px-2 lg:px-4 xl:px-6 max-w-4xl mx-auto">
          <h2 className="font-code text-2xl lg:text-3xl uppercase text-n-1 text-center mb-8">
            User Profile
          </h2>

          <Card className="flex flex-col items-center gap-6 p-6 bg-transparent backdrop-blur-sm border border-n-6 shadow-lg hover:shadow-xl">
            <img
              src={user?.profilePicture || '/default-avatar.png'}
              alt="Profile"
              className="w-12 h-12 lg:w-16 lg:h-16 rounded-full object-cover border border-n-6 cursor-pointer hover:opacity-90"
              onClick={() => navigate('/edit-profile')}
            />
            <div className="flex-1 space-y-3 text-center">
              <p className="font-code text-n-1 text-base lg:text-lg">
                <strong>Name:</strong> {user?.name || 'N/A'}
              </p>
              <p className="font-code text-n-1 text-base lg:text-lg">
                <strong>Address:</strong> {user?.address || 'Not set'}
              </p>
              <p className="font-code text-n-1 text-base lg:text-lg">
                <strong>Total Distance:</strong> {stats.distanceKm.toFixed(1)} km
              </p>
              <p className="font-code text-n-1 text-base lg:text-lg">
                <strong>Total Elevation:</strong> {stats.elevationM.toFixed(0)} m
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