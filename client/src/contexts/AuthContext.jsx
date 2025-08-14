import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // null = unknown or logged out

  // Check session status on app load
  useEffect(() => {
    fetch("http://localhost:3000/api/status", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.loggedIn) {
          setUser({ username: data.username });
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null));
  }, []);

  // Register new user (no auto-login)
  const register = async (username, password, passwordConf) => {
    const res = await fetch("http://localhost:3000/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, passwordConf }),
    });
    const data = await res.json();
    if (data.ok) {
      return { success: true, message: data.message };
    }
    return { success: false, message: data.message || "Registration failed" };
  };

  // Login user
  const login = async (username, password) => {
    const res = await fetch("http://localhost:3000/api/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (data.ok) {
      setUser({ username: data.username });
      return { ok: true, message: "Login succesful!", username };
    }
    return { ok: false, message: data.message || "Login failed" };
  };

  // Logout user
  const logout = async () => {
    const res = await fetch("http://localhost:3000/api/logout", {
      method: "POST",
      credentials: "include",
    });
    
    const data = await res.json();
    if (data.ok) {
      setUser(null);
      return { ok: true, message: "Logout succesful!"};
    }

    return { ok: false, message: data.message || "Logout failed" };
    
  };

  return (
    <AuthContext.Provider value={{ user, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
