import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useWaterStore from '../store/useWaterStore';

export default function DashboardScreen() {
  const { sensorData, alertas, isConnected } = useWaterStore();

  // Color del nivel segun porcentaje
  function colorNivel(pct) {
    if (pct > 50) return '#00C853';
    if (pct > 20) return '#FFD600';
    return '#D50000';
  }

  return (
    <ScrollView style={styles.container}>

      {/* Estado de conexion */}
      <View style={[styles.conexion, { backgroundColor: isConnected ? '#E8F5E9' : '#FFEBEE' }]}>
        <Ionicons
          name={isConnected ? 'wifi' : 'wifi-outline'}
          size={16}
          color={isConnected ? '#00C853' : '#D50000'}
        />
        <Text style={[styles.conexionTexto, { color: isConnected ? '#00C853' : '#D50000' }]}>
          {isConnected ? 'Sistema conectado' : 'Sin conexion'}
        </Text>
      </View>

      {/* Nivel del tinaco */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Nivel del tinaco</Text>
        <Text style={[styles.cardValorGrande, { color: colorNivel(sensorData.nivel_pct) }]}>
          {sensorData.nivel_pct}%
        </Text>
        {/* Barra de nivel */}
        <View style={styles.barraFondo}>
          <View style={[styles.barraRelleno, {
            width: `${sensorData.nivel_pct}%`,
            backgroundColor: colorNivel(sensorData.nivel_pct)
          }]} />
        </View>
      </View>

      {/* Tarjetas de datos */}
      <View style={styles.grid}>
        <View style={styles.cardPequeno}>
          <Ionicons name="water" size={24} color="#0077B6" />
          <Text style={styles.cardLabelPequeno}>Consumo hoy</Text>
          <Text style={styles.cardValor}>{sensorData.volumen_L} L</Text>
        </View>

        <View style={styles.cardPequeno}>
          <Ionicons name="speedometer" size={24} color="#0077B6" />
          <Text style={styles.cardLabelPequeno}>Flujo actual</Text>
          <Text style={styles.cardValor}>{sensorData.flujo_lpm} L/min</Text>
        </View>

        <View style={styles.cardPequeno}>
          <Ionicons name="flask" size={24} color="#0077B6" />
          <Text style={styles.cardLabelPequeno}>Calidad</Text>
          <Text style={styles.cardValor}>{sensorData.calidad}</Text>
        </View>

        <View style={styles.cardPequeno}>
          <Ionicons name="sunny" size={24} color="#FFD600" />
          <Text style={styles.cardLabelPequeno}>Panel solar</Text>
          <Text style={styles.cardValor}>{sensorData.voltaje_panel} V</Text>
        </View>
      </View>

      {/* Alertas recientes */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Alertas recientes</Text>
        {alertas.length === 0 ? (
          <View style={styles.sinAlertas}>
            <Ionicons name="checkmark-circle" size={24} color="#00C853" />
            <Text style={styles.sinAlertasTexto}>Sin alertas activas</Text>
          </View>
        ) : (
          alertas.slice(0, 3).map((alerta) => (
            <View key={alerta.id} style={styles.alertaItem}>
              <Ionicons name="warning" size={18} color="#FF6D00" />
              <Text style={styles.alertaTexto}>{alerta.mensaje}</Text>
            </View>
          ))
        )}
      </View>

      {/* Estado de la bomba */}
      <View style={[styles.card, styles.bombaCard,
        { backgroundColor: sensorData.bomba ? '#E3F2FD' : '#F5F5F5' }]}>
        <Ionicons
          name={sensorData.bomba ? 'power' : 'power-outline'}
          size={28}
          color={sensorData.bomba ? '#0077B6' : '#90A4AE'}
        />
        <Text style={styles.bombaTexto}>
          Bomba: {sensorData.bomba ? 'Encendida' : 'Apagada'}
        </Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#F5F9FF', padding: 16 },
  conexion:           { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8, borderRadius: 8, marginBottom: 16 },
  conexionTexto:      { fontSize: 13, fontWeight: '500' },
  card:               { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 },
  cardLabel:          { fontSize: 13, color: '#90A4AE', marginBottom: 8 },
  cardValorGrande:    { fontSize: 48, fontWeight: 'bold', marginBottom: 12 },
  barraFondo:         { height: 12, backgroundColor: '#E0E0E0', borderRadius: 6, overflow: 'hidden' },
  barraRelleno:       { height: 12, borderRadius: 6 },
  grid:               { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  cardPequeno:        { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, alignItems: 'center', elevation: 2, width: '47%' },
  cardLabelPequeno:   { fontSize: 12, color: '#90A4AE', marginTop: 8, marginBottom: 4 },
  cardValor:          { fontSize: 18, fontWeight: 'bold', color: '#0077B6' },
  sinAlertas:         { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 8 },
  sinAlertasTexto:    { color: '#00C853', fontSize: 14 },
  alertaItem:         { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#F0F0F0' },
  alertaTexto:        { fontSize: 13, color: '#455A64', flex: 1 },
  bombaCard:          { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bombaTexto:         { fontSize: 16, fontWeight: '500', color: '#455A64' },
});