import { useLocation, Link, useNavigate } from 'react-router-dom';
import { disablePageScroll, enablePageScroll } from 'scroll-lock';
import { cycloneLogo } from '../constants/index';
import { navigation } from '../constants';
import Button from './Button';
import MenuSvg from '../assets/svg/MenuSvg';
import { HamburgerMenu } from './design/Header';
import { useState, useEffect, useRef } from 'react';
import { useAuthModal} from '../contexts/AuthModalContext';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [openNavigation, setOpenNavigation] = useState(false);
  const { openAuthModal } = useAuthModal();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const {user, logout} = useAuth();

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
    if (!openNavigation) return;
    // Close the navigation when a link is clicked (This prevents the navigation from staying open after clicking a link)

    enablePageScroll();
    setOpenNavigation(false);
  };

  return (
    <div
      className={`fixed top-0 left-0 w-full z-50  border-b border-n-6 lg:bg-n-8/90 lg:backdrop-blur-sm ${openNavigation ? "bg-n-8" : "bg-n-8/90 backdrop-blur-sm"
        }`}
    >
      <div className="flex items-center px-2 lg:px-4 xl:px-6 max-lg:py-4">
        <a href="#home" className="flex items-center">
          <img src={cycloneLogo} className="h-16 w-auto lg:h-20" alt="Cyclone" />
        </a>

        <nav
          className={`${openNavigation ? "flex" : "hidden"
            } fixed top-[5rem] left-0 right-0 bottom-0 bg-n-8 lg:static lg:flex lg:mx-auto lg:bg-transparent`}
        >
          <div className="relative z-2 flex flex-col items-center justify-center m-auto lg:flex-row">
            {navigation.map((item) => (
              <a
                key={item.id}
                href={item.url}
                onClick={handleClick}
                className={`block relative font-code text-2xl uppercase text-n-1 transition-all duration-300 hover:text-color-1 hover:scale-105 ${item.onlyMobile ? "lg:hidden" : ""
                  } px-6 py-6 md:py-8 lg:-mr-0.25 lg:text-base lg:font-semibold ${item.url === location.pathname || item.url === location.hash
                    ? "z-2 lg:text-n-1"
                    : "lg:text-n-1/50"
                  } lg:leading-5 lg:hover:text-n-1 xl:px-12`}
              >
                {item.title}
              </a>
            ))}
          </div>

          <HamburgerMenu />
        </nav>

        

        {user ? (
          <div className="relative ml-auto flex items-center" ref={dropdownRef}>
            <span className="hidden mr-4 lg:block font-code text-sm lg:text-base xl:text-lg text-n-1/50">
              Hi {user?.name || user?.username}!
            </span>

            <div className="relative">
              <img
                src={user?.avatar || user?.profilePicture || '/avatars/default-avatar.png'}
                alt="User Avatar"
                className="w-10 h-10 rounded-full border cursor-pointer hover:opacity-90 object-cover"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-haspopup="true"
                aria-expanded={dropdownOpen}
              />
              <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-n-9 flex items-center justify-center translate-x-2 translate-y-2 opacity-100 drop-shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="w-3 h-3">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </span>
            </div>
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-3 w-40 bg-n-8 border border-n-6 rounded shadow-lg z-50 transform origin-top-right translate-y-0">
                <button
                  onClick={() => {
                    navigate('/profile');
                    setDropdownOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-n-1 hover:bg-n-6/50 transition-colors"
                >
                  Profile
                </button>
                <button
                  onClick={() => {
                    navigate('/edit-profile');
                    setDropdownOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-n-1 hover:bg-n-6/50 transition-colors"
                >
                  Edit Profile
                </button>
                <button
                  onClick={async () => {
                    navigate('/');
                    await openAuthModal("logout");
                    setDropdownOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-n-1 hover:bg-n-6/50 transition-colors"
                  >
                  Logout
                  </button>

              </div>
            )}
          </div>
        ) : (
          <>
          {!user && 
            <>
            <button
              onClick={() => openAuthModal('signup')}
              className="button hidden mr-8 text-n-1/50 transition-colors hover:text-n-1 lg:block font-code text-sm lg:text-base xl:text-lg "
            >
              New account
            </button>
            <Button className="hidden lg:flex lg:flec text-sm" onClick={() => openAuthModal('login')}>
              Sign in
            </Button>
            </> 
            }
          
          </>
        )}
        

        <Button
          className="ml-auto lg:hidden"
          px="px-3"
          onClick={toggleNavigation}
        >
          <MenuSvg openNavigation={openNavigation} />
        </Button>
      </div>
    </div>
  );
};

export default Header;