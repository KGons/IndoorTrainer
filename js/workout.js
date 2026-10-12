// workout.js - Structured Workout Engine & CSV Parser
// Supports ERG mode (% of FTP or hard Watts), Slope/Grade simulation, and Resistance mode

export class WorkoutRunner extends EventTarget {
  constructor() {
    super();
    this.intervals = [];
    this.currentIndex = 0;
    this.elapsedInInterval = 0;
    this.totalElapsed = 0;
    this.isRunning = false;
    this.isPaused = false;
    this.timer = null;
    this.ftp = 200; // default Watts
    this.intensityBias = 100; // 100% default (Zwift-style)
    this.workoutName = 'Custom Workout';
  }

  setFtp(watts) {
    if (!Number.isFinite(watts)) return;
    this.ftp = Math.max(50, Math.min(600, Math.round(watts)));
    localStorage.setItem('trainer_ftp', this.ftp);
    this.dispatchEvent(new CustomEvent('ftpchanged', { detail: { ftp: this.ftp } }));
  }

  getFtp() {
    const saved = localStorage.getItem('trainer_ftp');
    const parsed = parseInt(saved, 10);
    if (Number.isFinite(parsed)) {
      this.ftp = Math.max(50, Math.min(600, parsed));
    }
    return this.ftp;
  }

  setBias(percent) {
    this.intensityBias = Math.max(50, Math.min(150, Math.round(percent)));
    this.dispatchEvent(new CustomEvent('biaschanged', {
      detail: {
        bias: this.intensityBias,
        targetWatts: this.getCurrentTargetWatts(),
        targetGrade: this.getCurrentTargetGrade(),
        targetResistance: this.getCurrentTargetResistance(),
        interval: this.getCurrentInterval()
      }
    }));
  }

  adjustBias(delta) {
    this.setBias(this.intensityBias + delta);
  }

  loadWorkout(intervals, name = 'Custom Workout') {
    this.stop();
    this.workoutName = name;
    this.intervals = intervals;
    this.currentIndex = 0;
    this.elapsedInInterval = 0;
    this.totalElapsed = 0;
    this.intensityBias = 100;
    this.dispatchEvent(new CustomEvent('workoutloaded', { detail: { intervals, name } }));
  }

  getCurrentInterval() {
    return this.intervals[this.currentIndex] || null;
  }

  getNextInterval() {
    return this.intervals[this.currentIndex + 1] || null;
  }

  getCurrentTargetWatts() {
    const interval = this.getCurrentInterval();
    if (!interval || interval.mode !== 'erg') return null;

    let baseWatts = 0;
    if (interval.targetType === 'pct_ftp') {
      baseWatts = this.ftp * interval.targetValue;
    } else {
      // Hard target watts
      baseWatts = interval.targetValue;
    }

    return Math.max(40, Math.round(baseWatts * (this.intensityBias / 100)));
  }

  getCurrentTargetGrade() {
    const interval = this.getCurrentInterval();
    if (!interval || interval.mode !== 'grade') return null;
    const baseGrade = interval.targetValue;
    // Apply intensity bias (e.g. 5.0% grade @ 90% bias = 4.5%)
    const biased = baseGrade * (this.intensityBias / 100);
    return Math.round(biased * 10) / 10;
  }

  getCurrentTargetResistance() {
    const interval = this.getCurrentInterval();
    if (!interval || interval.mode !== 'resistance') return null;
    const baseRes = interval.targetValue;
    // Apply intensity bias (e.g. Level 8 @ 90% bias = 7.2)
    const biased = baseRes * (this.intensityBias / 100);
    return Math.max(1, Math.min(20, Math.round(biased * 10) / 10));
  }

  getTotalDuration() {
    return this.intervals.reduce((acc, curr) => acc + curr.durationSec, 0);
  }

  start() {
    if (this.intervals.length === 0) return;
    this.isRunning = true;
    this.isPaused = false;

    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => this._tick(), 1000);

    this.dispatchEvent(new CustomEvent('started', {
      detail: {
        interval: this.getCurrentInterval(),
        targetWatts: this.getCurrentTargetWatts(),
        targetGrade: this.getCurrentTargetGrade(),
        targetResistance: this.getCurrentTargetResistance()
      }
    }));
  }

  pause() {
    if (!this.isRunning) return;
    this.isPaused = !this.isPaused;
    this.dispatchEvent(new CustomEvent('paused', { detail: { isPaused: this.isPaused } }));
  }

  stop() {
    this.isRunning = false;
    this.isPaused = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.currentIndex = 0;
    this.elapsedInInterval = 0;
    this.totalElapsed = 0;
    this.dispatchEvent(new CustomEvent('stopped'));
  }

  skipInterval() {
    if (!this.isRunning) return;
    if (this.currentIndex < this.intervals.length - 1) {
      this.currentIndex++;
      this.elapsedInInterval = 0;
      this._notifyIntervalChange();
    } else {
      this._complete();
    }
  }

  prevInterval() {
    if (!this.isRunning) return;
    if (this.elapsedInInterval > 5 || this.currentIndex === 0) {
      this.elapsedInInterval = 0;
    } else {
      this.currentIndex = Math.max(0, this.currentIndex - 1);
      this.elapsedInInterval = 0;
    }
    this._notifyIntervalChange();
  }

  _notifyIntervalChange() {
    this.dispatchEvent(new CustomEvent('intervalchanged', {
      detail: {
        index: this.currentIndex,
        interval: this.getCurrentInterval(),
        nextInterval: this.getNextInterval(),
        targetWatts: this.getCurrentTargetWatts(),
        targetGrade: this.getCurrentTargetGrade(),
        targetResistance: this.getCurrentTargetResistance(),
        bias: this.intensityBias
      }
    }));
  }

  _complete() {
    this.stop();
    this.dispatchEvent(new CustomEvent('completed'));
  }

  _tick() {
    if (this.isPaused) return;

    const current = this.getCurrentInterval();
    if (!current) {
      this._complete();
      return;
    }

    this.elapsedInInterval++;
    this.totalElapsed++;

    this.dispatchEvent(new CustomEvent('tick', {
      detail: {
        index: this.currentIndex,
        interval: current,
        elapsedInInterval: this.elapsedInInterval,
        remainingInInterval: Math.max(0, current.durationSec - this.elapsedInInterval),
        totalElapsed: this.totalElapsed,
        totalDuration: this.getTotalDuration(),
        targetWatts: this.getCurrentTargetWatts(),
        targetGrade: this.getCurrentTargetGrade(),
        targetResistance: this.getCurrentTargetResistance(),
        bias: this.intensityBias
      }
    }));

    if (this.elapsedInInterval >= current.durationSec) {
      if (this.currentIndex < this.intervals.length - 1) {
        this.currentIndex++;
        this.elapsedInInterval = 0;
        this._notifyIntervalChange();
      } else {
        this._complete();
      }
    }
  }
}

// ==========================================
// CSV WORKOUT PARSER
// ==========================================
export class WorkoutParser {
  /**
   * Parses CSV with flexible format:
   * Header: Segment,Duration,Mode,Target
   * Examples:
   * Warmup, 5, erg, 0.50        (ERG mode at 50% FTP)
   * Hard Interval, 3, erg, 250   (ERG mode at hard 250 Watts)
   * Steep Hill, 4, grade, 6.0%   (Grade mode at +6.0% incline)
   * Sprint Resistance, 1, resistance, 8 (Resistance mode at level 8)
   * 
   * Also supports optional repeat blocks:
   * Repeat, 5
   * Work, 3, erg, 0.90
   * Rest, 1, erg, 120
   * End
   */
  static parseCSV(csvText) {
    if (!csvText || typeof csvText !== 'string') return [];

    const rawLines = csvText.trim().split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#'));
    if (rawLines.length === 0) return [];

    const intervals = [];
    let inRepeat = false;
    let repeatCount = 1;
    let repeatBuffer = [];

    // Check if line 0 is a header row
    const line0 = rawLines[0].toLowerCase();
    const isHeader = line0.includes('duration') || line0.includes('target') || line0.includes('mode') || line0.includes('segment') || line0.includes('name');
    const startIdx = isHeader ? 1 : 0;

    for (let i = startIdx; i < rawLines.length; i++) {
      const line = rawLines[i];
      const cols = line.split(',').map(c => c.trim());

      const firstCol = cols[0].toLowerCase();

      // Check Repeat block
      if (firstCol === 'repeat') {
        inRepeat = true;
        repeatCount = parseInt(cols[1], 10) || 2;
        repeatBuffer = [];
        continue;
      }

      if (firstCol === 'end' || firstCol === 'endrepeat' || firstCol === 'repeat end') {
        if (inRepeat) {
          for (let r = 1; r <= repeatCount; r++) {
            for (let item of repeatBuffer) {
              intervals.push({
                ...item,
                name: `${item.name} (${r}/${repeatCount})`
              });
            }
          }
          inRepeat = false;
          repeatBuffer = [];
        }
        continue;
      }

      // Parse standard interval row
      const parsed = WorkoutParser._parseCsvRow(cols);
      if (parsed) {
        if (inRepeat) {
          repeatBuffer.push(parsed);
        } else {
          intervals.push(parsed);
        }
      }
    }

    // Flush any open repeats
    if (inRepeat && repeatBuffer.length > 0) {
      for (let r = 1; r <= repeatCount; r++) {
        for (let item of repeatBuffer) {
          intervals.push({ ...item, name: `${item.name} (${r}/${repeatCount})` });
        }
      }
    }

    return intervals;
  }

  static _parseCsvRow(cols) {
    if (cols.length < 2) return null;

    let name = 'Interval';
    let durationRaw = '';
    let modeRaw = 'erg';
    let targetRaw = '';

    if (cols.length === 2) {
      // Duration, Target (defaults to ERG mode)
      durationRaw = cols[0];
      targetRaw = cols[1];
    } else if (cols.length === 3) {
      // Segment, Duration, Target (defaults to ERG mode)
      name = cols[0];
      durationRaw = cols[1];
      targetRaw = cols[2];
    } else {
      // Segment, Duration, Mode, Target
      name = cols[0];
      durationRaw = cols[1];
      modeRaw = cols[2].toLowerCase();
      targetRaw = cols[3];
    }

    // Parse Duration
    const durationSec = WorkoutParser._parseDuration(durationRaw);
    if (durationSec <= 0) return null;

    // Normalize Mode: 'erg' | 'grade' | 'resistance'
    let mode = 'erg';
    if (modeRaw.includes('grad') || modeRaw.includes('slop') || modeRaw.includes('sim') || modeRaw.includes('inclin')) {
      mode = 'grade';
    } else if (modeRaw.includes('res') || modeRaw.includes('level')) {
      mode = 'resistance';
    } else {
      mode = 'erg';
    }

    // Parse Target based on Mode
    let targetType = 'pct_ftp';
    let targetValue = 0;

    if (mode === 'grade') {
      targetType = 'grade';
      targetValue = parseFloat(targetRaw.replace('%', '')) || 0;
    } else if (mode === 'resistance') {
      targetType = 'resistance';
      targetValue = parseFloat(targetRaw) || 1;
    } else {
      // ERG Mode: Detect % of FTP vs Hard Watts
      const cleanTarget = targetRaw.toLowerCase().trim();
      const hasPercent = cleanTarget.endsWith('%');
      const hasWatts = cleanTarget.endsWith('w');
      const numVal = parseFloat(cleanTarget.replace(/[^\d\.]/g, ''));
      if (!Number.isFinite(numVal)) return null;

      if (hasPercent) {
        targetType = 'pct_ftp';
        targetValue = numVal > 2.5 ? numVal / 100 : numVal;
      } else if (hasWatts) {
        targetType = 'watts';
        targetValue = numVal;
      } else if (numVal <= 2.5) {
        // Decimal like 0.75, 0.90 -> % of FTP
        targetType = 'pct_ftp';
        targetValue = numVal;
      } else {
        // e.g. 150, 200, 300 -> Hard Target Watts
        targetType = 'watts';
        targetValue = numVal;
      }
    }

    return {
      name,
      durationSec,
      mode,
      targetType,
      targetValue,
      rawTarget: targetRaw
    };
  }

  // Parses durations: "5" (5 min), "03:30" (3m30s), "45s", or "1h20m45s"
  static _parseDuration(str) {
    if (!str) return 0;
    const clean = str.trim().toLowerCase();

    // mm:ss format (e.g. 03:30 or 5:00)
    if (clean.includes(':')) {
      const [m, s] = clean.split(':').map(n => parseFloat(n) || 0);
      return Math.round(m * 60 + s);
    }

    // Compound time units (e.g. 1h20m45s, 20m45s, or 45s)
    const units = clean.match(/^(?:(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)\s*)?(?:(\d+(?:\.\d+)?)\s*(?:m|min|mins|minute|minutes)\s*)?(?:(\d+(?:\.\d+)?)\s*(?:s|sec|secs|second|seconds))?$/);
    if (units && units.slice(1).some(value => value !== undefined)) {
      const [, hours = 0, minutes = 0, seconds = 0] = units;
      return Math.round(Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds));
    }

    // Default: minutes (e.g. 5 or 3.5)
    if (/^\d+(?:\.\d+)?$/.test(clean)) {
      return Math.round(Number(clean) * 60);
    }

    return 0;
  }

  // Converts interval objects into standard CSV string
  static intervalsToCSV(intervals) {
    const lines = ['Segment,Duration,Mode,Target'];
    for (const inv of intervals) {
      let durStr = '';
      if (inv.durationSec % 60 === 0) {
        durStr = `${inv.durationSec / 60}`;
      } else if (inv.durationSec < 60) {
        durStr = `${inv.durationSec}s`;
      } else {
        durStr = `${(inv.durationSec / 60).toFixed(1)}`;
      }

      let targetStr = '';
      if (inv.mode === 'grade') {
        targetStr = `${inv.targetValue}%`;
      } else if (inv.mode === 'resistance') {
        targetStr = `${inv.targetValue}`;
      } else {
        // erg
        if (inv.targetType === 'pct_ftp') {
          targetStr = `${inv.targetValue.toFixed(2)}`;
        } else {
          targetStr = `${Math.round(inv.targetValue)}`;
        }
      }

      lines.push(`${inv.name},${durStr},${inv.mode},${targetStr}`);
    }
    return lines.join('\n');
  }
}
