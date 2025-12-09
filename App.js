import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import AuthenticationApp from './components/AuthenticationApp';

import Home from './pages/Home';
import Chat from './pages/Chat';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Profile from './pages/Profile';
import Contacts from './pages/Contacts';
const Stack = createNativeStackNavigator();

export default function App() {
  return (

        <AuthProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Auth" component={AuthenticationApp} />
              <Stack.Screen name="Home" component={Home} />
              <Stack.Screen name="Chat" component={Chat} options={{
            headerShown: false,
          }}/>
              <Stack.Screen name="Login" component={Login} />
              <Stack.Screen name="Signup" component={Signup} />
              <Stack.Screen name="Profile" component={Profile} />
              <Stack.Screen name="Contacts" component={Contacts} />

            </Stack.Navigator>
          </NavigationContainer>
        </AuthProvider>
   
  );
}
