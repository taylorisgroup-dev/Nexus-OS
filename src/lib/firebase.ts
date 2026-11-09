import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Configured Executive Owner
export const CONFIGURED_OWNER_EMAIL = 'nexuspremiumsolutions@gmail.com';

/**
 * Validate connection to Firestore on boot as requested by Firebase Integration Skill
 */
export async function testConnection(): Promise<{ ok: boolean; message: string }> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return { ok: true, message: 'Connexion Firestore établie' };
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
      return { ok: false, message: 'Client Firestore hors-ligne' };
    }
    // Expected if doc doesn't exist or unauthenticated, but endpoint ping verified network reachability
    return { ok: true, message: 'Serveur Firestore joignable' };
  }
}

export { signInWithPopup, signOut };
export type { User };
