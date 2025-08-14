import React, { useEffect, useState, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { disablePageScroll, enablePageScroll } from 'scroll-lock';
import Card from '../components/Card';
import Button from './Button';
import MenuSvg from '../assets/svg/MenuSvg';
import { HamburgerMenu } from './design/Header';
import { cycloneLogo, navigation } from '../constants/index';
import { useAuthModal } from '../contexts/AuthModalContext';

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [storedUser, setStoredUser] = useState(null);
  const [stats, setStats] = useState({ distanceKm: 0, elevationM: 0 });
  const [routes, setRoutes] = useState([]);
  const [openNavigation, setOpenNavigation] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { openAuthModal } = useAuthModal();

  // Handle user data and API calls
  useEffect(() => {
    let localUser = JSON.parse(localStorage.getItem('user'));

    // For testing: create dummy if missing
    if (!localUser?.id) {
      localUser = { id: 'user123', username: 'devUser', profilePicture: '/default-avatar.png' };
      localStorage.setItem('user', JSON.stringify(localUser));
    }

    setStoredUser(localUser);

    const fetchProfile = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/user/profile?userId=${localUser.id}`);
        console.log('Profile fetch status:', res.status, res.statusText);
        if (!res.ok) {
          const text = await res.text();
          console.log('Profile fetch response body:', text);
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        const profileData = await res.json();
        setUser(profileData);
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
      }
    };

    const fetchStats = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/user/stats?userId=${localUser.id}`);
        const data = await res.json();
        if (res.ok) setStats(data);
      } catch (err) {
        console.error('Failed to load user stats', err);
      }
    };

    const fetchRoutes = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/user/routes?userId=${localUser.id}`);
        const data = await res.json();
        if (res.ok) setRoutes(data);
      } catch (err) {
        console.error('Failed to load user routes', err);
      }
    };

    fetchProfile();
    fetchStats();
    fetchRoutes();
  }, [navigate]);

  // Handle dropdown click-outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Toggle navigation for mobile
  const toggleNavigation = () => {
    if (openNavigation) {
      setOpenNavigation(false);
      enablePageScroll();
    } else {
      setOpenNavigation(true);
      disablePageScroll();
    }
  };

  // Handle navigation link click
  const handleClick = () => {
    if (!openNavigation) return;
    enablePageScroll();
    setOpenNavigation(false);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setStoredUser(null);
    navigate('/');
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
    <div className="min-h-screen bg-n-8/90 backdrop-blur-sm">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 w-full z-50 border-b border-n-6 lg:bg-n-8/90 lg:backdrop-blur-sm">
        <div className="flex items-center px-2 lg:px-4 xl:px-6 max-lg:py-4">
          {/* Logo */}
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

          {/* Navigation */}
          <nav
            className={`${
              openNavigation ? 'flex' : 'hidden'
            } fixed top-[5rem] left-0 right-0 bottom-0 bg-n-8 lg:static lg:flex lg:mx-auto lg:bg-transparent`}
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

          {/* User Dropdown */}
          <div className="relative ml-auto" ref={dropdownRef}>
            <img
              src={user?.profilePicture || '/default-avatar.png'}
              alt="User Avatar"
              className="w-10 h-10 rounded-full border cursor-pointer hover:opacity-90"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            />
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-n-8 border border-n-6 rounded shadow-lg z-50">
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

          {/* Mobile Menu Toggle */}
          <Button className="ml-auto lg:hidden" px="px-3" onClick={toggleNavigation}>
            <MenuSvg openNavigation={openNavigation} />
          </Button>
        </div>
      </div>

      {/* Profile Content */}
      <div className="pt-24 px-4 lg:px-6 max-w-4xl mx-auto">
        <h2 className="font-code text-2xl lg:text-3xl uppercase text-n-1 text-center mb-8">
          User Profile
        </h2>

        <Card
          className="flex flex-col md:flex-row items-center gap-6 p-6 bg-black border border-n-6 shadow-lg transition-all duration-300 hover:shadow-xl"
        >
          <img
            src={user?.profilePicture || '/default-avatar.png'}
            alt="Profile"
            className="w-24 h-24 lg:w-32 lg:h-32 rounded-full object-cover border border-n-6 transition-transform duration-300 hover:scale-105"
          />
          <div className="flex-1 space-y-3 bg-black">
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
              const start = route.waypoints[0];
              const end = route.waypoints[route.waypoints.length - 1];
              return (
                <li
                  key={route.id || idx}
                  className="border border-n-6 rounded p-4 bg-n-8 shadow-sm transition-all duration-300 hover:bg-n-6/50 hover:shadow-md"
                >
                  <p className="font-code text-n-1 font-semibold text-base lg:text-lg">
                    {route.routeName || 'Unnamed Route'}
                  </p>
                  <p className="font-code text-n-1/50 text-sm lg:text-base">
                    From: {start.lat.toFixed(4)}, {start.lon.toFixed(4)}
                  </p>
                  <p className="font-code text-n-1/50 text-sm lg:text-base">
                    To: {end.lat.toFixed(4)}, {end.lon.toFixed(4)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}