const length = document.getElementById('length');

const battery_eds = 7.2734375, std_eds = 2.1, eds1 = 1.2, eds2 = 3.851, eds3 = 2.119;
const edsVals = [std_eds, eds1, eds2, eds3];
const edsBtns = [];
let currEds = std_eds;

const wire_resistivity = 1.12, wire_S = 0.075;      // both in 10^(-6)
const wire_resDivedS = wire_resistivity / wire_S;   // it's divide, so extent doesn't matter
const WIRE_OFFSET = 0.05;
let wireAB = WIRE_OFFSET;

const linear = document.getElementById('linear');
const linearCtx = linear.getContext('2d');

const LINEAR_WIDTH = 400;
const LINEAR_HEIGHT = 30;
const THUMB_WIDTH = 35;

const RIGHT_THUMB_BOUND = LINEAR_WIDTH - LINEAR_HEIGHT;
let isClicked = false;
let clickPointX = 0, clickPointY = 0;
let dx, x = 0;

const galvanometer = document.getElementById('galvanometer');
const galvanometerCtx = galvanometer.getContext('2d');

const GALVANOMETER_WIDTH = 200;
const GALVANOMETER_HEIGHT = 100;
const CENTER_X = GALVANOMETER_WIDTH/2;
    
const turnBtn = document.getElementById('turnBtn');
let isTurnOn = false;

const ANGLE_OFFSET = 0.265;
let arrowAngle = 0;
let currentArrowAngle = arrowAngle;
let currentSpeed = 0;
let maxSpeed = 0.01;
let acceleration = 0;

function setup() {
    linear.width = LINEAR_WIDTH;
    linear.height = LINEAR_HEIGHT;

    galvanometer.width = GALVANOMETER_WIDTH;
    galvanometer.height = GALVANOMETER_HEIGHT;
 
   edsBtns.push(document.getElementById('std_eds'));
    edsBtns.push(document.getElementById('eds1'));
    edsBtns.push(document.getElementById('eds2'));
    edsBtns.push(document.getElementById('eds3'));
    edsBtns.forEach((eds, idx) =>{
        eds.addEventListener("mouseup", (event)=> {
            currEds = edsVals[idx];
            calculate();
        });
    });

    calculate();
    updateGalvanometer(0);
}
setup();

turnBtn.addEventListener('click', (event) => {
    if (isTurnOn) turnOn();
    else turnOff();
    calculate();
});

function turnOn() {
    isTurnOn = false;
    turnBtn.innerHTML = 'Включить';
    turnBtn.classList.remove('btn-danger');
    turnBtn.classList.add('btn-success');
}

function turnOff() {
    isTurnOn = true;
    turnBtn.innerHTML = 'Выключить';
    turnBtn.classList.add('btn-danger');
    turnBtn.classList.remove('btn-success');
}

function calcuteVolts(ampers, wireResist) {
    return ampers * wireResist;
}

function calcuteAmpers(resistAB, resistBC, batteryEds) {
    let ampers = currEds/resistAB+currEds/resistBC-batteryEds/resistBC; 
    return (Math.abs(ampers) > 0.04)? ampers : 0;
}

function calculateWireResist(wireLen) {
    return wireLen * wire_resDivedS;
}

function updateWireLen(len) {
    length.innerHTML = len + ' м';
}

function updateGalvanometer(angleRads) {
    galvanometerCtx.beginPath();
    galvanometerCtx.fillStyle = "white";
    galvanometerCtx.rect(0, 0, GALVANOMETER_WIDTH, GALVANOMETER_HEIGHT);
    galvanometerCtx.fill();
    galvanometerCtx.closePath();
    
    galvanometerCtx.beginPath();
    galvanometerCtx.fillStyle = "black";
    // Bottom line
    galvanometerCtx.rect(1, 1, GALVANOMETER_WIDTH-1, GALVANOMETER_HEIGHT-1);
    
    // Galvanometer arrow
    const ARROW_LEN = 65;

    let arrowCoef = 1/Math.tan(Math.abs(angleRads));
    let arrowX = Math.sqrt((ARROW_LEN*ARROW_LEN)/(1+arrowCoef*arrowCoef));
    let arrowY = arrowX*arrowCoef;

    if (angleRads == 0) {
	arrowX = 0;
	arrowY = ARROW_LEN;
	sight = 0;
    }
    else if (angleRads > 0) sight = 1;
    else sight = -1;
    
    galvanometerCtx.moveTo(CENTER_X, GALVANOMETER_HEIGHT);
    galvanometerCtx.lineTo(CENTER_X+arrowX*sight, GALVANOMETER_HEIGHT-arrowY);

    const DASH_COUNT = 6
    // Nums and lines on galvanometer face
    // Center dash with '0' num
    galvanometerCtx.moveTo(CENTER_X,20);
    galvanometerCtx.lineTo(CENTER_X,30);
    galvanometerCtx.fillText('0',CENTER_X-3,16);

    // Another dashes
    for (let i = 1; i < DASH_COUNT; i++) {
	// calculate Position of every dash in galvnometer "-"
	const RADIUS_LEN = 70;
	const SUM_LEN = RADIUS_LEN+10;

	let lineCoef = Math.tan(((15*i)*Math.PI)/180);
	let x0 = Math.sqrt((RADIUS_LEN*RADIUS_LEN)/(1+lineCoef*lineCoef));
	let x1 = Math.sqrt((SUM_LEN*SUM_LEN)/(1+lineCoef*lineCoef));

	// Right part of galvanometer
	galvanometerCtx.moveTo(CENTER_X+x0,GALVANOMETER_HEIGHT-lineCoef*x0);
	galvanometerCtx.lineTo(CENTER_X+x1,GALVANOMETER_HEIGHT-lineCoef*x1);
	galvanometerCtx.fillText((DASH_COUNT-i)/5,CENTER_X+x1+2,GALVANOMETER_HEIGHT-lineCoef*x1-4);
	
	// Left part of galvanometer
	galvanometerCtx.moveTo(CENTER_X-x0,GALVANOMETER_HEIGHT-lineCoef*x0);
	galvanometerCtx.lineTo(CENTER_X-x1,GALVANOMETER_HEIGHT-lineCoef*x1);
	galvanometerCtx.fillText((DASH_COUNT-i)/5,CENTER_X-x1-15,GALVANOMETER_HEIGHT-lineCoef*x1-4);
    }
    galvanometerCtx.stroke();
    galvanometerCtx.fillText("K = 1.5", CENTER_X+20, GALVANOMETER_HEIGHT-10);
    galvanometerCtx.closePath();

    galvanometerCtx.beginPath();
    galvanometerCtx.arc(GALVANOMETER_WIDTH/2, GALVANOMETER_HEIGHT, 10, Math.PI, 0);
    galvanometerCtx.fill();
    galvanometerCtx.closePath();
}

function updateLinear() {
    // clear rectangle
    linearCtx.beginPath();
    linearCtx.fillStyle = "#FFFFFF";
    linearCtx.rect(0, 0, LINEAR_WIDTH, LINEAR_HEIGHT);
    linearCtx.fill();
    linearCtx.closePath();
    
    // thumb move
    linearCtx.beginPath();
    linearCtx.fillStyle = "#000000";
    for (let i = 5; i <= 100; i += 5)
        linearCtx.fillText(i.toString(), i*LINEAR_WIDTH/105, LINEAR_HEIGHT / 2 + 5);
    linearCtx.rect(x, 0, THUMB_WIDTH, LINEAR_HEIGHT);
    linearCtx.fill();

    // Up and down bounds 
    linearCtx.moveTo(0, 0);
    linearCtx.lineTo(LINEAR_WIDTH, 0);
    linearCtx.moveTo(0, LINEAR_HEIGHT);
    linearCtx.lineTo(LINEAR_WIDTH, LINEAR_HEIGHT);
    linearCtx.stroke();
    linearCtx.closePath();
}

linear.onmousedown = function (event) {
    isClicked = true;
    clickPointX = event.clientX;
    clickPointY = event.clientY;
}

document.onmousemove = function (event) {
    if (!isClicked) return;
    x = (event.pageX - linear.offsetLeft - THUMB_WIDTH/2);

    // check bounds 
    if (x < 0) x = 0;
    if (x > RIGHT_THUMB_BOUND) x = RIGHT_THUMB_BOUND; 
    wireAB = (x/LINEAR_WIDTH + WIRE_OFFSET).toFixed(2);
    calculate();
}

document.onmouseup = function(event) {
    if (!isClicked) return;
    isClicked = false;
}

function calculateAngle(ampers) {
    arrowAngle = verifyArrowBound(ampers*1.3);
}

function verifyArrowBound(angle) {   
    if (angle > Math.PI/2-ANGLE_OFFSET ) angle = Math.PI/2-ANGLE_OFFSET;
    if (angle < -Math.PI/2+ANGLE_OFFSET) angle = -Math.PI/2+ANGLE_OFFSET;
    return angle;
}

// recalculate volts and ampers on every changed parametr 
function calculate() {    
    let resistAB = calculateWireResist(wireAB);
    let resistBC = calculateWireResist(1-wireAB);
    let ampers = isTurnOn ? calcuteAmpers(resistAB, resistBC, battery_eds) : 0;

    calculateAngle(ampers);
    calculateAcceleration();
    
    updateWireLen(wireAB);
    updateLinear();
}

function calculateAcceleration() {
    if (!isTurnOn) return;
    acceleration = Math.abs(1-arrowAngle+currentArrowAngle);
}    

// Arrow animation
let lastTime = new Date().getTime();
let angelIsBigger = true;
function animateArrow() {
    window.requestAnimationFrame(animateArrow);
    let dt = new Date().getTime() - lastTime;
    lastTime = new Date().getTime();

    if (currentArrowAngle<arrowAngle) {
	if (angelIsBigger == true) {
	    acceleration *= 2;
	    angelIsBigger = false;
	}
	currentSpeed += dt/100000*acceleration;
	if (currentSpeed>maxSpeed) currentSpeed = maxSpeed;
    }
    else if (currentArrowAngle>arrowAngle) {
	if (angelIsBigger == false) {
	    acceleration *= 2;
	    angelIsBigger = true;
	}
	currentSpeed -= dt/100000*acceleration;
	if (currentSpeed<-maxSpeed) currentSpeed = -maxSpeed;
    }
    
    currentArrowAngle += currentSpeed;
    currentArrowAngle = verifyArrowBound(currentArrowAngle);
    updateGalvanometer(currentArrowAngle);
}
animateArrow();
