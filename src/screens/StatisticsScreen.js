import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons';
import useWaterStore from '../store/useWaterStore';

// Datos de prueba hasta que llegue el ESP32
const DATOS_SEMANA = [
  { value: 120, label: 'Lun', frontColor: '#0077B6' },
  { value: 135, label: 'Mar', frontColor: '#0077B6' },
  { value: 118, label: 'Mie', frontColor: '#0077B6' },
  { value: 290, label: 'Jue', frontColor: '#D50000' }, // anomalia
  { value: 125, label: 'Vie', frontColor: '#0077B6' },
  { value: 110, label: 'Sab', frontColor: '#0077B6' },
  { value: 98,  label: 'Dom', frontColor: '#0077B6' },
];

const DATOS_MES = [
  { value: 820, label: 'Sem 1', frontColor: '#0077B6' },
  { value: 950, label: 'Sem 2', frontColor: '#0077B6' },
  { value: 1240, label: 'Sem 3', frontColor: '#D50000' }, // anomalia
  { value: 830, label: 'Sem 4', frontColor: '#0077B6' },
];

// Detecta si un valor es anomalia comparando con el promedio
function detectarAnomalias(datos) {
  const promedio = datos.reduce((a, b) => a + b.value, 0) / datos.length;
  const umbral = promedio * 1.4; // 40% sobre el promedio = sospechoso
  return datos.map((d) => ({
    ...d,
    frontColor: d.value > umbral ? '#D50000' : '#0077B6',
    esAnomalia: d.value > umbral,
  }));
}

export default function StatisticsScreen() {
  const [tabActivo, setTabActivo] = useState('semanal');
  const { historial } = useWaterStore();

  const datosSemana  = detectarAnomalias(DATOS_SEMANA);
  const datosMes     = detectarAnomalias(DATOS_MES);
  const datosActivos = tabActivo === 'semanal' ? datosSemana : datosMes;

  // Calcular estadisticas
  const valores    = datosActivos.map((d) => d.value);
  const promedio   = Math.round(valores.reduce((a, b) => a + b, 0) / valores.length);
  const maximo     = Math.max(...valores);
  const minimo     = Math.min(...valores);
  const anomalias  = datosActivos.filter((d) => d.esAnomalia);

  return (
    <ScrollView style={styles.container}>

      {/* Tabs semanal / mensual */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tabActivo === 'semanal' && styles.tabActivo]}
          onPress={() => setTabActivo('semanal')}
        >
          <Text style={[styles.tabTexto, tabActivo === 'semanal' && styles.tabTextoActivo]}>
            Semanal
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tabActivo === 'mensual' && styles.tabActivo]}
          onPress={() => setTabActivo('mensual')}
        >
          <Text style={[styles.tabTexto, tabActivo === 'mensual' && styles.tabTextoActivo]}>
            Mensual
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tarjetas de resumen */}
      <View style={styles.grid}>
        <View style={styles.cardPequeno}>
          <Text style={styles.cardLabel}>Promedio</Text>
          <Text style={styles.cardValor}>{promedio} L</Text>
        </View>
        <View style={styles.cardPequeno}>
          <Text style={styles.cardLabel}>Maximo</Text>
          <Text style={[styles.cardValor, { color: '#D50000' }]}>{maximo} L</Text>
        </View>
        <View style={styles.cardPequeno}>
          <Text style={styles.cardLabel}>Minimo</Text>
          <Text style={[styles.cardValor, { color: '#00C853' }]}>{minimo} L</Text>
        </View>
        <View style={styles.cardPequeno}>
          <Text style={styles.cardLabel}>Anomalias</Text>
          <Text style={[styles.cardValor, { color: anomalias.length > 0 ? '#D50000' : '#00C853' }]}>
            {anomalias.length}
          </Text>
        </View>
      </View>

      {/* Grafica de barras */}
      <View style={styles.card}>
        <Text style={styles.cardTitulo}>
          Consumo {tabActivo === 'semanal' ? 'por dia (L)' : 'por semana (L)'}
        </Text>
        <BarChart
          data={datosActivos}
          width={280}
          height={200}
          barWidth={tabActivo === 'semanal' ? 32 : 52}
          spacing={tabActivo === 'semanal' ? 10 : 20}
          roundedTop
          hideRules
          xAxisThickness={1}
          yAxisThickness={0}
          yAxisTextStyle={{ color: '#90A4AE', fontSize: 11 }}
          xAxisLabelTextStyle={{ color: '#455A64', fontSize: 11 }}
          noOfSections={4}
        />
      </View>

      {/* Alerta de anomalia si existe */}
      {anomalias.length > 0 && (
        <View style={styles.alertaCard}>
          <Ionicons name="warning" size={20} color="#FF6D00" />
          <View style={{ flex: 1 }}>
            <Text style={styles.alertaTitulo}>Consumo inusual detectado</Text>
            <Text style={styles.alertaTexto}>
              {anomalias.map((a) => a.label).join(', ')} superaron el 40% del promedio.
              Posible fuga o uso excesivo.
            </Text>
          </View>
        </View>
      )}

      {/* Leyenda */}
      <View style={styles.leyenda}>
        <View style={styles.leyendaItem}>
          <View style={[styles.leyendaColor, { backgroundColor: '#0077B6' }]} />
          <Text style={styles.leyendaTexto}>Consumo normal</Text>
        </View>
        <View style={styles.leyendaItem}>
          <View style={[styles.leyendaColor, { backgroundColor: '#D50000' }]} />
          <Text style={styles.leyendaTexto}>Posible anomalia</Text>
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#F5F9FF', padding: 16 },
  tabs:             { flexDirection: 'row', backgroundColor: '#E3F2FD', borderRadius: 10, padding: 4, marginBottom: 16 },
  tab:              { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabActivo:        { backgroundColor: '#0077B6' },
  tabTexto:         { fontSize: 14, color: '#0077B6', fontWeight: '500' },
  tabTextoActivo:   { color: '#FFFFFF' },
  grid:             { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  cardPequeno:      { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, alignItems: 'center', elevation: 2, width: '47%' },
  cardLabel:        { fontSize: 12, color: '#90A4AE', marginBottom: 4 },
  cardValor:        { fontSize: 20, fontWeight: 'bold', color: '#0077B6' },
  card:             { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 },
  cardTitulo:       { fontSize: 14, color: '#455A64', fontWeight: '500', marginBottom: 16 },
  alertaCard:       { backgroundColor: '#FFF3E0', borderRadius: 12, padding: 16, marginBottom: 16, flexDirection: 'row', gap: 12, alignItems: 'flex-start', borderLeftWidth: 4, borderLeftColor: '#FF6D00' },
  alertaTitulo:     { fontSize: 14, fontWeight: '500', color: '#E65100', marginBottom: 4 },
  alertaTexto:      { fontSize: 13, color: '#BF360C', lineHeight: 18 },
  leyenda:          { flexDirection: 'row', gap: 16, justifyContent: 'center', marginBottom: 24 },
  leyendaItem:      { flexDirection: 'row', alignItems: 'center', gap: 6 },
  leyendaColor:     { width: 12, height: 12, borderRadius: 3 },
  leyendaTexto:     { fontSize: 12, color: '#455A64' },
});