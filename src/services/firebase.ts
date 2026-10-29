import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const MAINTENANCE_DOC_PATH = 'system_settings';
const MAINTENANCE_DOC_ID = 'maintenance';

export interface MaintenanceStatus {
  isMaintenance: boolean;
  message: string;
  updatedAt?: string;
  updatedBy?: string;
}

/**
 * Real-time listener for maintenance mode in Firebase Firestore.
 * Automatically falls back to localStorage if offline.
 */
export function subscribeToMaintenanceMode(
  callback: (status: MaintenanceStatus) => void
): () => void {
  // Check cached local value first
  const cached = localStorage.getItem('fox_codes_maintenance_v1');
  if (cached) {
    try {
      callback(JSON.parse(cached));
    } catch {}
  }

  const docRef = doc(db, MAINTENANCE_DOC_PATH, MAINTENANCE_DOC_ID);

  const unsubscribe = onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const status: MaintenanceStatus = {
          isMaintenance: Boolean(data.maintenance_mode),
          message: data.maintenance_message || "Sorry, we're currently performing maintenance. Please try again later.",
          updatedAt: data.updated_at,
          updatedBy: data.updated_by
        };
        localStorage.setItem('fox_codes_maintenance_v1', JSON.stringify(status));
        callback(status);
      } else {
        const defaultStatus: MaintenanceStatus = {
          isMaintenance: false,
          message: "Sorry, we're currently performing maintenance. Please try again later."
        };
        callback(defaultStatus);
      }
    },
    (err) => {
      console.warn('Firestore maintenance subscription notice (offline or checking):', err.message);
      // Keep cached state
    }
  );

  return unsubscribe;
}

/**
 * Updates maintenance mode state in Firestore (Owner action).
 */
export async function updateFirebaseMaintenanceMode(
  isMaintenance: boolean,
  updatedByEmail: string,
  message?: string
): Promise<void> {
  const docRef = doc(db, MAINTENANCE_DOC_PATH, MAINTENANCE_DOC_ID);
  const now = new Date().toISOString();
  const payload = {
    maintenance_mode: isMaintenance,
    maintenance_message: message || "Sorry, we're currently performing maintenance. Please try again later.",
    updated_at: now,
    updated_by: updatedByEmail
  };

  await setDoc(docRef, payload, { merge: true });

  // Update local cache
  localStorage.setItem(
    'fox_codes_maintenance_v1',
    JSON.stringify({
      isMaintenance,
      message: payload.maintenance_message,
      updatedAt: now,
      updatedBy: updatedByEmail
    })
  );
}
