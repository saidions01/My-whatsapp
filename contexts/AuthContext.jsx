import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, database } from '../config/firebase.js';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { ref, set, onDisconnect } from 'firebase/database';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        // User is logged in
        setUser(authUser);
        
        // Set online status in Realtime Database
        const userStatusRef = ref(database, `users/${authUser.uid}/online`);
        await set(userStatusRef, true);
        
        // Set offline status when user disconnects
        onDisconnect(userStatusRef).set(false);
        
        // Try to get additional user data from Realtime Database
        try {
          const userDataRef = ref(database, `users/${authUser.uid}`);
          // You might want to fetch user data here if needed
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        // User is logged out
        setUser(null);
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (email, password, userData) => {
    try {
      // 1. Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const authUser = userCredential.user;
      
      // 2. Save additional user data to Realtime Database
      const userRef = ref(database, `users/${authUser.uid}`);
      await set(userRef, {
        uid: authUser.uid,
        email: authUser.email,
        name: userData.name || '',
        pseudo: userData.pseudo || '',
        phone: userData.phone || '',
        profileImage: userData.profileImage || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
        createdAt: new Date().toISOString(),
        online: true
      });
      
      // 3. Set online status
      const userStatusRef = ref(database, `users/${authUser.uid}/online`);
      await set(userStatusRef, true);
      
      // 4. Set offline status when user disconnects
      onDisconnect(userStatusRef).set(false);
      
      return userCredential;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Set offline status before logging out
      if (user) {
        const userStatusRef = ref(database, `users/${user.uid}/online`);
        await set(userStatusRef, false);
      }
      
      // Sign out from Firebase Auth
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const value = {
    user,
    login,
    signup,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};