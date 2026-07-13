// ===========================
// ESP32-CAM Trigger Capture (GPIO13)
// ===========================

#include <WiFi.h>
#include "esp_camera.h"
#include <WebServer.h>

// ===========================
// Wi-Fi Configuration
// ===========================
const char* ssid = "fadhillllll";
const char* password = "Hellooll";

// ===========================
// Server Configuration
// ===========================
const char* serverName = "10.46.10.241";
const int serverPort = 8000;
const String serverPath = "/api/vision/classify?bin_id=BIN-002";

// ===========================
// Camera Pins (AI Thinker)
// ===========================
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

// ===========================
// Pin Tambahan
// ===========================
#define FLASH_PIN   4
#define TRIGGER_PIN 13  // dari Arduino (via resistor divider)

// ===========================
WebServer server(80);

// ===========================
// Handler Web (opsional tetap ada)
// ===========================
void handleCapture() {
  digitalWrite(FLASH_PIN, HIGH);
  delay(300);

  camera_fb_t * fb = esp_camera_fb_get();

  digitalWrite(FLASH_PIN, LOW);

  if(!fb) {
    server.send(500, "text/plain", "Camera capture failed");
    return;
  }

  server.setContentLength(fb->len);
  server.send(200, "image/jpeg", "");
  WiFiClient client = server.client();
  client.write(fb->buf, fb->len);

  esp_camera_fb_return(fb);
}

// ===========================
// Setup
// ===========================
void setup() {
  Serial.begin(115200);

  pinMode(FLASH_PIN, OUTPUT);
  digitalWrite(FLASH_PIN, LOW);

  pinMode(TRIGGER_PIN, INPUT);

  // WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected!");
  Serial.println(WiFi.localIP());

  // Camera config
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;

  if(psramFound()){
    config.frame_size = FRAMESIZE_UXGA;
    config.jpeg_quality = 10;
    config.fb_count = 2;
  } else {
    config.frame_size = FRAMESIZE_SVGA;
    config.jpeg_quality = 12;
    config.fb_count = 1;
  }

  if (esp_camera_init(&config) != ESP_OK) {
    Serial.println("Camera init failed");
    return;
  }

  // Web server tetap aktif (opsional)
  server.on("/capture", HTTP_GET, handleCapture);
  server.begin();

  Serial.println("Ready (Trigger Mode)");
}

// ===========================
// Upload function
// ===========================
void takeAndSendPicture() {
  digitalWrite(FLASH_PIN, HIGH);
  delay(300);

  camera_fb_t * fb = esp_camera_fb_get();

  digitalWrite(FLASH_PIN, LOW);

  if(!fb) {
    Serial.println("Capture failed");
    return;
  }

  WiFiClient client;
  if (!client.connect(serverName, serverPort)) {
    Serial.println("Server connect failed");
    esp_camera_fb_return(fb);
    return;
  }

  String head = "--Boundary\r\nContent-Disposition: form-data; name=\"file\"; filename=\"img.jpg\"\r\nContent-Type: image/jpeg\r\n\r\n";
  String tail = "\r\n--Boundary--\r\n";

  uint32_t totalLen = head.length() + fb->len + tail.length();

  client.println("POST " + serverPath + " HTTP/1.1");
  client.println("Host: " + String(serverName));
  client.println("Content-Length: " + String(totalLen));
  client.println("Content-Type: multipart/form-data; boundary=Boundary");
  client.println();
  client.print(head);

  client.write(fb->buf, fb->len);
  client.print(tail);

  Serial.println("Uploaded!");

  client.stop();
  esp_camera_fb_return(fb);
}

// ===========================
// Loop (Trigger-based)
// ===========================
bool lastState = LOW;
unsigned long lastTriggerTime = 0;
const int cooldown = 5000; // 5 detik biar ga spam

void loop() {
  server.handleClient();

  int state = digitalRead(TRIGGER_PIN);

  if (state == HIGH && lastState == LOW) {
    if (millis() - lastTriggerTime > cooldown) {
      Serial.println("Trigger! Taking picture...");
      takeAndSendPicture();
      lastTriggerTime = millis();
    }
  }

  lastState = state;
  delay(50);
}