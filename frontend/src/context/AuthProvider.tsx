import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type { User } from "../api/services/authService";
import { authService } from "../api/services/authService";

import {
  AuthContext,
  type AuthContextType,
} from "./AuthContext";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const currentUser =
          await authService.getProfile();

        if (mounted) {
          setUser(currentUser);
        }
      } catch {
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void initializeAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const login = (loggedUser: User) => {
    setUser(loggedUser);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };


  const logout = async () => {
  try {
    await authService.logout();
  } finally {
    setUser(null);
  }
};

  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: user !== null,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}