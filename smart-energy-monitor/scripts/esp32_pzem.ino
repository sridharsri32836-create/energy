/* 
  Smart Energy Monitor - ESP32 PZEM-004T Mode
  Use this code if you HAVE a PZEM-004T sensor.
  Requires library: PZEM004Tv30
*/

#include <PZEM004Tv30.h>

// Connect PZEM TX to ESP32 RX (GPIO16)
// Connect PZEM RX to ESP32 TX (GPIO17)
#define PZEM_RX_PIN 16
#define PZEM_TX_PIN 17

PZEM004Tv30 pzem(Serial2, PZEM_RX_PIN, PZEM_TX_PIN);

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("PZEM-004T Energy Monitor Initializing...");
}

void loop() {
  float voltage = pzem.voltage();
  float current = pzem.current();
  float power = pzem.power();
  float energy = pzem.energy();

  if (isnan(voltage)) {
    Serial.println("Error reading sensor");
  } else {
    // FORMAT REQUIRED BY WEBSITE:
    Serial.print("Voltage: ");
    Serial.println(voltage);
    
    Serial.print("Current: ");
    Serial.println(current);
    
    Serial.print("Power: ");
    Serial.println(power);
    
    Serial.print("Energy: ");
    Serial.println(energy, 4);
    
    Serial.println("---"); // Block terminator
  }

  delay(1000); // Send data every second
}
