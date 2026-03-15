import { create } from 'zustand';

const useWaterStore = create((set, get) => ({

  // ─── Estado del sensor en tiempo real ───────────────────────
 sensorData: {
  nivel_pct:      0,
  flujo_lpm:      0,
  volumen_L:      0,
  tds_ppm:        0,
  calidad:        'Sin datos',
  fuga_flujo:     false,   // detectada por algoritmo
  fuga_fisica:    false,   // detectada por sensor YL-83
  bomba:          false,
  voltaje_panel:  0,
  ultima_actualizacion: null,
},

  // ─── Estado de conexion ──────────────────────────────────────
  isConnected: false,

  // ─── Alertas activas ─────────────────────────────────────────
  alertas: [],

  // ─── Historial para graficas (ultimas 200 lecturas) ──────────
  historial: [],

  // ─── Acciones ────────────────────────────────────────────────

  // Llamada cada vez que llega un dato nuevo de Firebase
  setSensorData: (data) => set((state) => ({
    sensorData: {
      ...data,
      ultima_actualizacion: new Date(),
    },
    isConnected: true,
    historial: [
      ...state.historial.slice(-199),
      { ...data, timestamp: Date.now() },
    ],
  })),

  // Agrega una alerta nueva al inicio de la lista
  addAlerta: (alerta) => set((state) => ({
    alertas: [
      { id: Date.now(), ...alerta },
      ...state.alertas,
    ].slice(0, 50), // maximo 50 alertas en memoria
  })),

  // Marca una alerta como resuelta
  resolverAlerta: (id) => set((state) => ({
    alertas: state.alertas.map((a) =>
      a.id === id ? { ...a, resuelta: true } : a
    ),
  })),

  // Cuando se pierde conexion con Firebase
  setDisconnected: () => set({ isConnected: false }),

}));

export default useWaterStore;
