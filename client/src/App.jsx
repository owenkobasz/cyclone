import './index.css';
import { Routes, Route } from 'react-router-dom';
import ButtonGradient from './assets/svg/ButtonGradient';
import Header from './components/Header';
import Home from './components/Home';
import About from './components/About';
import GenerateRoutes from './components/GenerateRoutes';
import ErrorBoundary from './components/ErrorBoundary';
import UserProfile from './components/UserProfile';
import EditProfile from './components/EditProfile';
import { AuthModalProvider } from './contexts/AuthModalContext';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import { Navigate } from 'react-router-dom';

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

// Protected Route Component to check authentication
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-n-8 via-n-7 to-n-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-color-1 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-n-1 text-lg">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// User Profile Component Layout to allow user profile to use the same header
const UserProfileLayout = ({ children }) => {
  return (
    <ErrorBoundary>
      <div className="pt-[4.75rem] lg:pt-[6.25rem] overflow-hidden">
        <Header/>
        <div className="min-h-screen">
          {children}
        </div>
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
          <Route path="/profile" element={
            // Checks if user is authenticated before allowing user to access UserProfile
            <ProtectedRoute>
              <UserProfileLayout>
                <UserProfile />
              </UserProfileLayout>
            </ProtectedRoute>
          } />
           // Same for EditProfile
          <Route path="/edit-profile" element={
            <ProtectedRoute>
              <UserProfileLayout>
                <EditProfile />
              </UserProfileLayout>
            </ProtectedRoute>
          } />
        </Routes>
      </AuthModalProvider>
    </AuthProvider>
  );
}

export default App;
