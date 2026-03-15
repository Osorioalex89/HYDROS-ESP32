// --- Configuracion de umbrales del sistema ---
const CONFIG = {
  // Flujo minimo para considerar que hay agua corriendo
  FLUJO_MINIMO_LPM: 0.3,

  // Hora de inicio y fin de madrugada (nadie usa agua aqui)
  MADRUGADA_INICIO: 1,
  MADRUGADA_FIN: 5,

  // Varianza maxima para considerar flujo "constante" (posible fuga)
  VARIANZA_MAXIMA: 0.05,

  // Nivel minimo del tinaco antes de mandar alerta
  NIVEL_BAJO_PCT: 20,

  // Nivel de TDS para cada categoria de calidad
  TDS_EXCELENTE: 50,
  TDS_BUENA: 150,
  TDS_REGULAR: 300,
  TDS_MALA: 500,
};

/**
 * Analiza un buffer de lecturas recientes y detecta anomalias.
 * @param {Array} buffer - ultimas N lecturas del sensor
 * @returns {{ esFuga: boolean, tipo: string, mensaje: string, confianza: number }}
 */
export function detectarAnomalia(buffer) {
  if (!buffer || buffer.length < 5) {
    return { esFuga: false };
  }

  const ahora = new Date();
  const hora = ahora.getHours();
  const enMadrugada =
    hora >= CONFIG.MADRUGADA_INICIO && hora <= CONFIG.MADRUGADA_FIN;

  const flujos = buffer.map((l) => l.flujo_lpm);
  const todasConFlujo = flujos.every((f) => f >= CONFIG.FLUJO_MINIMO_LPM);

  // CASO 1: Flujo en madrugada = fuga casi segura
  if (enMadrugada && todasConFlujo) {
    return {
      esFuga: true,
      tipo: 'FUGA_NOCTURNA',
      confianza: 0.95,
      mensaje: `Flujo detectado a las ${hora}:00 AM. Nadie deberia usar agua a esta hora.`,
    };
  }

  // CASO 2: Flujo constante sin variacion
  if (todasConFlujo) {
    const promedio = flujos.reduce((a, b) => a + b, 0) / flujos.length;
    const varianza =
      flujos.reduce((sum, v) => sum + Math.pow(v - promedio, 2), 0) /
      flujos.length;

    if (varianza < CONFIG.VARIANZA_MAXIMA) {
      return {
        esFuga: true,
        tipo: 'FLUJO_CONSTANTE',
        confianza: 0.80,
        mensaje: `Flujo constante de ${promedio.toFixed(1)} L/min detectado. Posible fuga en tuberia.`,
      };
    }
  }

  return { esFuga: false, tipo: null, confianza: 0, mensaje: null };
}

/**
 * Interpreta el valor TDS y devuelve nivel de calidad y color.
 * @param {number} ppm - Valor del sensor TDS
 */
export function interpretarTDS(ppm) {
  if (ppm < CONFIG.TDS_EXCELENTE) {
    return {
      nivel: 'Excelente',
      color: '#00C853',
      descripcion: 'Agua muy pura, sin minerales detectables.',
    };
  }
  if (ppm < CONFIG.TDS_BUENA) {
    return {
      nivel: 'Buena',
      color: '#64DD17',
      descripcion: 'Agua apta para consumo, minerales normales.',
    };
  }
  if (ppm < CONFIG.TDS_REGULAR) {
    return {
      nivel: 'Regular',
      color: '#FFD600',
      descripcion: 'Presencia moderada de minerales. Considerar filtracion.',
    };
  }
  if (ppm < CONFIG.TDS_MALA) {
    return {
      nivel: 'Mala',
      color: '#FF6D00',
      descripcion: 'Alto contenido de minerales. Se recomienda filtrar.',
    };
  }
  return {
    nivel: 'No apta',
    color: '#D50000',
    descripcion: 'Agua con exceso de solidos disueltos. No consumir.',
  };
}

export function pulsosALitros(pulsosTotal) {
  const FACTOR_CALIBRACION = 450;
  return parseFloat((pulsosTotal / FACTOR_CALIBRACION).toFixed(2));
}

export function verificarNivelBajo(nivelPct) {
  if (nivelPct <= CONFIG.NIVEL_BAJO_PCT) {
    return {
      esAlerta: true,
      mensaje: `Nivel del tinaco al ${nivelPct}%. Se recomienda activar la bomba.`,
    };
  }
  return { esAlerta: false };
}
// En anomalyDetection.js puedes agregar esto después
export function verificarPanelSolar(voltaje) {
  if (voltaje >= 5.5) return { estado: 'Optimo',   color: '#00C853' };
  if (voltaje >= 4.0) return { estado: 'Normal',   color: '#64DD17' };
  if (voltaje >= 2.5) return { estado: 'Bajo',     color: '#FFD600' };
  return               { estado: 'Sin energia', color: '#D50000' };
}