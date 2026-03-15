import { initializeApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, collection, addDoc, query, where, orderBy, getDocs, serverTimestamp } from 'firebase/firestore';
import useWaterStore from '../store/useWaterStore';
import { detectarAnomalia } from '../utils/anomalyDetection';

const firebaseConfig = {
  apiKey:            "AIzaSyDnYbL-MLez9rtij85bBghfJ_lA3XAxy2g",
  authDomain:        "sigara-app-91612.firebaseapp.com",
  projectId:         "sigara-app-91612",
  storageBucket:     "sigara-app-91612.firebasestorage.app",
  messagingSenderId: "438766700115",
  appId:             "1:438766700115:web:458c434812b2d8dcfda8a6",
};

// ─── Inicializar Firebase (solo una vez) ──────────────────────
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

const DEVICE_ID = 'sigara-001';

// ─── Escucha en tiempo real la ultima lectura del ESP32 ───────
export function iniciarEscuchaEnTiempoReal() {
  const { setSensorData, addAlerta, setDisconnected } = useWaterStore.getState();
  const bufferLocal = [];

  const unsubscribe = onSnapshot(
    doc(db, 'dispositivos', DEVICE_ID),
    (snapshot) => {
      if (!snapshot.exists()) return;

      const data = snapshot.data();
      setSensorData(data);

      // Buffer para deteccion de anomalias
      bufferLocal.push(data);
      if (bufferLocal.length > 10) bufferLocal.shift();

      // Detectar fugas
      const anomalia = detectarAnomalia(bufferLocal);
      if (anomalia.esFuga) {
        addAlerta(anomalia);
        guardarAlerta(anomalia);
      }
    },
    (error) => {
      console.error('[Firebase] Error en listener:', error);
      setDisconnected();
    }
  );

  return unsubscribe;
}

// ─── Guarda una alerta en Firestore ──────────────────────────
export async function guardarAlerta(anomalia) {
  try {
    await addDoc(
      collection(db, 'alertas', DEVICE_ID, 'historial'),
      {
        ...anomalia,
        resuelta: false,
        ts: serverTimestamp(),
      }
    );
  } catch (error) {
    console.error('[Firebase] Error guardando alerta:', error);
  }
}

// ─── Obtiene historial de consumo de los ultimos N dias ───────
export async function obtenerHistorial(dias = 7) {
  try {
    const hace = new Date();
    hace.setDate(hace.getDate() - dias);

    const snapshot = await getDocs(
      query(
        collection(db, 'dispositivos', DEVICE_ID, 'lecturas'),
        where('ts', '>=', hace),
        orderBy('ts', 'asc')
      )
    );

    return snapshot.docs.map((doc) => doc.data());
  } catch (error) {
    console.error('[Firebase] Error obteniendo historial:', error);
    return [];
  }
}
