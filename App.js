import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import { AuthContext, AuthProvider } from './src/context/AuthContext';
import { StatusBar } from 'expo-status-bar';

function NavigationWrapper() {
  const { user, isGuest } = useContext(AuthContext);

  return (
    <NavigationContainer>
      {user || isGuest ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationWrapper />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}


