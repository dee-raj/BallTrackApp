import React, { useContext, useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import AppNavigator from './src/navigation/AppNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import { AuthContext, AuthProvider } from './src/context/AuthContext';
import { StatusBar } from 'expo-status-bar';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

function NavigationWrapper() {
  const { user, isGuest } = useContext(AuthContext);
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts or make any API calls if needed
        // For now, we just simulate a small wait or check auth
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      // This tells the splash screen to hide immediately
      SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

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
      {/* <StatusBar style="auto" /> */}
    </AuthProvider>
  );
}


