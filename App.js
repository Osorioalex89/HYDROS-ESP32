import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { useRealTimeData } from './src/hooks/useRealTimeData';

// Componente interno que activa la escucha de Firebase
function AppContent() {
  // Inicia la conexión con Firebase en tiempo real
  useRealTimeData();
  return <AppNavigator />;
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <AppContent />
    </NavigationContainer>
  );
}