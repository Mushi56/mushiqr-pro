import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

const isCancel = (e) => /cancel|dismiss|closed/i.test(`${e?.code || ''} ${e?.message || ''}`);

/**
 * Native Google sign-in. Uses Android Credential Manager first (always returns the
 * current account state from Google), and falls back to the legacy flow only if needed.
 * The legacy flow fetches an access token for a cached device Account and fails with
 * "Account not present" when the Google username/email was changed.
 */
export async function nativeGoogleSignIn() {
  try {
    return await FirebaseAuthentication.signInWithGoogle({ useCredentialManager: true });
  } catch (err) {
    if (isCancel(err)) throw err;
    console.warn('Credential Manager sign-in failed, falling back to legacy:', err);
    try { await FirebaseAuthentication.signOut(); } catch { /* ignore */ }
    return await FirebaseAuthentication.signInWithGoogle({ useCredentialManager: false });
  }
}
