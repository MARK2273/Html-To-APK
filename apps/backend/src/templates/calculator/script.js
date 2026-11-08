let displayVal = '0';

function update() {
  document.getElementById('display').innerText = displayVal;
}

function appendNum(n) {
  if (navigator.vibrate) navigator.vibrate(15);
  displayVal = displayVal === '0' ? n : displayVal + n;
  update();
}

function appendOp(op) {
  if (navigator.vibrate) navigator.vibrate(20);
  displayVal += ' ' + op + ' ';
  update();
}

function clearDisplay() {
  if (navigator.vibrate) navigator.vibrate(25);
  displayVal = '0';
  update();
}

function deleteLast() {
  if (navigator.vibrate) navigator.vibrate(15);
  displayVal = displayVal.trim();
  displayVal = displayVal.slice(0, -1).trim() || '0';
  update();
}

function calculate() {
  if (navigator.vibrate) navigator.vibrate(35);
  try {
    const sanitized = displayVal.replace(/×/g, '*').replace(/÷/g, '/');
    displayVal = String(Function('"use strict";return (' + sanitized + ')')());
  } catch (e) {
    displayVal = 'Error';
  }
  update();
}

