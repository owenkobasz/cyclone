import { createContext, useContext, useState } from 'react';

const AuthModalContext = createContext();

const MODAL_TYPES = {
  SIGNUP: 'signup',
  LOGIN: 'login',
  LOGOUT: 'logout',
};

export const useAuthModal = () => {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error('useAuthModal must be used within an AuthModalProvider');
  }
  return context;
};

export const AuthModalProvider = ({ children }) => {
  const [authModal, setAuthModal] = useState({
    isOpen: false,
    type: MODAL_TYPES.SIGNUP,
  });

  const openAuthModal = (type) => {
    setAuthModal({ isOpen: true, type });
  };

  const closeAuthModal = () => {
    setAuthModal(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <AuthModalContext.Provider
      value={{
        authModal,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthModalContext.Provider>
  );
};
