import './index.css';
import { Routes, Route, Outlet } from 'react-router-dom';
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

// App layout component with Outlet
const AppLayout = () => {
  return (
    <ErrorBoundary>
      <AuthModal/>
      <Header />
      <div className="pt-[4.75rem] lg:pt-[6.25rem] overflow-hidden">
        <Outlet /> {/* nested routes render here */}
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
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="routes" element={<RouteDisplay />} />
            <Route path="profile" element={<UserProfile />} />
            <Route path="edit-profile" element={<EditProfile />} />
            <Route path="generate-routes" element={<GenerateRoutes />} />
          </Route>
        </Routes>
      </AuthModalProvider>
    </AuthProvider>
  );
};

export default App;
