import './index.css';
import {useEffect} from 'react';
import { Routes, Route } from 'react-router-dom';
import ButtonGradient from './assets/svg/ButtonGradient';
import Header from './components/Header';
import Home from './components/Home';
import About from './components/About';
import GenerateRoutes from './components/GenerateRoutes';
import ErrorBoundary from './components/ErrorBoundary';
import RouteDisplay from './pages/RouteDisplay';
import UserProfile from './components/UserProfile';
import EditProfile from './components/EditProfile';
import { AuthModalProvider } from './contexts/AuthModalContext';
import { AuthProvider } from './contexts/AuthContext';
import AuthModal from './components/AuthModal';

// Main App Layout Component
const AppLayout = ({ children }) => {

  // this just makes it stay at top on first mount
  useEffect(() => {
    // Scroll to top whenever the route changes
    window.scrollTo(0, 0);
  }, );
  
  return (
    <ErrorBoundary>
      <AuthModal />
      <Header />
      <div className="pt-[4.75rem] lg:pt-[6.25rem] overflow-hidden">
        {children}
      </div>
      <ButtonGradient />
    </ErrorBoundary>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AuthModalProvider>
        <Routes>
          <Route path="/" element={<AppLayout><Home /><About /><GenerateRoutes /></AppLayout>} />
          <Route path="/routes" element={<AppLayout><RouteDisplay /></AppLayout>} />
          <Route path="/profile" element={<AppLayout><UserProfile /></AppLayout>} />
          <Route path="/edit-profile" element={<AppLayout><EditProfile /></AppLayout>} />
          <Route path="/generate-routes" element={<AppLayout><GenerateRoutes /></AppLayout>} />
        </Routes>
      </AuthModalProvider>
    </AuthProvider>
  );
};

export default App;
