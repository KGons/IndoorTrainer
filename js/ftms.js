// ftms.js - Standard Bluetooth Fitness Machine Service (FTMS) Driver
// Compatible with Elite Direto X-RT and all FTMS-compliant smart trainers

export const FTMS_UUIDS = {
  // Services
  FITNESS_MACHINE_SERVICE: 0x1826,
  CYCLING_POWER_SERVICE: 0x1818,
  CYCLING_SPEED_CADENCE_SERVICE: 0x1816,
  DEVICE_INFORMATION_SERVICE: 0x180A,

  // FTMS Characteristics
  FITNESS_MACHINE_FEATURE: 0x2ACC,
  INDOOR_BIKE_DATA: 0x2AD2,
  TRAINING_STATUS: 0x2AD3,
  FITNESS_MACHINE_CONTROL_POINT: 0x2AD9,
  FITNESS_MACHINE_STATUS: 0x2ADA,

  // Device Info Characteristics
  MANUFACTURER_NAME: 0x2A29,
  MODEL_NUMBER: 0x2A24,
  FIRMWARE_REVISION: 0x2A26
};

// FTMS Control Point OpCodes
export const FTMS_OPCODE = {
  REQUEST_CONTROL: 0x00,
  RESET: 0x01,
  SET_TARGET_RESISTANCE: 0x04,
  SET_TARGET_POWER: 0x05,
  START_OR_RESUME: 0x07,
  STOP_OR_PAUSE: 0x08,
  SET_SIMULATION_PARAMETERS: 0x11,
  RESPONSE_CODE: 0x80
};

// Response Result Codes
export const FTMS_RESULT_CODE = {
  0x01: 'Success',
  0x02: 'OpCode not supported',
  0x03: 'Invalid parameter',
  0x04: 'Operation failed',
  0x05: 'Control not permitted'
};

export class FTMSClient extends EventTarget {
  constructor() {
    super();
    this.device = null;
    this.server = null;
    this.ftmsService = null;
    this.controlPointChar = null;
    this.indoorBikeDataChar = null;
    this.statusChar = null;

    this.hasControl = false;
    this.isConnected = false;
    this.lastTargetWatts = null;
  }

  log(message, type = 'info') {
    this.dispatchEvent(new CustomEvent('log', { detail: { message, type } }));
  }

  async connect() {
    if (!navigator.bluetooth) {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      if (isIOS) {
        throw new Error('Apple Safari blocks Web Bluetooth. Please open this app in the free "Bluefy" browser from the App Store to connect to your smart trainer.');
      }
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        throw new Error('Web Bluetooth requires HTTPS or an installed PWA. Please open via HTTPS (or install as PWA). Also make sure Bluetooth and Location are enabled on Android.');
      }
      throw new Error('Web Bluetooth is not supported in this browser. Please use Google Chrome, Edge, or Samsung Internet on Android.');
    }

    this.log('Scanning for FTMS-compatible trainers...');

    try {
      this.device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [FTMS_UUIDS.FITNESS_MACHINE_SERVICE] }],
        optionalServices: [
          FTMS_UUIDS.FITNESS_MACHINE_SERVICE,
          FTMS_UUIDS.CYCLING_POWER_SERVICE,
          FTMS_UUIDS.CYCLING_SPEED_CADENCE_SERVICE,
          FTMS_UUIDS.DEVICE_INFORMATION_SERVICE
        ]
      });
    } catch (err) {
      if (err.name === 'NotFoundError') {
        throw new Error('No device selected or Bluetooth scan was cancelled.');
      }
      throw err;
    }

    this.device.addEventListener('gattserverdisconnected', () => {
      this.isConnected = false;
      this.hasControl = false;
      this.log('Trainer disconnected.', 'warn');
      this.dispatchEvent(new CustomEvent('disconnected'));
    });

    this.log(`Connecting to GATT Server on "${this.device.name || 'Trainer'}"...`);
    this.server = await this.device.gatt.connect();
    this.isConnected = true;
    this.log('Connected to GATT Server.');

    // Small delay to allow GATT discovery to stabilize on Direto
    await new Promise(r => setTimeout(r, 300));

    const withTimeout = (promise, ms, desc) => Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error(`${desc} timed out after ${ms/1000}s`)), ms))
    ]);

    // Setup FTMS sequentially (no concurrent GATT calls)
    this.log('Discovering Fitness Machine Service (0x1826)...');
    try {
      this.ftmsService = await withTimeout(
        this.server.getPrimaryService(FTMS_UUIDS.FITNESS_MACHINE_SERVICE),
        5000,
        'FTMS Service (0x1826)'
      );
      this.log('Fitness Machine Service (0x1826) discovered.');

      // Setup Indoor Bike Data stream
      await this._setupIndoorBikeData(withTimeout);

      // Setup Control Point
      await this._setupControlPoint(withTimeout);

      // Setup Machine Status notifications
      await this._setupMachineStatus(withTimeout);

      // Request Control Handshake
      try {
        await withTimeout(this.requestControl(), 2000, 'Request Control');
      } catch (err) {
        this.log(`Request Control notice: ${err.message}`, 'warn');
      }

      // Start / Resume workout session
      try {
        await withTimeout(this.startOrResume(), 2000, 'Start/Resume');
      } catch (err) {
        this.log(`Start/Resume notice: ${err.message}`, 'warn');
      }
    } catch (err) {
      this.log(`FTMS Service notice: ${err.message}`, 'warn');
    }

    // Setup Cycling Power Service (0x1818) fallback/parallel stream sequentially
    await this._setupCyclingPower(withTimeout);

    this.dispatchEvent(new CustomEvent('connected', { detail: { name: this.device.name } }));
    this.log(`Trainer setup complete! Listening for telemetry on "${this.device.name}".`, 'info');
    return this.device.name;
  }

  async _setupIndoorBikeData(withTimeout) {
    try {
      this.log('Locating Indoor Bike Data characteristic (0x2AD2)...');
      this.indoorBikeDataChar = await withTimeout(
        this.ftmsService.getCharacteristic(FTMS_UUIDS.INDOOR_BIKE_DATA),
        4000,
        'Indoor Bike Data (0x2AD2)'
      );
      
      this.indoorBikeDataChar.addEventListener('characteristicvaluechanged', (event) => {
        this._parseIndoorBikeData(event.target.value);
      });

      await withTimeout(
        this.indoorBikeDataChar.startNotifications(),
        4000,
        'Start notifications (0x2AD2)'
      );
      this.log('Subscribed to Indoor Bike Data (0x2AD2) notifications.');
    } catch (err) {
      this.log(`Indoor Bike Data subscription warning: ${err.message}`, 'warn');
    }
  }

  async _setupControlPoint(withTimeout) {
    try {
      this.log('Locating Control Point characteristic (0x2AD9)...');
      this.controlPointChar = await withTimeout(
        this.ftmsService.getCharacteristic(FTMS_UUIDS.FITNESS_MACHINE_CONTROL_POINT),
        4000,
        'Control Point (0x2AD9)'
      );

      this.controlPointChar.addEventListener('characteristicvaluechanged', (event) => {
        this._handleControlPointIndication(event.target.value);
      });

      try {
        await withTimeout(
          this.controlPointChar.startNotifications(),
          2000,
          'Control Point indications'
        );
        this.log('Subscribed to Control Point indications.');
      } catch (subErr) {
        this.log(`Control Point indications note: ${subErr.message}. Target watts commands will still be sent.`, 'info');
      }
    } catch (err) {
      this.log(`Control Point locating warning: ${err.message}`, 'warn');
    }
  }

  async _setupCyclingPower(withTimeout) {
    try {
      this.log('Checking for Cycling Power Service (0x1818)...');
      const cps = await withTimeout(
        this.server.getPrimaryService(FTMS_UUIDS.CYCLING_POWER_SERVICE),
        3000,
        'CPS (0x1818)'
      );
      const cpm = await withTimeout(
        cps.getCharacteristic(0x2A63),
        3000,
        'CPM (0x2A63)'
      );
      cpm.addEventListener('characteristicvaluechanged', (event) => {
        this._parseCyclingPowerData(event.target.value);
      });
      await withTimeout(
        cpm.startNotifications(),
        3000,
        'Start CPM notifications'
      );
      this.log('Subscribed to Cycling Power Measurement (0x2A63) telemetry.');
    } catch (err) {
      this.log(`Cycling Power Service note: ${err.message || 'not active'}`, 'info');
    }
  }

  // Parse Cycling Power Measurement (0x2A63)
  _parseCyclingPowerData(dataView) {
    if (dataView.byteLength < 4) return;
    const power = dataView.getInt16(2, true);

    const payload = {
      timestamp: Date.now(),
      power: Math.max(0, power)
    };

    this.dispatchEvent(new CustomEvent('telemetry', { detail: payload }));
  }

  async _setupMachineStatus(withTimeout) {
    try {
      this.statusChar = await withTimeout(
        this.ftmsService.getCharacteristic(FTMS_UUIDS.FITNESS_MACHINE_STATUS),
        2000,
        'Fitness Machine Status'
      );
      this.statusChar.addEventListener('characteristicvaluechanged', (event) => {
        const val = event.target.value;
        const opCode = val.getUint8(0);
        this.log(`Fitness Machine Status updated: OpCode 0x${opCode.toString(16)}`);
      });
      await withTimeout(this.statusChar.startNotifications(), 2000, 'Status notifications');
    } catch {
      this.log('Fitness Machine Status characteristic not found (optional).', 'info');
    }
  }

  // Parse FTMS Indoor Bike Data (0x2AD2)
  _parseIndoorBikeData(dataView) {
    if (dataView.byteLength < 2) return;

    const flags = dataView.getUint16(0, true);
    let offset = 2;

    const data = {
      timestamp: Date.now(),
      rawFlags: flags
    };

    const hasMoreData = (flags & (1 << 0)) !== 0;

    // Instantaneous Speed (Present if More Data bit is 0)
    if (!hasMoreData && offset + 2 <= dataView.byteLength) {
      // Resolution: 0.01 km/h
      data.speed = dataView.getUint16(offset, true) / 100;
      offset += 2;
    }

    // Average Speed (bit 1)
    if ((flags & (1 << 1)) !== 0 && offset + 2 <= dataView.byteLength) {
      data.avgSpeed = dataView.getUint16(offset, true) / 100;
      offset += 2;
    }

    // Instantaneous Cadence (bit 2)
    if ((flags & (1 << 2)) !== 0 && offset + 2 <= dataView.byteLength) {
      // Resolution: 0.5 RPM
      data.cadence = dataView.getUint16(offset, true) * 0.5;
      offset += 2;
    }

    // Average Cadence (bit 3)
    if ((flags & (1 << 3)) !== 0 && offset + 2 <= dataView.byteLength) {
      data.avgCadence = dataView.getUint16(offset, true) * 0.5;
      offset += 2;
    }

    // Total Distance (bit 4) - 3 bytes uint24
    if ((flags & (1 << 4)) !== 0 && offset + 3 <= dataView.byteLength) {
      data.totalDistance = dataView.getUint8(offset) |
                           (dataView.getUint8(offset + 1) << 8) |
                           (dataView.getUint8(offset + 2) << 16);
      offset += 3;
    }

    // Resistance Level (bit 5) - sint16
    if ((flags & (1 << 5)) !== 0 && offset + 2 <= dataView.byteLength) {
      data.resistanceLevel = dataView.getInt16(offset, true);
      offset += 2;
    }

    // Instantaneous Power (bit 6) - sint16 (Watts)
    if ((flags & (1 << 6)) !== 0 && offset + 2 <= dataView.byteLength) {
      data.power = dataView.getInt16(offset, true);
      offset += 2;
    }

    // Average Power (bit 7) - sint16
    if ((flags & (1 << 7)) !== 0 && offset + 2 <= dataView.byteLength) {
      data.avgPower = dataView.getInt16(offset, true);
      offset += 2;
    }

    // Expended Energy (bit 8)
    if ((flags & (1 << 8)) !== 0 && offset + 5 <= dataView.byteLength) {
      data.totalEnergyKCal = dataView.getUint16(offset, true);
      data.energyPerHour = dataView.getUint16(offset + 2, true);
      data.energyPerMin = dataView.getUint8(offset + 4);
      offset += 5;
    }

    // Heart Rate (bit 9) - uint8
    if ((flags & (1 << 9)) !== 0 && offset + 1 <= dataView.byteLength) {
      data.heartRate = dataView.getUint8(offset);
      offset += 1;
    }

    // Metabolic Equivalent (bit 10) - uint8 (0.1 resolution)
    if ((flags & (1 << 10)) !== 0 && offset + 1 <= dataView.byteLength) {
      data.metabolicEquivalent = dataView.getUint8(offset) / 10;
      offset += 1;
    }

    // Elapsed Time (bit 11) - uint16 (seconds)
    if ((flags & (1 << 11)) !== 0 && offset + 2 <= dataView.byteLength) {
      data.elapsedSeconds = dataView.getUint16(offset, true);
      offset += 2;
    }

    this.dispatchEvent(new CustomEvent('telemetry', { detail: data }));
  }

  // Handle Control Point Indication responses
  _handleControlPointIndication(dataView) {
    if (dataView.byteLength < 3) return;

    const responseCode = dataView.getUint8(0);
    const requestOpCode = dataView.getUint8(1);
    const resultCode = dataView.getUint8(2);

    if (responseCode === FTMS_OPCODE.RESPONSE_CODE) {
      const resultText = FTMS_RESULT_CODE[resultCode] || `Code 0x${resultCode.toString(16)}`;
      this.log(`Control Point Response for OpCode 0x${requestOpCode.toString(16)}: ${resultText}`, resultCode === 1 ? 'info' : 'error');

      if (requestOpCode === FTMS_OPCODE.REQUEST_CONTROL) {
        this.hasControl = (resultCode === 1);
        this.dispatchEvent(new CustomEvent('controlstatus', { detail: { hasControl: this.hasControl } }));
      }
    }
  }

  async _writeControl(data) {
    if (!this.controlPointChar) throw new Error('Control point characteristic not available');
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    if (typeof this.controlPointChar.writeValueWithResponse === 'function') {
      await this.controlPointChar.writeValueWithResponse(bytes);
    } else {
      await this.controlPointChar.writeValue(bytes);
    }
  }

  // Request Control of the Trainer (OpCode 0x00)
  async requestControl() {
    this.log('Sending FTMS Request Control (0x00)...');
    await this._writeControl([FTMS_OPCODE.REQUEST_CONTROL]);
  }

  // Reset Control (OpCode 0x01)
  async reset() {
    this.log('Sending FTMS Reset (0x01)...');
    await this._writeControl([FTMS_OPCODE.RESET]);
  }

  // Start or Resume (OpCode 0x07)
  async startOrResume() {
    this.log('Sending FTMS Start / Resume (0x07)...');
    await this._writeControl([FTMS_OPCODE.START_OR_RESUME]);
  }

  // Stop or Pause (OpCode 0x08)
  async stopOrPause() {
    this.log('Sending FTMS Stop / Pause (0x08)...');
    await this._writeControl([FTMS_OPCODE.STOP_OR_PAUSE, 0x01]); // 0x01 = STOP
  }

  // Set ERG Mode Target Power (OpCode 0x05 + sint16 watts)
  async setTargetPower(watts) {
    const roundedWatts = Math.max(0, Math.min(2500, Math.round(watts)));
    
    const buffer = new ArrayBuffer(3);
    const view = new DataView(buffer);
    view.setUint8(0, FTMS_OPCODE.SET_TARGET_POWER);
    view.setInt16(1, roundedWatts, true); // Little-endian

    this.log(`Setting ERG Target Power: ${roundedWatts}W...`);
    await this._writeControl(buffer);
    this.lastTargetWatts = roundedWatts;
    this.dispatchEvent(new CustomEvent('targetpowerchanged', { detail: { targetWatts: roundedWatts } }));
  }

  // Set Target Resistance Level (OpCode 0x04 + uint8 level in 0.1 units)
  async setTargetResistance(level) {
    const raw = Math.max(0, Math.min(255, Math.round(level * 10)));
    this.log(`Setting Target Resistance Level: ${raw / 10}...`);
    await this._writeControl([FTMS_OPCODE.SET_TARGET_RESISTANCE, raw]);
  }

  // Set Simulation Parameters (OpCode 0x11: Grade %, Wind, Crr, Cw)
  async setSimulationParameters(gradePercent, windSpeedMps = 0, crr = 0.0040, cw = 0.51) {
    const buffer = new ArrayBuffer(7);
    const view = new DataView(buffer);
    view.setUint8(0, FTMS_OPCODE.SET_SIMULATION_PARAMETERS);
    
    // Wind Speed: sint16 in 0.001 m/s
    view.setInt16(1, Math.round(windSpeedMps * 1000), true);
    
    // Grade: sint16 in 0.01% (-10.00% to +20.00%)
    view.setInt16(3, Math.round(gradePercent * 100), true);
    
    // Rolling Resistance Crr: uint8 in 0.0001 (e.g. 0.0040 -> 40)
    view.setUint8(5, Math.min(255, Math.round(crr * 10000)));
    
    // Wind Resistance Cw: uint8 in 0.01 kg/m (e.g. 0.51 -> 51)
    view.setUint8(6, Math.min(255, Math.round(cw * 100)));

    this.log(`Setting Simulation Grade: ${gradePercent.toFixed(1)}%...`);
    await this._writeControl(buffer);
  }

  // Disconnect
  async disconnect() {
    if (this.device && this.device.gatt.connected) {
      try {
        await this.reset();
      } catch {
        // Ignore reset error on disconnect
      }
      this.device.gatt.disconnect();
    }
  }
}
