import { repository } from './database.js';
import { firebaseAuth } from './firebase.js';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js';

let session = null;
let restorePromise;

async function loadProfile(user) {
  const profile = await repository.getUser(user.uid);
  if (!profile?.active) {
    throw new Error('Esta cuenta no está autorizada para acceder al sistema.');
  }
  return {
    id: user.uid,
    name: profile.name,
    role: profile.role,
    email: user.email
  };
}

export const auth = {
  current: () => session,

  restore: () => {
    if (!restorePromise) {
      restorePromise = new Promise(resolve => {
        onAuthStateChanged(firebaseAuth, async user => {
          try {
            session = user ? await loadProfile(user) : null;
          } catch (error) {
            console.error('No se pudo restaurar la sesión:', error);
            session = null;
          }
          resolve(session);
        });
      });
    }
    return restorePromise;
  },

  async signOut() {
    await signOut(firebaseAuth);
    session = null;
  },

  async signIn(email, password) {
    try {
      const result = await signInWithEmailAndPassword(firebaseAuth, email, password);
      session = await loadProfile(result.user);
    } catch (error) {
      console.error('Error de inicio de sesión:', error);
      if (error.code?.startsWith('auth/')) {
        throw new Error('Correo o contraseña incorrectos.');
      }
      throw error;
    }
    return session;
  }
};
