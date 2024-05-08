// send one byte from arduino to P5 with webSerial

/*  
// Arduino Code 
void setup() {
  Serial.begin(9600);
}

void loop() {
  int analogValue = analogRead(A0);
  byte byteToSend = map (analogValue, 0, 1023, 0, 255);
  Serial.write(byteToSend);
  delay(50);
}
*/

const serial = new p5.WebSerial();
let startButton;
let portButton;
let closeButton;
let sensorValue = 0;
let width = 900;
let height = 506;
let arrowSpeed = 5; // Speed at which arrow moves
let arrowDirection = 1;
let score = 0;
let shooting = false; // Indicates whether the arrow is currently being shot
let arrowX = width / 2; // X-coordinate of the arrow
let arrowY = height; // Y-coordinate of the arrow
let arrowScaleX = 1;
let arrowScaleY = 1;
let arrowWidth = 60;
let arrowHeight = 120;
let targetX = width / 2;
let targetY = height / 2;
let targetRadius = 100;

let started = false;

let bgImg;
let arrowImg;
let targetImg;
let sliderX = width - 50;
let sliderY = height / 2;
let lastScore = 0;
let textOpacity = 0;
let sliderHeight = 0;
let startShootFlag = 0;
let sliderIncrementor = 1;
let sliderTotalHeight = 100;
let startShootThreshHold = 40; //set flex sensor value at which we start for targetting

function allSerialStuff() {
  if (!navigator.serial) {
    alert("WebSerial is not supported in this browser. Try Chrome or MS Edge.");
  }
  // check for any ports that are available:
  serial.getPorts();
  // if there's no port chosen, choose one:
  serial.on("noport", makePortButton);
  // open whatever port is available:
  serial.on("portavailable", openPort);
  // handle serial errors:
  serial.on("requesterror", portError);
  // handle any incoming serial data:
  serial.on("data", serialEvent);
  serial.on("close", portClosed);
  // add serial connect/disconnect listeners:
  navigator.serial.addEventListener("connect", portConnect);
  navigator.serial.addEventListener("disconnect", portDisconnect);
}

function serialEvent() {
  sensorValue = Number(serial.read());
  console.log(sensorValue);
  //if certain value from flex sensor get passed we get prepared for the shoot
  if (!shooting && sensorValue > startShootThreshHold) {
    startShootFlag = 1;
    sliderHeight = sensorValue + 20; // add 20 to elevate the value we need something in between 0-120
  }
  //if that value again crossed then we shoot
  if (!shooting && sensorValue < startShootThreshHold && startShootFlag) {
    startShootFlag = 0;
    if (!shooting && arrowY == height) {
      shooting = true; // Start shooting
    }
  }
}

// if there's no port selected,
// make a port select button appear:
function makePortButton() {
  // create and position a port chooser button:
  portButton = createButton("Choose Port");
  portButton.position(innerWidth / 2, 10);
  portButton.center("horizontal");
  // give the port button a mousepressed handler:
  portButton.mousePressed(choosePort);
}

// make the port selector window appear:
function choosePort() {
  if (portButton) portButton.show();
  serial.requestPort();
}

// open the selected port, and make the port
// button invisible:
// open the selected port, and make the port
// button invisible:
function openPort() {
  // wait for the serial.open promise to return,
  // then call the initiateSerial function
  serial.open().then(initiateSerial).catch(console.log);

  // once the port opens, let the user know:
  function initiateSerial() {
    console.log("port open");
  }
  // hide the port button once a port is chosen:
  if (!closeButton) makeCloseButton();
  if (portButton) portButton.hide();
  if (closeButton) closeButton.show();
}

function portClosed() {
  if (!portButton) makePortButton();
  if (portButton) portButton.show();
}

// pop up an alert if there's a port error:
function portError(err) {
  alert("Serial port error: " + err);
}
// read any incoming data as a string
// (assumes a newline at the end of it):

// try to connect if a new serial port
// gets added (i.e. plugged in via USB):
function portConnect() {
  console.log("port connected");
  serial.getPorts();
}

// if a port is disconnected:
function portDisconnect() {
  serial.close();
  console.log("port disconnected");
}

// if there's no port selected,
// make a port select button appear:
function makeCloseButton() {
  // create and position a port chooser button:
  closeButton = createButton("Close Port");
  closeButton.position(innerWidth / 2, 10);
  closeButton.center("horizontal");
  // give the close port button a mousepressed handler:
  closeButton.mousePressed(closePort);
}

function closePort() {
  serial.close();
  if (!portButton) makePortButton();
  if (portButton) portButton.show();
  if (closeButton) closeButton.hide();
}

function preload() {
  bgImg = loadImage("/assets/background.jpg");
  targetImg = loadImage("/assets/target.png");
  arrowImg = loadImage("/assets/arrow.png");
}

function setup() {
  createCanvas(width, height);

  startButton = createButton("Start Game");
  startButton.addClass("start-button");
  startButton.position(innerWidth / 2, innerHeight / 2 + 10);
  startButton.center("horizontal");
  startButton.mousePressed(startGame);

  allSerialStuff();
}

function draw() {
  imageMode(CORNERS);
  image(bgImg, 0, 0, width, height);

  if (!started) {
    drawMenu();
  } else {
    // Draw target
    drawTarget();

    if (startShootFlag) {
      drawSlider();
    }

    //Draw score
    textAlign(LEFT, TOP);
    textSize(26);
    fill("red");

    text("Score: " + score, 10, 10);

    makeShooting();
    drawArrow();
    drawAddedScore();
  }
}

function drawMenu() {
  textSize(48);
  fill("#ff0033");
  textStyle(BOLD);
  textAlign(CENTER, BASELINE);
  text("VR Archery", width / 2, height / 2 - 100);
}

function startGame() {
  if (startButton) startButton.hide();
  started = true;
}

function makeShooting() {
  if (shooting) {
    // Calculate the trajectory towards the target
    let deltaY = height - targetY; // Difference in y-coordinates between arrow and target
    arrowY -= deltaY / 50; // Move the arrow towards the target
    if (arrowScaleY > 0.4) {
      arrowScaleY -= 0.004;
    }
    if (arrowScaleX > 0.4) {
      arrowScaleY -= 0.005;
    }
    // Stop shooting when arrow reaches the target
    if (arrowY - (arrowHeight * arrowScaleY) / 2 <= targetY) {
      shooting = false;

      // Check if the arrow hits the target
      let distance = dist(arrowX, arrowY - (arrowHeight * arrowScaleY) / 2, targetX, targetY); // Calculate distance between arrow tip and target center
      if (distance <= targetRadius - 20) {
        console.log("Hit!");
        arrowSpeed = 0;
        textOpacity = 255;
        updateScore(distance);
        //reset arrow after 2 seconds
        setTimeout(() => {
          arrowY = height;
          arrowScaleX = 1;
          arrowScaleY = 1;
          arrowSpeed = 5;
          textOpacity = 0;
        }, 2000);
      } else {
        console.log("Miss!");
        arrowY = height;
        arrowScaleX = 1;
        arrowScaleY = 1;
        shooting = false;
      }
    }
  } else {
    // Move arrow
    arrowX += arrowSpeed * arrowDirection;
    if (arrowX >= width || arrowX <= 0) {
      arrowDirection = -arrowDirection; // Reset arrow when it goes beyond the canvas
    }
  }
}

function drawTarget() {
  imageMode(CENTER);
  image(targetImg, targetX, targetY, targetRadius * 2, targetRadius * 2);
}

function drawArrow() {
  imageMode(CENTER);
  image(arrowImg, arrowX, arrowY, arrowWidth * arrowScaleX, arrowHeight * arrowScaleY);
}

function drawAddedScore() {
  fill(80, textOpacity);
  text("+ " + lastScore, targetX + 70, targetY - 60);
}

function drawSlider() {
  line(sliderX, sliderY, sliderX, sliderY + 120);
  line(sliderX - 10, sliderY, sliderX + 10, sliderY);
  line(sliderX - 10, sliderY + 60, sliderX + 10, sliderY + 60);
  line(sliderX - 10, sliderY + 120, sliderX + 10, sliderY + 120);
  fill(sliderHeight + 100, 200, 0);
  rect(sliderX - 10, sliderY, 20, sliderHeight);
}

//update score
function updateScore(distance) {
  console.log(distance);
  if (distance < 10) {
    score += 100;
    lastScore = 100;
  } else if (distance < 25) {
    score += 80;
    lastScore = 80;
  } else if (distance < 40) {
    score += 60;
    lastScore = 60;
  } else if (distance < 55) {
    score += 40;
    lastScore = 40;
  } else {
    score += 20;
    lastScore = 20;
  }
}

//handle mouse click event
// function mouseClicked() {
//   if (!shooting && arrowY == height) {
//     //If arrow is not currently being shot
//     shooting = true; // Start shooting
//   }
// }

function windowResized() {
  if (startButton) startButton.position(innerWidth / 2, innerHeight / 2 + 10).center("horizontal");
  if (portButton) portButton.center("horizontal");
  if (closeButton) closeButton.center("horizontal");
}
