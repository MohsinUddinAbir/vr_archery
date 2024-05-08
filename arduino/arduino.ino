int sensorPin = A0;   // select the input pin for the flex sensor
int sensorValue = 0;  // variable to store the value coming from the sensor

void setup() {
 // Start serial communication with a baud rate of 9600
  Serial.begin(9600);
}

void loop() {
  // read the value from the sensor:
  sensorValue = analogRead(sensorPin);
  int mappedValue = map(sensorValue, 0, 1023, 0, 100);
  
  // Print the mapped value to the serial port
  Serial.println(mappedValue);

  // Add a short delay to avoid flooding the serial port
  delay(500);
}
