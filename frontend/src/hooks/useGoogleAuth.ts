const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'

export function useGoogleAuth() {
  const loginWithGoogle = () => {
    const params = new URLSearchParams({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      redirect_uri: `${window.location.origin}/auth/google/callback`,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
    })
    window.location.href = `${GOOGLE_AUTH_URL}?${params.toString()}`
  }

  return { loginWithGoogle }
}