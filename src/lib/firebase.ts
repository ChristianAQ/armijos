import { initializeApp } from "firebase/app";
import {
  connectFirestoreEmulator,
  disableNetwork,
  enableNetwork,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";
import { connectAuthEmulator, getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

export const app = initializeApp(firebaseConfig);

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  ignoreUndefinedProperties: true,
});

export const auth = getAuth(app);

// `VITE_USE_FIREBASE_EMULATORS=true npm run dev` conecta a los emuladores
// locales para poder probar sin tocar el proyecto de Firebase real.
if (import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true") {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}

// Bug conocido en Safari/Chrome móvil (más notorio en la PWA instalada):
// al compartir o descargar un PDF se abre la hoja nativa del sistema, la
// app pasa a segundo plano, y las transacciones de IndexedDB que usa la
// persistencia offline de Firestore pueden quedarse "congeladas" — cualquier
// lectura pendiente o posterior no resuelve nunca hasta cerrar y reabrir la
// app. Forzar un ciclo de red al recuperar el foco despierta al cliente de
// Firestore y evita tener que reiniciar la app para que vuelva a cargar.
if (typeof document !== "undefined") {
  let wasHidden = false;
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      wasHidden = true;
      return;
    }
    if (document.visibilityState === "visible" && wasHidden) {
      wasHidden = false;
      disableNetwork(db)
        .then(() => enableNetwork(db))
        .catch(() => {});
    }
  });
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("firestore-timeout")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

/** Envuelve una lectura de Firestore (getDoc/getDocs) con una red de
 * seguridad para el mismo bug de arriba: si no resuelve en un tiempo
 * razonable asumimos que el cliente se quedó colgado, forzamos un ciclo de
 * red y reintentamos una vez, en vez de dejar el spinner cargando para
 * siempre hasta que el usuario cierre y reabra la app. */
export async function withRecovery<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await withTimeout(operation(), 8000);
  } catch {
    try {
      await disableNetwork(db);
      await enableNetwork(db);
    } catch {
      // sigue intentando la operación aunque el ciclo de red falle
    }
    return operation();
  }
}
