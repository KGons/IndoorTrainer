// FIT activity files use little-endian fields and the Garmin FIT epoch.
const FIT_EPOCH = Date.UTC(1989, 11, 31);
const fitTime = ms => Math.floor((ms - FIT_EPOCH) / 1000);

function crc16(bytes) {
  let crc = 0;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc & 1) ? (crc >>> 1) ^ 0xA001 : crc >>> 1;
    }
  }
  return crc;
}

class FitWriter {
  constructor() {
    this.bytes = [];
    this.definitions = new Map();
  }

  message(local, global, fields, values) {
    if (!this.definitions.has(local)) {
      this.bytes.push(0x40 | local, 0, 0, global & 255, global >> 8, fields.length);
      for (const [number, size, type] of fields) this.bytes.push(number, size, type);
      this.definitions.set(local, fields);
    }
    this.bytes.push(local);
    fields.forEach(([, size], index) => {
      let value = values[index];
      if (value === undefined) value = size === 4 ? 0xFFFFFFFF : size === 2 ? 0xFFFF : 0xFF;
      for (let byte = 0; byte < size; byte++) this.bytes.push((value >>> (byte * 8)) & 255);
    });
  }

  finish() {
    const data = new Uint8Array(this.bytes);
    const file = new Uint8Array(14 + data.length + 2);
    const view = new DataView(file.buffer);
    file.set([14, 0x10, 0xDE, 0x08], 0);
    view.setUint32(4, data.length, true);
    file.set([0x2E, 0x46, 0x49, 0x54], 8); // .FIT
    view.setUint16(12, crc16(file.subarray(0, 12)), true);
    file.set(data, 14);
    view.setUint16(file.length - 2, crc16(file.subarray(0, -2)), true);
    return file;
  }
}

export class ActivityRecorder {
  constructor() {
    this.active = false;
    this.telemetry = {};
  }

  start(name, now = Date.now()) {
    if (this.active) return;
    this.active = true;
    this.paused = false;
    this.name = name;
    this.startTime = now;
    this.activeSince = now;
    this.timerMs = 0;
    this.distance = 0;
    this.powerWork = 0;
    this.powerDuration = 0;
    this.records = [];
    this.events = [{ time: now, type: 0 }];
    this.telemetry = {};
    this.lastSampleTime = now;
  }

  update(data, now = Date.now()) {
    if (!this.active || this.paused) return;
    this.integrate(now);
    for (const key of ['power', 'cadence', 'speed', 'heartRate']) {
      if (Number.isFinite(data[key]) && data[key] >= 0) {
        this.telemetry[key] = { value: data[key], time: now };
      }
    }
  }

  sample(now = Date.now()) {
    if (!this.active || this.paused) return;
    this.integrate(now);
    const values = {};
    for (const [key, reading] of Object.entries(this.telemetry)) {
      if (now - reading.time <= 5000) values[key] = reading.value;
    }
    const record = { time: now, distance: this.distance, ...values };
    const last = this.records[this.records.length - 1];
    if (last && fitTime(last.time) === fitTime(now)) this.records[this.records.length - 1] = record;
    else this.records.push(record);
  }

  integrate(now) {
    for (const key of ['speed', 'power']) {
      const reading = this.telemetry[key];
      if (!reading) continue;
      const end = Math.min(now, reading.time + 5000);
      const seconds = Math.max(0, end - Math.max(this.lastSampleTime, reading.time)) / 1000;
      if (key === 'speed') this.distance += reading.value / 3.6 * seconds;
      else {
        this.powerWork += reading.value * seconds;
        this.powerDuration += seconds;
      }
    }
    this.lastSampleTime = now;
  }

  clearTelemetry(now = Date.now()) {
    if (this.active && !this.paused) this.integrate(now);
    this.telemetry = {};
  }

  setPaused(paused, now = Date.now()) {
    if (!this.active || this.paused === paused) return;
    if (paused) {
      this.sample(now);
      this.timerMs += now - this.activeSince;
    } else {
      this.activeSince = now;
      this.lastSampleTime = now;
      this.telemetry = {};
    }
    this.paused = paused;
    this.events.push({ time: now, type: paused ? 4 : 0 });
  }

  stop(now = Date.now()) {
    if (!this.active) return null;
    if (!this.paused) {
      this.sample(now);
      this.timerMs += now - this.activeSince;
      this.events.push({ time: now, type: 4 });
    }
    this.active = false;
    // A start immediately followed by stop is not a recorded workout.
    if (this.timerMs < 1000) return null;
    return {
      name: this.name,
      startTime: this.startTime,
      bytes: this.encode(now)
    };
  }

  encode(endTime) {
    const writer = new FitWriter();
    const timestamp = [253, 4, 0x86];
    const uint32 = number => [number, 4, 0x86];
    const uint16 = number => [number, 2, 0x84];
    const enumField = number => [number, 1, 0];
    const scaled = (value, scale, max) => value === undefined ? undefined : Math.min(max, Math.round(value * scale));
    writer.message(0, 0, [enumField(0), uint16(1), uint16(2), uint32(4)],
      [4, 255, 0, fitTime(this.startTime)]);

    const messages = [
      ...this.events.map(event => ({ ...event, event: true })),
      ...this.records
    ].sort((a, b) => a.time - b.time);
    for (const message of messages) {
      if (message.event) {
        writer.message(1, 21, [timestamp, enumField(0), enumField(1)], [fitTime(message.time), 0, message.type]);
      } else {
        writer.message(2, 20, [timestamp, [3, 1, 2], [4, 1, 2], uint32(5), uint16(6), uint16(7)], [
          fitTime(message.time),
          scaled(message.heartRate, 1, 254),
          scaled(message.cadence, 1, 254),
          scaled(message.distance, 100, 0xFFFFFFFE),
          scaled(message.speed, 1000 / 3.6, 65534),
          scaled(message.power, 1, 65534)
        ]);
      }
    }
    const elapsed = Math.round(endTime - this.startTime);
    const timer = Math.round(this.timerMs);
    const distance = scaled(this.distance, 100, 0xFFFFFFFE);
    const powerRecords = this.records.filter(record => record.power !== undefined);
    const avgPower = this.powerDuration
      ? scaled(this.powerWork / this.powerDuration, 1, 65534)
      : undefined;
    const maxPower = powerRecords.length
      ? scaled(powerRecords.reduce((max, record) => Math.max(max, record.power), 0), 1, 65534)
      : undefined;
    writer.message(3, 19, [timestamp, uint16(254), enumField(0), enumField(1), uint32(2),
      uint32(7), uint32(8), uint32(9), uint16(19), uint16(20), enumField(25)],
    [fitTime(endTime), 0, 9, 1, fitTime(this.startTime), elapsed, timer, distance, avgPower, maxPower, 2]);
    writer.message(4, 18, [timestamp, uint16(254), enumField(0), enumField(1), uint32(2),
      enumField(5), enumField(6), uint32(7), uint32(8), uint32(9), uint16(20), uint16(21),
      uint16(25), uint16(26)],
    [fitTime(endTime), 0, 8, 1, fitTime(this.startTime), 2, 6, elapsed, timer, distance, avgPower, maxPower, 0, 1]);
    writer.message(5, 34, [timestamp, uint32(0), uint16(1), enumField(2), enumField(3), enumField(4)],
      [fitTime(endTime), timer, 1, 0, 26, 1]);
    return writer.finish();
  }
}
