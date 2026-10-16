// Conexión con Firebase.
// Estos datos NO son secretos: identifican tu proyecto, pero lo que protege
// tus finanzas son las reglas de seguridad de Firestore (solo tu usuario
// puede leer y escribir en usuarios/{tuUid}).
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDzfqIyGE6KUwnr8-J3FoemdlNLcsX7AME',
  authDomain: 'finanzas-f75f8.firebaseapp.com',
  projectId: 'finanzas-f75f8',
  storageBucket: 'finanzas-f75f8.firebasestorage.app',
  messagingSenderId: '508802547292',
  appId: '1:508802547292:web:e2540d0d23f625fc3f7099',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Cache local: la app sigue funcionando sin internet y sincroniza después.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
