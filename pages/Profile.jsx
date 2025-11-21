import React, { useEffect, useState } from 'react';
import { View, Text, Button } from 'react-native';
import { auth, database } from '../config/firebase'; // modular imports
import { ref, onValue, off } from 'firebase/database';
import { signOut } from 'firebase/auth';

export default function Profile({ navigation }) {
  const [userData, setUserData] = useState(null);
  const user = auth.currentUser; // get current user from modular auth

  useEffect(() => {
    if (user) {
      const userRef = ref(database, `users/${user.uid}`);

      const unsubscribe = onValue(userRef, snapshot => {
        setUserData(snapshot.val());
      });

      // Cleanup listener
      return () => off(userRef);
    }
  }, [user]);

  const logout = async () => {
    try {
      await signOut(auth); // modular signOut
      navigation.replace('NewUser'); // navigate after logout
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <View style={{ flex: 1, padding: 10 }}>
      {userData ? (
        <>
          <Text>Email: {userData.email}</Text>
          <Text>Joined: {new Date(userData.createdAt).toLocaleDateString()}</Text>
        </>
      ) : (
        <Text>Loading...</Text>
      )}
      <Button title="Logout" onPress={logout} />
    </View>
  );
}
