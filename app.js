const UART_SERVICE = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const RX_CHAR = '6e400003-b5a3-f393-e0a9-e50e24dcca9e'; // Web ➝ micro:bit (write)
const TX_CHAR = '6e400002-b5a3-f393-e0a9-e50e24dcca9e'; // micro:bit ➝ Web (notify)

let device, server, uartService, txChar, rxChar;

const statusEl = document.getElementById('status');
const connectBtn = document.getElementById('connectBtn');
const sendA = document.getElementById('sendA');
const sendB = document.getElementById('sendB');
const sendC = document.getElementById('sendC');
const receivedData = document.getElementById('receivedData');
const debugInfo = document.getElementById('debugInfo');

function log(msg) {
  console.log(msg);
  debugInfo.innerHTML += msg + '<br>';
  debugInfo.scrollTop = debugInfo.scrollHeight;
}

function setStatus(connected) {
  if (connected) {
    statusEl.textContent = 'Verbunden';
    statusEl.className = 'connected';
    connectBtn.textContent = 'Trennen';
  } else {
    statusEl.textContent = 'Nicht verbunden';
    statusEl.className = 'disconnected';
    connectBtn.textContent = 'Mit Micro:bit verbinden';
  }
  sendA.disabled = sendB.disabled = sendC.disabled = !connected;
}

async function connect() {
  try {
    log('Bluetooth-Verbindung wird aufgebaut...');
    device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [UART_SERVICE]
    });

    device.addEventListener('gattserverdisconnected', onDisconnect);
    server = await device.gatt.connect();

    uartService = await server.getPrimaryService(UART_SERVICE);
    rxChar = await uartService.getCharacteristic(RX_CHAR); // zum micro:bit senden
    txChar = await uartService.getCharacteristic(TX_CHAR); // vom micro:bit empfangen

    await txChar.startNotifications();
    txChar.addEventListener('characteristicvaluechanged', handleIncomingData);

    setStatus(true);
    log(`Verbunden mit ${device.name}`);
  } catch (err) {
    log('Verbindungsfehler: ' + err.message);
    alert('Verbindung fehlgeschlagen: ' + err.message);
    setStatus(false);
  }
}

function disconnect() {
  if (device && device.gatt.connected) {
    log('Verbindung wird getrennt...');
    device.gatt.disconnect();
  }
}

function onDisconnect() {
  log('Verbindung getrennt.');
  setStatus(false);
}

async function sendValue(val) {
  if (!rxChar) return;
  try {
    log('Sende: ' + val);
    const encoder = new TextEncoder();
    const data = encoder.encode(val + '\r\n');
    await rxChar.writeValue(data);
    log('Gesendet: ' + val);
  } catch (e) {
    log('Fehler beim Senden: ' + e.message);
  }
}

function handleIncomingData(event) {
  const decoder = new TextDecoder('utf-8');
  const data = decoder.decode(event.target.value);
  log('Empfangen: ' + data.trim());
  receivedData.textContent = data.trim();
}

connectBtn.addEventListener('click', () => {
  if (device && device.gatt.connected) {
    disconnect();
  } else {
    connect();
  }
});

sendA.addEventListener('click', () => sendValue('A'));
sendB.addEventListener('click', () => sendValue('B'));
sendC.addEventListener('click', () => sendValue('C'));

setStatus(false);
log('micro:bit Web Bluetooth UART gestartet');
