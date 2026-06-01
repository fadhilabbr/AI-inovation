#include <WiFi.h>
#include "esp_camera.h"
#include <WebServer.h> // Tambahan library Web Server

// ===========================
// Wi-Fi Configuration
// ===========================
const char* ssid = "fadhillllll";          // Wi-Fi Anda
const char* password = "Hellooll";        // Password Wi-Fi Anda

// ===========================
// Server Configuration (Untuk mode client upload)
// ===========================
const char* serverName = "10.46.10.241";  // IP Laptop/Backend Anda
const int serverPort = 8000;
const String serverPath = "/api/vision/classify?bin_id=BIN-002";

// ===========================
// Camera Pins (AI Thinker Model)
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

unsigned long previousMillis = 0;
const long interval = 30000; // Upload berkala ke backend setiap 30 detik

// ===========================
// Flash LED Pin
// ===========================
#define FLASH_PIN 4

// Inisialisasi Web Server di port 80
WebServer server(80);

// Fungsi untuk menangani request GET /capture dari laptop
void handleCapture() {
  // Nyalakan Flash sesaat sebelum mengambil gambar
  digitalWrite(FLASH_PIN, HIGH);
  delay(300); // Berikan waktu sebentar agar sensor kamera menyesuaikan cahaya
  
  camera_fb_t * fb = esp_camera_fb_get();
  
  // Matikan Flash segera setelah gambar diambil
  digitalWrite(FLASH_PIN, LOW);
  if(!fb) {
    Serial.println("Camera capture failed");
    server.send(500, "text/plain", "Camera capture failed");
    return;
  }
  
  // Kirim header HTTP image/jpeg
  server.setContentLength(fb->len);
  server.send(200, "image/jpeg", "");
  
  // Kirim data byte gambar
  WiFiClient client = server.client();
  client.write(fb->buf, fb->len);
  
  // Kembalikan buffer kamera
  esp_camera_fb_return(fb);
  Serial.println("Image served via Web Server!");
}

void setup() {
  Serial.begin(115200);
  Serial.println();
  
  // Inisialisasi pin flash sebagai output
  pinMode(FLASH_PIN, OUTPUT);
  // Matikan flash di awal agar tidak menyilaukan
  digitalWrite(FLASH_PIN, LOW);
  
  // Wi-Fi setup
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected!");
  Serial.print("IP Address ESP32-CAM: ");
  Serial.println(WiFi.localIP()); // Mencetak IP ESP32-CAM di serial monitor

  // Camera setup
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

  // Initialize camera
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x", err);
    return;
  }
  Serial.println("Camera initialized. Ready!");

  // Routing Web Server
  server.on("/capture", HTTP_GET, handleCapture);
  server.on("/", HTTP_GET, handleCapture);
  server.begin();
  Serial.println("Web Server ESP32-CAM started on port 80");
}

void loop() {
  // Jalankan listener Web Server
  server.handleClient();

  // Pengiriman berkala tetap berjalan
  unsigned long currentMillis = millis();
  if (currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;
    if (WiFi.status() == WL_CONNECTED) {
      takeAndSendPicture();
    } else {
      WiFi.reconnect();
    }
  }
}

void takeAndSendPicture() {
  // Nyalakan Flash sesaat sebelum mengambil gambar
  digitalWrite(FLASH_PIN, HIGH);
  delay(300); // Berikan waktu sebentar agar sensor kamera menyesuaikan cahaya
  
  camera_fb_t * fb = esp_camera_fb_get();
  
  // Matikan Flash segera setelah gambar diambil
  digitalWrite(FLASH_PIN, LOW);
  if(!fb) {
    Serial.println("Camera capture failed");
    return;
  }
  
  Serial.println("\nPicture taken! Connecting to server...");
  
  WiFiClient client;
  if (!client.connect(serverName, serverPort)) {
    Serial.println("Connection to server failed");
    esp_camera_fb_return(fb);
    return;
  }

  Serial.println("Connected to server, uploading image...");
  
  // Format multipart/form-data
  String head = "--SmartBinBoundary\r\nContent-Disposition: form-data; name=\"file\"; filename=\"esp32-cam.jpg\"\r\nContent-Type: image/jpeg\r\n\r\n";
  String tail = "\r\n--SmartBinBoundary--\r\n";

  uint32_t imageLen = fb->len;
  uint32_t totalLen = head.length() + imageLen + tail.length();

  // Send HTTP POST request
  client.println("POST " + serverPath + " HTTP/1.1");
  client.println("Host: " + String(serverName));
  client.println("Content-Length: " + String(totalLen));
  client.println("Content-Type: multipart/form-data; boundary=SmartBinBoundary");
  client.println();
  client.print(head);

  // Send image chunks
  uint8_t *fbBuf = fb->buf;
  size_t fbLen = fb->len;
  for (size_t n=0; n<fbLen; n=n+1024) {
    if (n+1024 < fbLen) {
      client.write(fbBuf, 1024);
      fbBuf += 1024;
    } else if (fbLen%1024>0) {
      size_t remainder = fbLen%1024;
      client.write(fbBuf, remainder);
    }
  }
  client.print(tail);

  // Read response
  Serial.println("Waiting for response...");
  long startTimer = millis();
  boolean state = false;
  
  while ((startTimer + 15000) > millis()) {
    while (client.available()) {
      char c = client.read();
      Serial.print(c); // Print response to Serial Monitor
    }
  }
  
  Serial.println("\nUpload finished!");
  
  client.stop();
  esp_camera_fb_return(fb); // Clear memory
}