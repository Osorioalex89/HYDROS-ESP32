#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ─── Configuracion WiFi ───────────────────────────────────────
#define WIFI_SSID     "INFINITUMADDC"
#define WIFI_PASSWORD "CCnjrCjhza"

// ─── Configuracion Firebase REST ─────────────────────────────
#define FIREBASE_PROJECT_ID "sigara-app-91612"
#define FIRESTORE_URL "https://firestore.googleapis.com/v1/projects/" \
                      FIREBASE_PROJECT_ID \
                      "/databases/(default)/documents/dispositivos/sigara-001"

// ─── Pines de sensores ────────────────────────────────────────
#define PIN_FLUJO  27
#define PIN_FUGA   32
#define PIN_TRIG   25
#define PIN_ECHO   33
#define PIN_TDS    34
#define PIN_RELE   14

// ─── Constantes ───────────────────────────────────────────────
#define FACTOR_FLUJO      7.5
#define ALTURA_TANQUE_CM  100.0
#define INTERVALO_MS      5000

// ─── Variables globales ───────────────────────────────────────
volatile long pulsos = 0;
float litrosAcumulados = 0;
unsigned long ultimoEnvio = 0;

void IRAM_ATTR contarPulso() {
  pulsos++;
}

// ─── Leer nivel del tinaco ────────────────────────────────────
float leerNivelTanque() {
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);

  long duracion = pulseIn(PIN_ECHO, HIGH, 30000);
  if (duracion == 0) return 0;

  float distanciaCm = duracion * 0.034 / 2.0;
  float nivelCm = ALTURA_TANQUE_CM - distanciaCm;
  return constrain((nivelCm / ALTURA_TANQUE_CM) * 100.0, 0, 100);
}

// ─── Leer flujo YF-S201 ───────────────────────────────────────
float leerFlujo() {
  long pulsosInicio = pulsos;
  delay(1000);
  long pulsosDelta = pulsos - pulsosInicio;
  return pulsosDelta / FACTOR_FLUJO;
}

// ─── Leer TDS ─────────────────────────────────────────────────
float leerTDS() {
  int adc = analogRead(PIN_TDS);
  float voltaje = adc * 3.3 / 4095.0;
  float tds = (133.42 * pow(voltaje, 3)
             - 255.86 * pow(voltaje, 2)
             + 857.39 * voltaje) * 0.5;
  return constrain(tds, 0, 1000);
}

// ─── Leer fuga YL-83 ─────────────────────────────────────────
bool leerFuga() {
  if (digitalRead(PIN_FUGA) == LOW) {
    delay(500);
    if (digitalRead(PIN_FUGA) == LOW) {
      return true;
    }
  }
  return false;
}
// ─── Calcular calidad del agua ────────────────────────────────
String calcularCalidad(float tds) {
  if (tds < 50)  return "Excelente";
  if (tds < 150) return "Buena";
  if (tds < 300) return "Regular";
  if (tds < 500) return "Mala";
  return "No apta";
}

// ─── Subir datos a Firestore via REST ────────────────────────
void subirAFirestore(float nivel, float flujo, float tds, bool fuga) {
  HTTPClient http;
  http.begin(FIRESTORE_URL + String("?updateMask.fieldPaths=nivel_pct"
    "&updateMask.fieldPaths=flujo_lpm"
    "&updateMask.fieldPaths=volumen_L"
    "&updateMask.fieldPaths=tds_ppm"
    "&updateMask.fieldPaths=calidad"
    "&updateMask.fieldPaths=fuga_fisica"
    "&updateMask.fieldPaths=voltaje_panel"));
  http.addHeader("Content-Type", "application/json");

  // Construir JSON en formato Firestore
  String calidad = calcularCalidad(tds);
  String body = "{\"fields\":{"
    "\"nivel_pct\":{\"doubleValue\":" + String(nivel, 1) + "},"
    "\"flujo_lpm\":{\"doubleValue\":" + String(flujo, 2) + "},"
    "\"volumen_L\":{\"doubleValue\":" + String(litrosAcumulados, 1) + "},"
    "\"tds_ppm\":{\"doubleValue\":" + String(tds, 0) + "},"
    "\"calidad\":{\"stringValue\":\"" + calidad + "\"},"
    "\"fuga_fisica\":{\"booleanValue\":" + (fuga ? "true" : "false") + "},"
    "\"voltaje_panel\":{\"doubleValue\":5.8}"
    "}}";

  int httpCode = http.PATCH(body);

  if (httpCode == 200) {
    Serial.println("[Firebase] Datos enviados OK");
  } else {
    Serial.printf("[Firebase] Error HTTP: %d\n", httpCode);
    Serial.println(http.getString());
  }

  http.end();
}

// ─── Leer estado de bomba desde Firestore ────────────────────
void leerEstadoBomba() {
  HTTPClient http;
  http.begin(String(FIRESTORE_URL) + "?mask.fieldPaths=bomba");

  int httpCode = http.GET();
  if (httpCode == 200) {
    String payload = http.getString();
    JsonDocument doc;
    deserializeJson(doc, payload);
    bool bomba = doc["fields"]["bomba"]["booleanValue"];
    digitalWrite(PIN_RELE, bomba ? LOW : HIGH);
    Serial.printf("[Bomba] Estado: %s\n", bomba ? "Encendida" : "Apagada");
  }
  http.end();
}

// ─── Conectar WiFi ────────────────────────────────────────────
void conectarWiFi() {
  Serial.print("[WiFi] Conectando");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.printf("\n[WiFi] Conectado. IP: %s\n",
                WiFi.localIP().toString().c_str());
}

// ─── Setup ────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);

  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  pinMode(PIN_FUGA, INPUT_PULLDOWN);
  pinMode(PIN_RELE, OUTPUT);
  digitalWrite(PIN_RELE, HIGH);

  pinMode(PIN_FLUJO, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(PIN_FLUJO),
                  contarPulso, RISING);

  conectarWiFi();
  Serial.println("[HYDROS] Sistema listo");
}

// ─── Loop ─────────────────────────────────────────────────────
void loop() {
  if (millis() - ultimoEnvio < INTERVALO_MS) return;
  ultimoEnvio = millis();

  if (WiFi.status() != WL_CONNECTED) {
    conectarWiFi();
    return;
  }

  float nivel = leerNivelTanque();
  float flujo = leerFlujo();
  float tds   = leerTDS();
  bool  fuga  = leerFuga();

  litrosAcumulados += (flujo / 60.0) * (INTERVALO_MS / 1000.0);

  Serial.printf("[Sensores] Nivel: %.1f%% | Flujo: %.2f L/min | TDS: %.0f ppm | Fuga: %s\n",
                nivel, flujo, tds, fuga ? "SI" : "NO");

  subirAFirestore(nivel, flujo, tds, fuga);
  leerEstadoBomba();
}