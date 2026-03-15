import { useEffect, useRef } from 'react';
import { iniciarEscuchaEnTiempoReal } from '../api/firebase';
import useWaterStore from '../store/useWaterStore';
import { verificarNivelBajo, interpretarTDS } from '../utils/anomalyDetection';

/**
 * Hook principal de tiempo real.
 * Conecta Firebase con el store y ejecuta verificaciones automaticas.
 * usalo UNA sola vez en App.js
 */
export function useRealTimeData() {
  const { addAlerta, sensorData } = useWaterStore();
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    // Iniciar escucha de Firebase
    unsubscribeRef.current = iniciarEscuchaEnTiempoReal();

    // Cancelar escucha al desmontar la app
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  // Verificaciones automaticas cada vez que llegan datos nuevos
  useEffect(() => {
    if (!sensorData.ultima_actualizacion) return;

    // Verificar nivel bajo del tinaco
    const nivelAlerta = verificarNivelBajo(sensorData.nivel_pct);
    if (nivelAlerta.esAlerta) {
      addAlerta({
        tipo: 'NIVEL_BAJO',
        mensaje: nivelAlerta.mensaje,
        confianza: 1,
      });
    }

    // Verificar fuga fisica detectada por sensor YL-83
    if (sensorData.fuga_fisica) {
      addAlerta({
        tipo: 'FUGA_FISICA',
        mensaje: 'Sensor YL-83 detecto presencia de agua fuera del sistema. Revisar instalacion.',
        confianza: 1,
      });
    }

    // Verificar calidad del agua por TDS
    const calidad = interpretarTDS(sensorData.tds_ppm);
    if (calidad.nivel === 'Mala' || calidad.nivel === 'No apta') {
      addAlerta({
        tipo: 'CALIDAD_AGUA',
        mensaje: `Calidad del agua: ${calidad.nivel}. ${calidad.descripcion}`,
        confianza: 1,
      });
    }

  }, [sensorData.ultima_actualizacion]);
}