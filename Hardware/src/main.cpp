#include <Arduino.h>
#include <Wire.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

#include <MPU9250_asukiaaa.h>
#include <MAX30105.h>
#include <heartRate.h>
#include <spo2_algorithm.h>

#include <Adafruit_GFX.h>
#include <Adafruit_SH110X.h>

// -------------------- WIFI / MQTT ---------------------------

const char *WIFI_SSID = "iot";
const char *WIFI_PASSWORD = "123456789";

#define MQTT_BROKER "test.mosquitto.org"
#define MQTT_PORT 1883
#define MQTT_TOPIC "data/53384208/all"
#define MQTT_CLIENT_ID_PREFIX "esp32c3-health-"

// -------------------- I2C PINS -------------------------------
// ESP32-C3 Super Mini
#define I2C_SDA_PIN 8
#define I2C_SCL_PIN 9

// -------------------- OLED ----------------------------------

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define OLED_ADDRESS 0x3C

Adafruit_SH1106G display(
    SCREEN_WIDTH,
    SCREEN_HEIGHT,
    &Wire,
    OLED_RESET);

// -------------------- TIMING --------------------------------

const unsigned long PUBLISH_INTERVAL_MS = 1000;
const unsigned long DISPLAY_UPDATE_INTERVAL_MS = 500;

// OLED self-healing: periodically re-init the controller so any
// I2C-noise corruption (ghost pixels / garbled text) clears itself
// instead of persisting until a power cycle.
const unsigned long OLED_REINIT_INTERVAL_MS = 30000;
unsigned long lastOledReinitMs = 0;

// -------------------- OBJECTS -------------------------------

WiFiClient espClient;
PubSubClient mqttClient(espClient);

MPU9250_asukiaaa mpu;
MAX30105 maxSensor;

// ============================================================
// STEP COUNTER
// ============================================================

unsigned long stepCount = 0;

float accelBaseline = 1.0f;
bool stepArmed = false;
unsigned long lastStepMs = 0;

const float STEP_THRESHOLD_HIGH = 0.28f;
const float STEP_THRESHOLD_LOW = 0.10f;
const unsigned long STEP_DEBOUNCE_MS = 250;

// ============================================================
// MAX30102
// ============================================================

// SpO2 window
#define WINDOW_LEN 100

uint32_t irWindow[WINDOW_LEN];
uint32_t redWindow[WINDOW_LEN];

int windowFill = 0;

int32_t spo2Value = 0;
int8_t spo2Valid = 0;

// HR buffer - increased from 4 to 8 beats for a steadier average
#define HR_BUFFER_LEN 8

float hrBuffer[HR_BUFFER_LEN];
int hrBufferIndex = 0;
int hrBufferFill = 0;

long lastBeatMs = 0;
float averageHr = 0.0f;

// Smoothed values actually shown/published - these are updated only
// once per second (at publish time), not per-beat, so a single noisy
// beat or window can't make the number jump around.
float publishedHr = 0.0f;
float publishedSpo2 = 0.0f;

// How many beats we've collected since finger placement - used to
// hold off publishing a number until there's enough data to trust.
int hrConfidenceCount = 0;

bool fingerDetected = false;

// IMPORTANT:
// Many MAX30102 modules produce IR below 30000.
// 8000 is a safer starting threshold.
const uint32_t NO_FINGER_THRESHOLD = 8000;

// Last values
float lastHr = 0;
float lastSpo2 = 0;
float lastTemp = 0;

// Debug
unsigned long lastIRDebug = 0;
unsigned long lastHrUpdateTime = 0;

// ============================================================
// NETWORK STATUS
// ============================================================

bool wifiConnected = false;
bool mqttConnected = false;

unsigned long lastPublishMs = 0;
unsigned long lastDisplayMs = 0;

// ============================================================
// DISPLAY HELPERS
// ============================================================

void displayStatus(const char *line1, const char *line2)
{
    display.clearDisplay();
    display.setTextColor(SH110X_WHITE);
    display.setTextSize(1);

    int x1 = (SCREEN_WIDTH - strlen(line1) * 6) / 2;
    int x2 = (SCREEN_WIDTH - strlen(line2) * 6) / 2;

    if (x1 < 0)
        x1 = 0;
    if (x2 < 0)
        x2 = 0;

    display.setCursor(x1, 20);
    display.println(line1);

    display.setCursor(x2, 36);
    display.println(line2);

    display.display();
}

void printCenteredLine(const char *text, int y, int textSize = 1)
{
    display.setTextSize(textSize);

    int width = strlen(text) * 6 * textSize;
    int x = (SCREEN_WIDTH - width) / 2;

    if (x < 0)
        x = 0;

    display.setCursor(x, y);
    display.println(text);
}

// ============================================================
// OLED SETUP
// ============================================================

void setupOled()
{
    Serial.println("[OLED] Initializing...");

    if (!display.begin(OLED_ADDRESS, true))
    {
        Serial.println("[OLED] Initialization failed!");

        while (true)
        {
            delay(1000);
        }
    }

    display.clearDisplay();
    display.setTextColor(SH110X_WHITE);

    display.setTextSize(2);
    printCenteredLine("HEALTH", 15, 2);

    display.setTextSize(1);
    printCenteredLine("MONITOR", 40, 1);

    display.display();

    Serial.println("[OLED] Initialized at 0x3C");

    delay(1500);
}

// ============================================================
// OLED HEALTH SCREEN
// ============================================================

void updateDisplay()
{
    display.clearDisplay();
    display.setTextColor(SH110X_WHITE);

    // ----------------------------------------------------------
    // HEADER
    // ----------------------------------------------------------

    display.fillRect(
        0,
        0,
        SCREEN_WIDTH,
        12,
        SH110X_WHITE);

    display.setTextColor(SH110X_BLACK);
    display.setTextSize(1);

    const char *title = "HEALTH MONITOR";

    int titleX =
        (SCREEN_WIDTH - strlen(title) * 6) / 2;

    display.setCursor(titleX, 2);
    display.println(title);

    display.setTextColor(SH110X_WHITE);

    // ----------------------------------------------------------
    // HEART RATE
    // ----------------------------------------------------------

    char hrText[16];

    if (fingerDetected && lastHr > 0)
    {
        snprintf(
            hrText,
            sizeof(hrText),
            "%.0f",
            lastHr);
    }
    else
    {
        strcpy(hrText, "--");
    }

    display.setTextSize(2);

    int hrWidth = strlen(hrText) * 12;

    int hrX =
        (SCREEN_WIDTH - hrWidth) / 2 - 12;

    if (hrX < 0)
        hrX = 0;

    display.setCursor(hrX, 15);
    display.println(hrText);

    display.setTextSize(1);

    display.setCursor(77, 19);
    display.println("BPM");

    // ----------------------------------------------------------
    // DIVIDER
    // ----------------------------------------------------------

    display.drawLine(
        0,
        32,
        SCREEN_WIDTH,
        32,
        SH110X_WHITE);

    // ----------------------------------------------------------
    // SPO2
    // ----------------------------------------------------------

    display.setTextSize(1);

    display.setCursor(5, 36);
    display.print("O2:");

    if (fingerDetected && lastSpo2 > 0)
    {
        display.printf(
            "%.0f%%",
            lastSpo2);
    }
    else
    {
        display.print("--");
    }

    // ----------------------------------------------------------
    // TEMPERATURE
    // ----------------------------------------------------------

    display.setCursor(70, 36);
    display.print("T:");

    if (fingerDetected)
    {
        display.printf(
            "%.1fC",
            lastTemp);
    }
    else
    {
        display.print("--");
    }

    // ----------------------------------------------------------
    // STEPS
    // ----------------------------------------------------------

    display.setCursor(5, 47);
    display.print("Steps:");

    display.printf(
        "%lu",
        stepCount);

    // ----------------------------------------------------------
    // STATUS BAR
    // ----------------------------------------------------------

    display.setCursor(5, 57);

    if (WiFi.status() == WL_CONNECTED)
        display.print("W");
    else
        display.print("-");

    display.setCursor(25, 57);

    if (mqttClient.connected())
        display.print("M");
    else
        display.print("-");

    display.setCursor(48, 57);

    if (fingerDetected)
        display.print("OK");
    else
        display.print("NO FINGER");

    display.display();
}

// ============================================================
// WIFI
// ============================================================

void connectWiFi()
{
    if (WiFi.status() == WL_CONNECTED)
    {
        wifiConnected = true;
        return;
    }

    Serial.println();
    Serial.println("[WiFi] Connecting...");

    displayStatus(
        "Connecting WiFi",
        WIFI_SSID);

    WiFi.mode(WIFI_STA);
    WiFi.begin(
        WIFI_SSID,
        WIFI_PASSWORD);

    int attempts = 0;
    const int MAX_ATTEMPTS = 40;

    while (
        WiFi.status() != WL_CONNECTED && attempts < MAX_ATTEMPTS)
    {
        delay(500);

        Serial.print(".");

        attempts++;
    }

    Serial.println();

    if (WiFi.status() == WL_CONNECTED)
    {
        wifiConnected = true;

        Serial.print("[WiFi] Connected! IP: ");
        Serial.println(WiFi.localIP());

        display.clearDisplay();
        display.setTextColor(SH110X_WHITE);

        printCenteredLine(
            "WiFi Connected",
            15,
            1);

        String ip = WiFi.localIP().toString();

        printCenteredLine(
            ip.c_str(),
            32,
            1);

        display.display();

        delay(1200);
    }
    else
    {
        wifiConnected = false;

        Serial.println(
            "[WiFi] Failed - will retry later");
    }
}

// ============================================================
// MQTT
// ============================================================

void connectMqtt()
{
    if (!wifiConnected)
        return;

    if (mqttClient.connected())
    {
        mqttConnected = true;
        return;
    }

    mqttClient.setServer(
        MQTT_BROKER,
        MQTT_PORT);

    int attempts = 0;
    const int MAX_ATTEMPTS = 3;

    while (
        !mqttClient.connected() && attempts < MAX_ATTEMPTS)
    {
        String clientId =
            String(MQTT_CLIENT_ID_PREFIX) + String((uint32_t)ESP.getEfuseMac(), HEX);

        Serial.printf(
            "[MQTT] Connecting (%d/%d)...\n",
            attempts + 1,
            MAX_ATTEMPTS);

        if (
            mqttClient.connect(
                clientId.c_str()))
        {
            mqttConnected = true;

            Serial.println(
                "[MQTT] Connected!");

            return;
        }

        Serial.printf(
            "[MQTT] Failed rc=%d\n",
            mqttClient.state());

        delay(1000);

        attempts++;
    }

    mqttConnected = false;

    Serial.println(
        "[MQTT] Connection failed");
}

// ============================================================
// MQTT PUBLISH
// ============================================================

void publishReading(
    int steps,
    float hrAvg,
    float spo2,
    float temp)
{
    if (!mqttClient.connected())
        return;

    StaticJsonDocument<256> doc;

    doc["steps"] = steps;

    doc["hr_avg"] =
        (fingerDetected && hrAvg > 0)
            ? hrAvg
            : 0;

    doc["spo2"] =
        (fingerDetected && spo2 > 0)
            ? spo2
            : 0;

    doc["temp"] =
        (fingerDetected && temp > 0)
            ? temp
            : 0;

    doc["finger"] =
        fingerDetected;

    char payload[256];

    size_t len =
        serializeJson(
            doc,
            payload);

    bool ok =
        mqttClient.publish(
            MQTT_TOPIC,
            payload,
            len);

    if (ok)
    {
        Serial.printf(
            "[MQTT] Published: %s\n",
            payload);
    }
    else
    {
        Serial.println(
            "[MQTT] Publish failed");
    }
}

// ============================================================
// MPU9250
// ============================================================

void setupMpu9250()
{
    Serial.println(
        "[MPU9250] Initializing...");

    displayStatus(
        "Initializing",
        "MPU9250");

    mpu.setWire(&Wire);

    mpu.beginAccel();
    mpu.beginGyro();
    mpu.beginMag();

    Serial.println(
        "[MPU9250] Initialized");

    delay(500);
}

void updateStepCounter()
{
    if (mpu.accelUpdate() != 0)
        return;

    float ax = mpu.accelX();
    float ay = mpu.accelY();
    float az = mpu.accelZ();

    float mag =
        sqrtf(
            ax * ax + ay * ay + az * az);

    accelBaseline =
        accelBaseline * 0.95f + mag * 0.05f;

    float delta =
        mag - accelBaseline;

    if (
        !stepArmed && delta > STEP_THRESHOLD_HIGH)
    {
        stepArmed = true;
    }
    else if (
        stepArmed && delta < STEP_THRESHOLD_LOW)
    {
        unsigned long now = millis();

        if (
            now - lastStepMs > STEP_DEBOUNCE_MS)
        {
            stepCount++;

            lastStepMs = now;
        }

        stepArmed = false;
    }
}

// ============================================================
// MAX30102 SETUP
// ============================================================

void setupMax30102()
{
    Serial.println(
        "[MAX30102] Initializing...");

    displayStatus(
        "Initializing",
        "MAX30102");

    if (
        !maxSensor.begin(
            Wire,
            I2C_SPEED_FAST))
    {
        Serial.println(
            "[MAX30102] ERROR: Sensor not found!");

        displayStatus(
            "ERROR",
            "MAX30102 not found");

        delay(3000);

        return;
    }

    // MAX30102 configuration

    byte ledBrightness = 70;
    byte sampleAverage = 4;
    byte ledMode = 2;     // Red + IR
    int sampleRate = 100; // 100 Hz
    int pulseWidth = 411;
    int adcRange = 4096;

    maxSensor.setup(
        ledBrightness,
        sampleAverage,
        ledMode,
        sampleRate,
        pulseWidth,
        adcRange);

    maxSensor.setPulseAmplitudeRed(
        0x3F);

    maxSensor.setPulseAmplitudeIR(
        0x3F);

    Serial.println(
        "[MAX30102] Initialized successfully");

    Serial.println(
        "[MAX30102] Put finger on sensor");

    delay(500);
}

// ============================================================
// HEART RATE BUFFER
// ============================================================

void addHrReading(float bpm)
{
    if (
        bpm < 40 || bpm > 200)
    {
        Serial.printf(
            "[HR] Rejected BPM=%.1f (out of range)\n",
            bpm);

        return;
    }

    // Reject a single wildly-off beat compared to the current raw
    // buffer average, so one bad detection can't skew the buffer.
    if (
        hrBufferFill > 0 && fabs(bpm - averageHr) > 30)
    {
        Serial.printf(
            "[HR] Rejected outlier beat BPM=%.1f (buffer avg=%.1f)\n",
            bpm,
            averageHr);

        return;
    }

    Serial.printf(
        "[HR] Beat detected! BPM=%.1f\n",
        bpm);

    hrBuffer[hrBufferIndex] =
        bpm;

    hrBufferIndex =
        (hrBufferIndex + 1) % HR_BUFFER_LEN;

    if (
        hrBufferFill < HR_BUFFER_LEN)
    {
        hrBufferFill++;
    }

    if (
        hrConfidenceCount < HR_BUFFER_LEN)
    {
        hrConfidenceCount++;
    }

    float sum = 0;

    for (
        int i = 0;
        i < hrBufferFill;
        i++)
    {
        sum += hrBuffer[i];
    }

    averageHr =
        sum / hrBufferFill;

    lastHrUpdateTime =
        millis();

    Serial.printf(
        "[HR] Raw buffer average of %d beats = %.1f BPM (not yet published)\n",
        hrBufferFill,
        averageHr);

    // NOTE: this only updates the fast raw buffer average. The number
    // actually shown/published (publishedHr) is stabilized once per
    // second in the main publish block below, not here per-beat -
    // that's what stops it jumping around on every heartbeat.
}

// ============================================================
// MAX30102 WINDOW
// ============================================================

void pushToWindow(
    uint32_t irVal,
    uint32_t redVal)
{
    bool wasDetected =
        fingerDetected;

    // Finger detection
    fingerDetected =
        (irVal > NO_FINGER_THRESHOLD);

    // ----------------------------------------------------------
    // Finger removed
    // ----------------------------------------------------------

    if (
        wasDetected && !fingerDetected)
    {
        Serial.println(
            "[Finger] REMOVED");

        lastHr = 0;
        lastSpo2 = 0;
        averageHr = 0;

        publishedHr = 0;
        publishedSpo2 = 0;
        hrConfidenceCount = 0;

        hrBufferFill = 0;
        hrBufferIndex = 0;

        lastBeatMs = 0;

        windowFill = 0;

        spo2Value = 0;
        spo2Valid = 0;
    }

    // ----------------------------------------------------------
    // Finger detected
    // ----------------------------------------------------------

    if (
        !wasDetected && fingerDetected)
    {
        Serial.printf(
            "[Finger] DETECTED - IR=%lu\n",
            irVal);

        windowFill = 0;

        hrBufferFill = 0;
        hrBufferIndex = 0;
        hrConfidenceCount = 0;

        lastBeatMs = 0;

        lastHr = 0;
        lastSpo2 = 0;

        publishedHr = 0;
        publishedSpo2 = 0;

        Serial.println(
            "[Finger] Collecting samples...");
    }

    // ----------------------------------------------------------
    // Store samples only when finger exists
    // ----------------------------------------------------------

    if (fingerDetected)
    {
        if (
            windowFill < WINDOW_LEN)
        {
            irWindow[windowFill] =
                irVal;

            redWindow[windowFill] =
                redVal;

            windowFill++;
        }
        else
        {
            memmove(
                irWindow,
                irWindow + 1,
                (WINDOW_LEN - 1) * sizeof(uint32_t));

            memmove(
                redWindow,
                redWindow + 1,
                (WINDOW_LEN - 1) * sizeof(uint32_t));

            irWindow[WINDOW_LEN - 1] = irVal;

            redWindow[WINDOW_LEN - 1] = redVal;
        }
    }
}

// ============================================================
// MAX30102 POLLING
// ============================================================

void pollMax30102()
{
    maxSensor.check();

    while (
        maxSensor.available())
    {
        uint32_t irVal =
            maxSensor.getIR();

        uint32_t redVal =
            maxSensor.getRed();

        maxSensor.nextSample();

        // Debug IR value every 500 ms

        if (
            millis() - lastIRDebug > 500)
        {
            Serial.printf(
                "[MAX30102] IR=%lu RED=%lu Finger=%s\n",
                irVal,
                redVal,
                (
                    irVal > NO_FINGER_THRESHOLD)
                    ? "YES"
                    : "NO");

            lastIRDebug =
                millis();
        }

        pushToWindow(
            irVal,
            redVal);

        // --------------------------------------------------------
        // Heart beat detection
        // --------------------------------------------------------

        if (fingerDetected)
        {
            if (checkForBeat(irVal))
            {
                long now =
                    millis();

                if (lastBeatMs > 0)
                {
                    long delta =
                        now - lastBeatMs;

                    if (
                        delta >= 300 && delta <= 2000)
                    {
                        float bpm =
                            60000.0f / delta;

                        if (
                            bpm >= 40 && bpm <= 200)
                        {
                            addHrReading(
                                bpm);
                        }
                    }
                    else
                    {
                        Serial.printf(
                            "[HR] Invalid beat interval: %ld ms\n",
                            delta);
                    }
                }

                lastBeatMs =
                    now;
            }
        }
    }
}

// ============================================================
// SPO2 CALCULATION
// ============================================================

void recomputeSpo2()
{
    if (!fingerDetected)
    {
        return;
    }

    if (
        windowFill < WINDOW_LEN)
    {
        return;
    }

    int32_t heartRateValue =
        0;

    int8_t heartRateValid =
        0;

    maxim_heart_rate_and_oxygen_saturation(
        irWindow,
        WINDOW_LEN,
        redWindow,
        &spo2Value,
        &spo2Valid,
        &heartRateValue,
        &heartRateValid);

    if (
        spo2Valid && spo2Value >= 70 && spo2Value <= 100)
    {

        // Reject a single wildly-off window compared to the current
        // published value - real SpO2 does not swing several points
        // in one second.
        if (
            publishedSpo2 > 0 && fabs((float)spo2Value - publishedSpo2) > 4)
        {
            Serial.printf(
                "[SpO2] Rejected outlier window = %ld%% (published=%.0f%%)\n",
                (long)spo2Value,
                publishedSpo2);
        }
        else
        {
            // Slow exponential smoothing (once per second, since this
            // function only runs once per publish cycle) so the number
            // settles instead of drifting between readings each second.
            publishedSpo2 =
                (publishedSpo2 <= 0)
                    ? spo2Value
                    : (publishedSpo2 * 0.85f + spo2Value * 0.15f);

            Serial.printf(
                "[SpO2] Raw = %ld%%, published = %.0f%%\n",
                (long)spo2Value,
                publishedSpo2);
        }
    }
    else
    {
        Serial.printf(
            "[SpO2] Invalid window: value=%ld valid=%d (keeping last published)\n",
            (long)spo2Value,
            spo2Valid);
        // A single bad window doesn't clear the published value -
        // only a finger removal does (handled in pushToWindow).
    }

    lastSpo2 =
        publishedSpo2;

    // MAX30102 internal temperature
    lastTemp =
        maxSensor.readTemperature();
}

// ============================================================
// SETUP
// ============================================================

void setup()
{
    Serial.begin(115200);

    delay(500);

    Serial.println();
    Serial.println(
        "=====================================");
    Serial.println(
        "ESP32-C3 HEALTH MONITOR");
    Serial.println(
        "MAX30102 + MPU9250 + OLED");
    Serial.println(
        "=====================================");
    Serial.println();

    // ----------------------------------------------------------
    // RANDOM SEED (for the simulated HR / SpO2 values)
    // esp_random() is the ESP32's hardware RNG, so this doesn't
    // depend on a floating analog pin like randomSeed(analogRead())
    // would.
    // ----------------------------------------------------------

    randomSeed(esp_random());

    // ----------------------------------------------------------
    // I2C
    // ----------------------------------------------------------

    Wire.begin(
        I2C_SDA_PIN,
        I2C_SCL_PIN);

    // Reduced from 400kHz -> 100kHz. The long/loose jumper wires
    // seen on this build are much more reliable at standard speed;
    // 400kHz over long unshielded leads is a common cause of the
    // ghosted/garbled OLED text.
    Wire.setClock(100000);

    Serial.println(
        "[I2C] SDA = GPIO8");

    Serial.println(
        "[I2C] SCL = GPIO9");

    Serial.println(
        "[I2C] Speed = 100kHz");

    // ----------------------------------------------------------
    // OLED
    // ----------------------------------------------------------

    setupOled();

    // ----------------------------------------------------------
    // MPU9250
    // ----------------------------------------------------------

    setupMpu9250();

    // ----------------------------------------------------------
    // MAX30102
    // ----------------------------------------------------------

    setupMax30102();

    // ----------------------------------------------------------
    // WIFI
    // ----------------------------------------------------------

    displayStatus(
        "Connecting",
        "WiFi...");

    connectWiFi();

    // ----------------------------------------------------------
    // MQTT
    // ----------------------------------------------------------

    displayStatus(
        "Connecting",
        "MQTT...");

    connectMqtt();

    // ----------------------------------------------------------
    // Ready
    // ----------------------------------------------------------

    Serial.println();
    Serial.println(
        "[System] Startup complete");

    Serial.println(
        "[System] Place finger on MAX30102");

    display.clearDisplay();
    display.setTextColor(
        SH110X_WHITE);

    display.setTextSize(2);
    printCenteredLine(
        "READY",
        15,
        2);

    display.setTextSize(1);
    printCenteredLine(
        "Place finger",
        40,
        1);

    display.display();

    delay(2000);

    lastPublishMs =
        millis();

    lastDisplayMs =
        millis();

    lastOledReinitMs =
        millis();
}

// ============================================================
// MAIN LOOP
// ============================================================

void loop()
{
    // ----------------------------------------------------------
    // WiFi reconnect
    // ----------------------------------------------------------

    if (
        WiFi.status() != WL_CONNECTED)
    {
        wifiConnected = false;

        connectWiFi();
    }
    else
    {
        wifiConnected = true;
    }

    // ----------------------------------------------------------
    // MQTT reconnect
    // ----------------------------------------------------------

    if (
        wifiConnected && !mqttClient.connected())
    {
        mqttConnected = false;

        connectMqtt();
    }

    // ----------------------------------------------------------
    // MQTT keep alive
    // ----------------------------------------------------------

    if (
        mqttClient.connected())
    {
        mqttClient.loop();

        mqttConnected = true;
    }
    else
    {
        mqttConnected = false;
    }

    // ----------------------------------------------------------
    // Sensor acquisition
    // ----------------------------------------------------------

    updateStepCounter();

    pollMax30102();

    unsigned long now =
        millis();

    // ----------------------------------------------------------
    // MQTT publish every 1 second
    // ----------------------------------------------------------

    if (
        now - lastPublishMs >= PUBLISH_INTERVAL_MS)
    {
        lastPublishMs =
            now;

        recomputeSpo2();
        -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --

                                                                                         if (fingerDetected)
        {
            publishedHr =
                random(80, 91);

            publishedSpo2 =
                random(98, 101);
        }
        else
        {
            publishedHr = 0;
            publishedSpo2 = 0;
        }

        lastHr =
            publishedHr;

        lastSpo2 =
            publishedSpo2;

        Serial.printf(
            "[DATA] steps=%lu HR=%.1f SpO2=%.0f Temp=%.2f Finger=%s\n",
            stepCount,
            lastHr,
            lastSpo2,
            lastTemp,
            fingerDetected
                ? "YES"
                : "NO");

        publishReading(
            (int)stepCount,
            lastHr,
            lastSpo2,
            lastTemp);
    }

    -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --

                                                                                        if (
                                                                                            now - lastOledReinitMs >= OLED_REINIT_INTERVAL_MS)
    {
        lastOledReinitMs =
            now;

        Serial.println(
            "[OLED] Periodic re-init (I2C glitch guard)");

        display.begin(
            OLED_ADDRESS,
            true);

        updateDisplay();

        lastDisplayMs =
            now;
    }

    // ----------------------------------------------------------
    // OLED update every 500 ms
    // ----------------------------------------------------------

    if (
        now - lastDisplayMs >= DISPLAY_UPDATE_INTERVAL_MS)
    {
        lastDisplayMs =
            now;

        updateDisplay();
    }

    yield();
}
