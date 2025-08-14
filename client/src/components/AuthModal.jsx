import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';
import { useAuth } from '../contexts/AuthContext';

const AuthModal = ({ isOpen, onClose, type, onSwitchType }) => {
  const { login, register } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    passwordConf: ''
  });
  const [message, setMessage] = useState('');

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    const { username, password, passwordConf } = formData;

    if (type === 'login') {
      const result = await login(username, password);
      if (result.ok) {
        setMessage('Logged in successfully!');
        setTimeout(() => {
          onClose();
          setFormData({ username: '', password: '', passwordConf: '' });
          setMessage('');
        }, 1500);
      } else {
        setMessage(result.message || 'Login failed');
      }
    } else if (type === 'signup') {
      if (password !== passwordConf) {
        setMessage('Passwords do not match');
        return;
      }
      const result = await register(username, password, passwordConf);
      if (result.ok) {
        setMessage('Registered successfully! Please log in.');
        setTimeout(() => {
          onSwitchType('login'); // switch to login after signup
          setFormData({ username: '', password: '', passwordConf: '' });
          setMessage('');
        }, 1500);
      } else {
        setMessage(result.message || 'Registration failed');
      }
    } else {
      const result = await LogOut();
      if(result.ok) {
        setMessage('Succesfully loggedout');
        setTimeout(() => {
         onSwitchType('login') // switch to login after logging in
          setFormData({ username: '', password: '', passwordConf: '' });
        },1500);        
      } else{
        setMessage(result.message || 'Logout failed');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-n-8/60 backdrop-blur-md" />

        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          className="relative backdrop-blur-sm bg-n-8/80 border border-n-2/20 p-8 rounded-2xl shadow-xl max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
          whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-n-3 hover:text-n-1 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <h1 className="text-center text-n-1 text-2xl font-bold mb-8">
            {type === 'login' ? 'Sign In' : 'Create Account'}
          </h1>

          <form className="w-full flex flex-col space-y-6 font-medium" onSubmit={handleSubmit}>
            <input
              className="w-full px-4 py-3 bg-n-7/50 border border-n-6 rounded-xl text-n-1 placeholder-n-3"
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleInputChange}
              required
            />

            <input
              className="w-full px-4 py-3 bg-n-7/50 border border-n-6 rounded-xl text-n-1 placeholder-n-3"
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />

            {type === 'logout' && (
              <div>
                <h2>Confirm Logout</h2>
                <p>Are you sure you want to log out?</p>
                <button
                  onClick={async () => {
                    await logout(); // call AuthContext logout
                    closeAuthModal();
                  }}
                >
                  Yes, log me out
                </button>
                <button onClick={closeAuthModal}>Cancel</button>
              </div>
            )}  

            {type === 'signup' && (
              <input
                className="w-full px-4 py-3 bg-n-7/50 border border-n-6 rounded-xl text-n-1 placeholder-n-3"
                type="password"
                name="passwordConf"
                placeholder="Confirm Password"
                value={formData.passwordConf}
                onChange={handleInputChange}
                required
              />
            )}

            {message && (
              <p className="text-center text-red-500">{message}</p>
            )}

            <Button className="w-full mt-4" type="submit">
              {type === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          <div className="text-center mt-6">
            <p className="text-n-3">
              {type === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => onSwitchType(type === 'login' ? 'signup' : 'login')}
                className="text-color-1 hover:text-color-2 transition-colors underline"
              >
                {type === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AuthModal;
