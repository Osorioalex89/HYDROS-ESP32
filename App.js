import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { iniciarEscuchaEnTiempoReal } from './src/api/firebase';

export default function App() {
  useEffect(() => {
    const unsubscribe = iniciarEscuchaEnTiempoReal();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <AppNavigator />
    </NavigationContainer>
  );
}