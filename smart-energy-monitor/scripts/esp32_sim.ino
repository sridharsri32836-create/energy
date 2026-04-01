/* 
  Smart Energy Monitor - ESP32 Simulation Mode
  Use this code if you DON'T have a sensor connected yet.
  It sends random but realistic energy data to the website.
*/

float voltage = 230.0;
float current = 0.0;
float power = 0.0;
float totalEnergy = 0.0;

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("Energy Monitor Simulation Started");
}

void loop() {
  // Simulate some fluctuations
  voltage = 230.0 + random(-20, 20) / 10.0;
  current = random(10, 500) / 100.0; // 0.1A to 5.0A
  power = voltage * current;
  totalEnergy += (power / 3600.0) / 1000.0; // Add Wh converted to kWh (sampled every 1s)

  // FORMAT REQUIRED BY WEBSITE:
  Serial.print("Voltage: ");
  Serial.println(voltage);
  
  Serial.print("Current: ");
  Serial.println(current);
  
  Serial.print("Power: ");
  Serial.println(power);
  
  Serial.print("Energy: ");
  Serial.println(totalEnergy, 4);
  
  Serial.println("---"); // Block terminator

  delay(1000); // Send data every second
}
