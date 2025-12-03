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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      
      if (u) {
        // User is logged in - set online status
        const userStatusRef = ref(database, `users/${u.uid}/online`);
        set(userStatusRef, true);
        
        // Set offline status when user disconnects
        onDisconnect(userStatusRef).set(false);
      } else {
        // User is logged out
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const signup = (email, password) => createUserWithEmailAndPassword(auth, email, password);
  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
