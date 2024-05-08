const angleStep = 360 / 10;

const patrons = [];

const length = document.getElementById('length');

const battery_volts = 1.6, battery_ampers = 0.250, circuit_resistance = 0.1;
const wire_resistivity = 1.12, wire_S = 0.075;      // both in 10^(-6)
const wire_resDivedS = wire_resistivity / wire_S;   // it's devide, so extent doesn't matter
let wire_len = 0;

const turnBtn = document.getElementById('turnBtn');

let isTurnOn = false;
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

function calcuteVolts(ampers, wire_resist) {
    return ampers * wire_resist;
}

function calcuteAmpers(wire_resist) {
    let ampers = battery_volts / (wire_resist + circuit_resistance);
    if (ampers > battery_ampers) ampers = battery_ampers; 
    return ampers > 0 ? ampers : 0 ;
}

function calculateWireResist(wire_len) {
    return wire_len * wire_resDivedS;
}

function updateWireLen(val) {
    length.innerHTML = val + ' м';
}

// scroll bar - linear to change wire_len
const track = document.getElementById('track');
const thumb = document.getElementById('thumb');
const rightThumbBound = track.offsetWidth - thumb.offsetWidth;
const linearStep = track.offsetWidth;
let isClicked = false;
let clickPointX = 0, clickPointY = 0;
let dx;

thumb.onmousedown = function (event) {
    isClicked = true;
    clickPointX = event.clientX;
    clickPointY = event.clientY;
}

document.onmousemove = function (event) {
    if (!isClicked) return;
    let x = (event.pageX - track.offsetLeft);

    
    // check bounds 
    if (x < 0) x = 0;
    if (x > rightThumbBound) x = rightThumbBound; 
    wire_len = (x/linearStep).toFixed(2);
    calculate();
    
    thumb.style = 'left: ' + x + "px"; 
}

document.onmouseup = function(event) {
    if (!isClicked) return;
    isClicked = false;
}

// galvanometer
const line = document.getElementById('line');
let angle = 0;

function calculateAngle(val) {
    return val * 360; // TODO::physic place - calculate angle
} 

function animateArrow() {
    window.requestAnimationFrame(animateArrow);
    angle = calculateAngle(wire_len);
    line.style.rotate = angle + 'deg';
}
animateArrow();

// recalculate volts and ampers on every changed parametr 
function calculate() {
    // let wire_resist = calculateWireResist(wire_len);
    // let ampers = isTurnOn ? calcuteAmpers(wire_resist) : 0;
    // let volts  = isTurnOn ? calcuteVolts(ampers, wire_resist) : 0;

    updateWireLen(wire_len)
}
calculate();