
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import type { AuthContextType } from "../context/AuthContext";

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error(
      "useAuth() doit être utilisé à l'intérieur de <AuthProvider>. " +
      "Vérifie que AuthProvider enveloppe ton App dans App.tsx."
    );
  }

  
  return context;
}