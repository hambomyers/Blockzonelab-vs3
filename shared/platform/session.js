// BlockZone Lab - Shared Session Management Module
// Handles session detection, creation, upgrade, and profile sync
// Works with Cloudflare Worker backend (see /api/auth/session, /api/auth/upgrade)

const API_BASE = 'https://blockzone-api.hambomyers.workers.dev';
const SESSION_KEY = 'bzlab_session';
const PROFILE_KEY = 'bzlab_profile';

// Get session from localStorage
export async function getSession() {
  let session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  if (session && session.session_id && session.player_id) {
    return session;
  }
  // No session, create anonymous
  const device_info = { ua: navigator.userAgent, lang: navigator.language };
  const res = await fetch(`${API_BASE}/api/auth/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ device_info })
  });
  const data = await res.json();
  if (data.success) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
    return data;
  }
  throw new Error('Failed to create session');
}

// Upgrade session to wallet or email/social
export async function upgradeSession({ session_id, upgrade_type, wallet_address, email, display_name, signature }) {
  const res = await fetch(`${API_BASE}/api/auth/upgrade`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id, upgrade_type, wallet_address, email, display_name, signature })
  });
  const data = await res.json();
  if (data.success) {
    // Update local session/profile
    localStorage.setItem(PROFILE_KEY, JSON.stringify(data.profile));
    let session = JSON.parse(localStorage.getItem(SESSION_KEY) || '{}');
    session.player_id = data.player_id;
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return data.profile;
  }
  throw new Error(data.error || 'Failed to upgrade session');
}

// Get profile from localStorage (or null)
export function getProfile() {
  return JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null');
}

// Clear session/profile (logout/reset)
export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(PROFILE_KEY);
}

// TODO: Add event listeners for login/logout/profile changes
// TODO: Add support for JWT/cookie-based sessions if needed
// TODO: Add wallet signature verification for Web3
// TODO: Add refresh logic for session/profile expiry 