import { ref, set } from 'firebase/database';
import { database } from '../config/firebase';

export const createUserData = async (user) => {
  const { uid, email, name, pseudo, phone, profileImage } = user;

  // Validate user data
  if (!uid || !email || !name || !pseudo) {
    throw new Error('Missing required user fields');
  }

  const userData = {
    uid,
    email,
    name,
    pseudo,
    phone: phone || '',
    profileImage: profileImage || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
    createdAt: new Date().toISOString(),
  };

  // Save user data to the Realtime Database
  await set(ref(database, `users/${uid}`), userData);
  return userData;
};
