import { createContext } from "react";
import type { User } from "../api/services/authService";

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

export const AuthContext =
  createContext<AuthContextType | null>(null);