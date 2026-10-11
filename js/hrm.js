// hrm.js - Standard Bluetooth Heart Rate Service driver
export class HRMClient extends EventTarget {
  constructor() {
    super();
    this.device = null;
    this.characteristic = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.onDisconnected = () => this.disconnect();
    this.onMeasurement = event => {
      const value = event.target.value;
      if (!value || value.byteLength < 2) return;
      const flags = value.getUint8(0);
      if ((flags & 1) && value.byteLength < 3) return;
      const heartRate = (flags & 1) ? value.getUint16(1, true) : value.getUint8(1);
      const contactMissing = (flags & 4) && !(flags & 2);
      this.dispatchEvent(new CustomEvent('telemetry', {
        detail: { heartRate: contactMissing ? null : heartRate }
      }));
    };
  }

  async connect() {
    if (this.isConnected || this.isConnecting) return;
    if (!navigator.bluetooth) {
      throw new Error('Web Bluetooth is not supported. Use Chrome on Android or a Web Bluetooth-capable browser over HTTPS.');
    }
    this.isConnecting = true;
    try {
      this.device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [0x180D] }]
      });
      this.device.addEventListener('gattserverdisconnected', this.onDisconnected);
      const server = await this.device.gatt.connect();
      const service = await server.getPrimaryService(0x180D);
      this.characteristic = await service.getCharacteristic(0x2A37);
      this.characteristic.addEventListener('characteristicvaluechanged', this.onMeasurement);
      await this.characteristic.startNotifications();
      if (!this.device?.gatt.connected) throw new Error('Heart rate strap disconnected during setup.');
      this.isConnected = true;
      this.dispatchEvent(new CustomEvent('connected', {
        detail: { name: this.device.name || 'Heart rate strap' }
      }));
    } catch (err) {
      this.disconnect();
      if (err.name === 'NotFoundError') {
        throw new Error('No heart rate strap selected or Bluetooth scan was cancelled.');
      }
      throw err;
    } finally {
      this.isConnecting = false;
    }
  }

  disconnect() {
    const wasConnected = this.isConnected;
    this.isConnected = false;
    if (this.characteristic) {
      this.characteristic.removeEventListener('characteristicvaluechanged', this.onMeasurement);
      this.characteristic = null;
    }
    if (this.device) {
      this.device.removeEventListener('gattserverdisconnected', this.onDisconnected);
      if (this.device.gatt.connected) this.device.gatt.disconnect();
      this.device = null;
    }
    if (wasConnected) this.dispatchEvent(new CustomEvent('disconnected'));
  }
}
