import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import AuthenticationApp from './components/AuthenticationApp';

import Home from './pages/Home';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

export default function App() {
  return (

        <AuthProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Auth" component={AuthenticationApp} />
              <Stack.Screen name="Home" component={Home} />
            </Stack.Navigator>
          </NavigationContainer>
        </AuthProvider>
   
  );
}
