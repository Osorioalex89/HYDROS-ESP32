import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Pantallas (el equipo de UI las llenara con diseno)
import DashboardScreen    from '../screens/DashboardScreen';
import WaterMonitorScreen from '../screens/WaterMonitorScreen';
import WaterQualityScreen from '../screens/WaterQualityScreen';
import StatisticsScreen   from '../screens/StatisticsScreen';
import AlertsScreen       from '../screens/AlertsScreen';
import ControlScreen      from '../screens/ControlScreen';

const Tab = createBottomTabNavigator();

const ICONS = {
  Dashboard:    { activo: 'home',           inactivo: 'home-outline'           },
  Monitoreo:    { activo: 'water',          inactivo: 'water-outline'          },
  Calidad:      { activo: 'flask',          inactivo: 'flask-outline'          },
  Estadisticas: { activo: 'bar-chart',      inactivo: 'bar-chart-outline'      },
  Alertas:      { activo: 'notifications',  inactivo: 'notifications-outline'  },
  Control:      { activo: 'settings',       inactivo: 'settings-outline'       },
};

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const iconConfig = ICONS[route.name];
          const iconName = focused
            ? iconConfig.activo
            : iconConfig.inactivo;
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor:   '#0077B6',
        tabBarInactiveTintColor: '#90A4AE',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0.5,
          borderTopColor: '#E0E0E0',
          height: 60,
          paddingBottom: 8,
        },
        headerStyle: {
          backgroundColor: '#0077B6',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'HYDROS', tabBarLabel: 'Inicio' }}
      />
      <Tab.Screen
        name="Monitoreo"
        component={WaterMonitorScreen}
        options={{ title: 'Monitoreo de Agua' }}
      />
      <Tab.Screen
        name="Calidad"
        component={WaterQualityScreen}
        options={{ title: 'Calidad del Agua' }}
      />
      <Tab.Screen
        name="Estadisticas"
        component={StatisticsScreen}
        options={{ title: 'Estadisticas', tabBarLabel: 'Estadisticas' }}
      />
      <Tab.Screen
        name="Alertas"
        component={AlertsScreen}
        options={{ title: 'Alertas del Sistema' }}
      />
      <Tab.Screen
        name="Control"
        component={ControlScreen}
        options={{ title: 'Control del Sistema' }}
      />
    </Tab.Navigator>
  );
}
