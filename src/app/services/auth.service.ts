import { Injectable, signal } from '@angular/core';
import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth } from '../firebase';

@Injectable({ providedIn: 'root' })
export class AuthService {
  /** Usuario conectado (null si no hay sesión) */
  readonly usuario = signal<User | null>(null);

  /** Se resuelve cuando Firebase ya sabe si hay sesión guardada o no */
  readonly listo: Promise<User | null>;

  constructor() {
    this.listo = new Promise((resolve) => {
      let primeraVez = true;
      onAuthStateChanged(auth, (u) => {
        this.usuario.set(u);
        if (primeraVez) {
          primeraVez = false;
          resolve(u);
        }
      });
    });
  }

  get uid(): string {
    const u = this.usuario();
    if (!u) throw new Error('No hay sesión iniciada');
    return u.uid;
  }

  entrar(correo: string, clave: string) {
    return signInWithEmailAndPassword(auth, correo.trim(), clave);
  }

  crearCuenta(correo: string, clave: string) {
    return createUserWithEmailAndPassword(auth, correo.trim(), clave);
  }

  salir() {
    return signOut(auth);
  }
}

/** Traduce los errores de Firebase a algo entendible */
export function mensajeError(e: unknown): string {
  const codigo = (e as { code?: string })?.code ?? '';
  const mensajes: Record<string, string> = {
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
    'auth/invalid-email': 'Ese correo no es válido.',
    'auth/email-already-in-use': 'Ya existe una cuenta con ese correo. Usa "Entrar".',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
    'auth/too-many-requests': 'Demasiados intentos. Espera un rato y vuelve a probar.',
    'auth/network-request-failed': 'Sin conexión. Revisa tu internet.',
    'auth/operation-not-allowed':
      'Falta activar "Correo electrónico/contraseña" en Firebase Authentication.',
  };
  return mensajes[codigo] ?? 'Algo falló. Vuelve a intentarlo.';
}
