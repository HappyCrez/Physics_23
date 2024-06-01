const AngleOffset = 0.7;

const patrons = [];

const length = document.getElementById('length');

const battery_eds = 7.2734375, std_eds = 1.6, eds1 = 1.2, eds2 = 3.851, eds3 = 2.119;
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

const turnBtn = document.getElementById('turnBtn');
let isTurnOn = false;

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

    // Arrow
    galvanometerCtx.moveTo(GALVANOMETER_WIDTH/2, GALVANOMETER_HEIGHT);
    galvanometerCtx.lineTo(GALVANOMETER_WIDTH/2-GALVANOMETER_WIDTH/2*Math.sin(angleRads), GALVANOMETER_HEIGHT-GALVANOMETER_HEIGHT*Math.cos(angleRads) + 20);
    
    // Nums and lines on galvanometer face
    for (let x = 20; x < GALVANOMETER_WIDTH; x += 20) {
        if (x == GALVANOMETER_WIDTH/2) galvanometerCtx.fillText(Math.abs(x-GALVANOMETER_WIDTH/2)/100, x-3, 20);
        else galvanometerCtx.fillText(Math.abs(x-GALVANOMETER_WIDTH/2)/100, x-5, 20);
        galvanometerCtx.moveTo(x, 30);
        galvanometerCtx.lineTo(x, 40);
    }
    galvanometerCtx.stroke();
    galvanometerCtx.fillText("K = 1.5", GALVANOMETER_WIDTH/2+20, GALVANOMETER_HEIGHT-10);
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

// galvanometer
const line = document.getElementById('line');

function calculateAngle(angle) {
    if (angle > Math.PI/2-AngleOffset) angle = Math.PI/2-AngleOffset;
    if (angle < -Math.PI/2+AngleOffset) angle = -Math.PI/2+AngleOffset;
    return angle;
}

// recalculate volts and ampers on every changed parametr 
function calculate() {    
    let resistAB = calculateWireResist(wireAB);
    let resistBC = calculateWireResist(1-wireAB);
    let ampers = isTurnOn ? calcuteAmpers(resistAB, resistBC, battery_eds) : 0;
    let angle = calculateAngle(ampers);
    console.log(ampers);
    updateWireLen(wireAB);
    updateLinear();
    updateGalvanometer(angle);
}

// TODO::Animate arrow
// let lastTime = new Date().getTime(); 
// function animateArrow() {
//     window.requestAnimationFrame(animateArrow);
//     let dt = new Date().getTime() - lastTime;
//     lastTime = new Date().getTime();
    
//     console.log(dt);
// }
// animateArrow();