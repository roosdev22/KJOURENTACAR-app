import { useAuth } from "./useAuth";

export function useDisplayName(): string {
  const { user } = useAuth();

  if (!user) return "Utilisateur";

  const full = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();

  if (full) return full;

  if (user.email) return user.email;

  return "Utilisateur";
}