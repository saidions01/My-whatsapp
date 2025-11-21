import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Login from '../pages/Login';
import Signup from '../pages/Signup';

export default function AuthenticationApp({ navigation }) {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <View style={styles.container}>
      {isLogin ? (
        <Login 
          onSwitchToSignup={() => setIsLogin(false)} 
          navigation={navigation} 
        />
      ) : (
        <Signup 
          onSwitchToLogin={() => setIsLogin(true)} 
          navigation={navigation}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
