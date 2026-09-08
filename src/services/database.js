import { collection, doc, getDoc, getDocs, setDoc } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js';
import { db } from './firebase.js';

const records = snapshot => snapshot.docs.map(item => ({ id: item.id, ...item.data() }));

export const repository = {
  getAll: async () => records(await getDocs(collection(db, 'teachers'))),

  get: async id => {
    const result = await getDoc(doc(db, 'teachers', id));
    return result.exists ? { id: result.id, ...result.data() } : null;
  },

  save: teacher => setDoc(doc(db, 'teachers', teacher.id), teacher),

  getUser: async uid => {
    const result = await getDoc(doc(db, 'users', uid));
    return result.exists ? { id: result.id, ...result.data() } : null;
  },

  getUsers: async () => records(await getDocs(collection(db, 'users')))
};
