import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../api/firebase';
import useWaterStore from '../store/useWaterStore';

const DEVICE_ID = 'HYDROS-001';

/**
 * Hook para controlar la bomba de agua remotamente.
 * Lo usa la pantalla ControlScreen.js
 */
export function useBomba() {
  const { sensorData } = useWaterStore();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const controlarBomba = async (encender) => {
    setCargando(true);
    setError(null);

    try {
      await updateDoc(
        doc(db, 'dispositivos', DEVICE_ID),
        { bomba: encender }
      );
    } catch (err) {
      console.error('[Bomba] Error al cambiar estado:', err);
      setError('No se pudo conectar con el sistema. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  return {
    bombaActiva:    sensorData.bomba,
    cargando,
    error,
    encenderBomba:  () => controlarBomba(true),
    apagarBomba:    () => controlarBomba(false),
  };
}
