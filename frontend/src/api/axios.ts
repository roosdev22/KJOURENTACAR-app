
/**
 * KJOURENTACAR — Instance Axios centralisée
 *
 * Point d'entrée unique pour toutes les communications HTTP
 * entre le frontend React et le backend Django DRF.
 *
 * Authentification :
 * - JWT stockés dans des cookies HttpOnly côté Django.
 * - Aucun token dans localStorage/sessionStorage.
 * - Aucun header Authorization manuel.
 * - withCredentials permet l'envoi automatique des cookies.
 */

import axios from "axios";
import type {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from "axios";


// ============================================================
// INSTANCE AXIOS
// ============================================================

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,

  headers: {
    /**
     * IMPORTANT :
     * Ne PAS définir "Content-Type" globalement.
     *
     * Pourquoi ?
     *
     * - JSON :
     *   Axios définira automatiquement application/json.
     *
     * - FormData :
     *   Le navigateur définira automatiquement :
     *
     *   multipart/form-data; boundary=...
     *
     * Si on force application/json ici, les uploads d'images
     * échouent avec :
     *
     * "Type de média « application/json » non supporté."
     */
    Accept: "application/json",
  },

  // Cookies HttpOnly envoyés automatiquement
  withCredentials: true,

  // Timeout de 10 secondes
  timeout: 10000,
});


// ============================================================
// INTERCEPTEUR DE REQUÊTE
// ============================================================

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const backendUrl = import.meta.env.VITE_API_URL;

    /**
     * Vérifie que la requête est destinée à notre backend.
     *
     * Les cookies ne doivent pas être envoyés vers un service tiers.
     */
    const isOwnBackend =
      config.url?.startsWith("/") ||
      config.url?.startsWith(backendUrl);

    if (!isOwnBackend) {
      config.withCredentials = false;
    }

    return config;
  },

  (error) => Promise.reject(error)
);


// ============================================================
// REFRESH JWT
// ============================================================

let isRefreshing = false;

type QueueItem = {
  resolve: () => void;
  reject: (error: unknown) => void;
};

let pendingQueue: QueueItem[] = [];


// ============================================================
// FILE D'ATTENTE DU REFRESH
// ============================================================

const flushQueue = (error: unknown): void => {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve();
    }
  });

  pendingQueue = [];
};


// ============================================================
// INTERCEPTEUR DE RÉPONSE
// ============================================================

api.interceptors.response.use(
  (response: AxiosResponse) => response,

  async (error) => {
    const originalRequest = error.config;

    // Pas un 401 ou requête déjà retentée
    // Pas un 401, requête déjà retentée ou connexion initiale
const isAuthenticationRequest =
  originalRequest?.url?.includes("/users/login/") ||
  originalRequest?.url?.includes("/users/google_login/");

if (
  error.response?.status !== 401 ||
  originalRequest?._retry ||
  isAuthenticationRequest
) {
  return Promise.reject(error);
}

    // ========================================================
    // EXCLUSION DE /users/me/
    // ========================================================

    /**
     * AuthContext utilise /users/me/ au démarrage pour savoir
     * si une session existe.
     *
     * Un 401 ici signifie simplement :
     * "aucune session active".
     *
     * On ne tente donc PAS de refresh.
     */
    const isProfileCheck =
      originalRequest.url?.includes("/users/me/");

    if (isProfileCheck) {
      return Promise.reject(error);
    }


    // ========================================================
    // UNE AUTRE REQUÊTE EST DÉJÀ EN REFRESH
    // ========================================================

    if (isRefreshing) {
      return new Promise<void>((resolve, reject) => {
        pendingQueue.push({
          resolve,
          reject,
        });
      }).then(() => {
        return api(originalRequest);
      });
    }


    // ========================================================
    // DÉBUT DU REFRESH
    // ========================================================

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      /**
       * Django reçoit le refresh_token depuis le cookie HttpOnly.
       *
       * Aucun token n'est manipulé côté frontend.
       */
      await axios.post(
        `${import.meta.env.VITE_API_URL}/users/token_refresh/`,
        {},
        {
          withCredentials: true,
        }
      );

      // Le cookie est maintenant renouvelé côté serveur
      flushQueue(null);

      // Rejouer la requête originale
      return api(originalRequest);

    } catch (refreshError) {

      flushQueue(refreshError);

      // Session réellement expirée
      window.location.href = "/login";

      return Promise.reject(refreshError);

    } finally {
      isRefreshing = false;
    }
  }
);


// ============================================================
// EXPORT
// ============================================================

export default api;

