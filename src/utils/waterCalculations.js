/**
 * Calcula el consumo promedio diario basado en el historial.
 * @param {Array} historial - Array de lecturas con timestamp y volumen_L
 * @returns {number} Promedio de litros por dia
 */
export function calcularPromedioDiario(historial) {
  if (!historial || historial.length === 0) return 0;

  // Agrupar lecturas por dia
  const porDia = {};
  historial.forEach((lectura) => {
    const fecha = new Date(lectura.timestamp).toLocaleDateString();
    if (!porDia[fecha]) porDia[fecha] = [];
    porDia[fecha].push(lectura.volumen_L);
  });

  // Calcular maximo por dia (el ultimo valor acumulado del dia)
  const totalesPorDia = Object.values(porDia).map(
    (lecturas) => Math.max(...lecturas)
  );

  const suma = totalesPorDia.reduce((a, b) => a + b, 0);
  return parseFloat((suma / totalesPorDia.length).toFixed(1));
}

/**
 * Prepara datos del historial para mostrar en grafica semanal.
 * @param {Array} historial - Array de lecturas
 * @returns {Array} Datos formateados para react-native-gifted-charts
 */
export function prepararDatosGrafica(historial) {
  if (!historial || historial.length === 0) return [];

  const dias = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
  const porDia = {};

  historial.forEach((lectura) => {
    const fecha = new Date(lectura.timestamp);
    const nombreDia = dias[fecha.getDay()];
    if (!porDia[nombreDia]) porDia[nombreDia] = [];
    porDia[nombreDia].push(lectura.volumen_L);
  });

  return Object.entries(porDia).map(([dia, lecturas]) => ({
    label: dia,
    value: parseFloat(Math.max(...lecturas).toFixed(1)),
  }));
}

/**
 * Calcula cuantos dias le quedan al tinaco con el consumo actual.
 * @param {number} nivelPct - Nivel actual en %
 * @param {number} capacidadTotalL - Capacidad total del tinaco en litros
 * @param {number} promedioDiarioL - Consumo promedio diario en litros
 * @returns {number} Dias estimados restantes
 */
export function calcularDiasRestantes(nivelPct, capacidadTotalL, promedioDiarioL) {
  if (promedioDiarioL === 0) return null;
  const litrosRestantes = (nivelPct / 100) * capacidadTotalL;
  return parseFloat((litrosRestantes / promedioDiarioL).toFixed(1));
}

/**
 * Calcula el ahorro de agua comparando con el promedio anterior.
 * @param {number} consumoActual - Litros consumidos este mes
 * @param {number} consumoAnterior - Litros consumidos el mes pasado
 * @returns {{ litrosAhorrados: number, porcentaje: number }}
 */
export function calcularAhorro(consumoActual, consumoAnterior) {
  if (consumoAnterior === 0) return { litrosAhorrados: 0, porcentaje: 0 };
  const litrosAhorrados = consumoAnterior - consumoActual;
  const porcentaje = parseFloat(
    ((litrosAhorrados / consumoAnterior) * 100).toFixed(1)
  );
  return { litrosAhorrados, porcentaje };
}
