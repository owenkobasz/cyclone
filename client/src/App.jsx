import './index.css';
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

// Main App Layout Component
const AppLayout = () => {
  return (
    <ErrorBoundary>
      <div className="pt-[4.75rem] lg:pt-[6.25rem] overflow-hidden">
        <Header/>
        <Home />
        <About />
        <GenerateRoutes />
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
            <Route path="/" element={<AppLayout />} />
            <Route path="/routes" element={<RouteDisplay />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/edit-profile" element={<EditProfile />} />
          </Routes>
      </AuthModalProvider>
    </AuthProvider>
  );
}

export default App;


