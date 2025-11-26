// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDknokXw153mCo8WQtScDs9kqFNH-PitJc",
  authDomain: "gestioncontact-bf5c4.firebaseapp.com",
  databaseURL: "https://gestioncontact-bf5c4-default-rtdb.firebaseio.com",
  projectId: "gestioncontact-bf5c4",
  storageBucket: "gestioncontact-bf5c4.firebasestorage.app",
  messagingSenderId: "184122774010",
  appId: "1:184122774010:web:cbdc76818b2fb3fdaad443",
  measurementId: "G-PWJGM575V9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

