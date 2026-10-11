// app.js - Mobile UI Controller & Telemetry Handler
import { FTMSClient } from './ftms.js';
import { WorkoutRunner, WorkoutParser } from './workout.js';
import { WorkoutLibrary } from './library.js';
import { ActivityRecorder } from './fit.js';

const ftms = new FTMSClient();
const workoutRunner = new WorkoutRunner();
const activityRecorder = new ActivityRecorder();

// UI Elements
const btnConnect = document.getElementById('btnConnect');
const connectBtnText = document.getElementById('connectBtnText');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const deviceDetails = document.getElementById('deviceDetails');
const deviceName = document.getElementById('deviceName');
const wakeLockStatus = document.getElementById('wakeLockStatus');

// Mobile Action Buttons & Modals
const btnInstallPwa = document.getElementById('btnInstallPwa');
const btnToggleSound = document.getElementById('btnToggleSound');
const btnToggleFullscreen = document.getElementById('btnToggleFullscreen');
const btnOpenPhoneGuide = document.getElementById('btnOpenPhoneGuide');
const modalPhoneGuide = document.getElementById('modalPhoneGuide');
const btnClosePhoneGuide = document.getElementById('btnClosePhoneGuide');
const btnClosePhoneGuideBtn = document.getElementById('btnClosePhoneGuideBtn');

// Metric Elements
const valPower = document.getElementById('valPower');
const valCadence = document.getElementById('valCadence');
const valSpeed = document.getElementById('valSpeed');
const valTime = document.getElementById('valTime');
const valHeartRate = document.getElementById('valHeartRate');
const targetWattsHeader = document.getElementById('targetWattsHeader');
const powerDeltaSub = document.getElementById('powerDeltaSub');
const distanceSub = document.getElementById('distanceSub');
const cadenceSub = document.getElementById('cadenceSub');
const caloriesSub = document.getElementById('caloriesSub');

// Control Elements
const tabErg = document.getElementById('tabErg');
const tabSlope = document.getElementById('tabSlope');
const tabWorkout = document.getElementById('tabWorkout');
const ergSection = document.getElementById('ergSection');
const slopeSection = document.getElementById('slopeSection');
const workoutSection = document.getElementById('workoutSection');

const targetWattsDisplay = document.getElementById('targetWattsDisplay');
const sliderWatts = document.getElementById('sliderWatts');
const btnSendTarget = document.getElementById('btnSendTarget');

const targetSlopeDisplay = document.getElementById('targetSlopeDisplay');
const sliderSlope = document.getElementById('sliderSlope');
const btnSendSlope = document.getElementById('btnSendSlope');

// Workout UI Elements
const inputFtp = document.getElementById('inputFtp');
const btnOpenLibrary = document.getElementById('btnOpenLibrary');
const btnOpenWorkoutEditor = document.getElementById('btnOpenWorkoutEditor');
const workoutNameDisplay = document.getElementById('workoutNameDisplay');
const workoutTotalDuration = document.getElementById('workoutTotalDuration');
const workoutTimeline = document.getElementById('workoutTimeline');
const currentIntervalName = document.getElementById('currentIntervalName');
const intervalCountdown = document.getElementById('intervalCountdown');
const intervalWattsTarget = document.getElementById('intervalWattsTarget');
const intervalPctFtp = document.getElementById('intervalPctFtp');
const nextIntervalPreview = document.getElementById('nextIntervalPreview');
const biasDisplay = document.getElementById('biasDisplay');
const btnWorkoutPrev = document.getElementById('btnWorkoutPrev');
const btnWorkoutToggle = document.getElementById('btnWorkoutToggle');
const btnWorkoutSkip = document.getElementById('btnWorkoutSkip');
const btnWorkoutStop = document.getElementById('btnWorkoutStop');
const fitExportPanel = document.getElementById('fitExportPanel');
const fitExportStatus = document.getElementById('fitExportStatus');
const btnDownloadFit = document.getElementById('btnDownloadFit');
const btnShareFit = document.getElementById('btnShareFit');
let recordedFitFile = null;
let recordingTimer = null;

function downloadFit() {
  if (!recordedFitFile) return;
  const url = URL.createObjectURL(recordedFitFile);
  const link = document.createElement('a');
  link.href = url;
  link.download = recordedFitFile.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

btnDownloadFit.addEventListener('click', downloadFit);
btnShareFit.addEventListener('click', async () => {
  if (!recordedFitFile) return;
  try {
    await navigator.share({ files: [recordedFitFile] });
  } catch (err) {
    if (err.name !== 'AbortError') {
      addLog(`Sharing unavailable: ${err.message}. Use Download FIT instead.`, 'warn');
    }
  }
});

// Library Modal Elements
const modalLibrary = document.getElementById('modalLibrary');
const btnCloseLibrary = document.getElementById('btnCloseLibrary');
const btnCloseLibraryBtn = document.getElementById('btnCloseLibraryBtn');
const libraryFilters = document.getElementById('libraryFilters');
const libraryList = document.getElementById('libraryList');

// Workout CSV Modal Elements
const modalWorkout = document.getElementById('modalWorkout');
const btnCloseModal = document.getElementById('btnCloseModal');
const btnCancelModal = document.getElementById('btnCancelModal');
const btnApplyWorkout = document.getElementById('btnApplyWorkout');
const btnSaveToLibrary = document.getElementById('btnSaveToLibrary');
const inputWorkoutSaveName = document.getElementById('inputWorkoutSaveName');
const workoutTextInput = document.getElementById('workoutTextInput');
const btnTriggerUpload = document.getElementById('btnTriggerUpload');
const fileCsvInput = document.getElementById('fileCsvInput');
// Workout Builder Elements
const btnOpenBuilder = document.getElementById('btnOpenBuilder');
const modalBuilder = document.getElementById('modalBuilder');
const btnCloseBuilder = document.getElementById('btnCloseBuilder');
const btnCancelBuilder = document.getElementById('btnCancelBuilder');
const builderWorkoutName = document.getElementById('builderWorkoutName');
const builderCategory = document.getElementById('builderCategory');
const builderTotalDuration = document.getElementById('builderTotalDuration');
const builderTimelinePreview = document.getElementById('builderTimelinePreview');
const builderSegmentCount = document.getElementById('builderSegmentCount');
const builderSegmentsList = document.getElementById('builderSegmentsList');
const btnAddSegmentBtn = document.getElementById('btnAddSegmentBtn');
const btnOpenRepeatBox = document.getElementById('btnOpenRepeatBox');
const builderRepeatBox = document.getElementById('builderRepeatBox');
const btnCloseRepeatBox = document.getElementById('btnCloseRepeatBox');
const btnConfirmAddRepeat = document.getElementById('btnConfirmAddRepeat');
const repeatCountInput = document.getElementById('repeatCountInput');
const repeatWorkDurInput = document.getElementById('repeatWorkDurInput');
const repeatWorkTargetInput = document.getElementById('repeatWorkTargetInput');
const repeatRestDurInput = document.getElementById('repeatRestDurInput');
const repeatRestTargetInput = document.getElementById('repeatRestTargetInput');
const btnAddWarmupPreset = document.getElementById('btnAddWarmupPreset');
const btnAddCooldownPreset = document.getElementById('btnAddCooldownPreset');
const btnDownloadCsv = document.getElementById('btnDownloadCsv');
const btnSaveBuilderToLibrary = document.getElementById('btnSaveBuilderToLibrary');

// Log Elements
const logBox = document.getElementById('logBox');
const logCount = document.getElementById('logCount');
const logToggle = document.getElementById('logToggle');
const logArrow = document.getElementById('logArrow');

// State
let targetWatts = 150;
let targetSlope = 0.0;
let currentMode = 'erg'; // 'erg', 'slope', or 'workout'
let wakeLock = null;
let logEntryCount = 0;
let workoutStartTime = null;
let timerInterval = null;
let isSoundEnabled = true;
let audioCtx = null;
let deferredInstallPrompt = null;

// Logger
function addLog(message, type = 'info') {
  logEntryCount++;
  logCount.textContent = logEntryCount;
  
  const time = new Date().toLocaleTimeString();
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  entry.textContent = `[${time}] ${message}`;
  logBox.appendChild(entry);
  logBox.scrollTop = logBox.scrollHeight;
}

// Log collapse toggle
let logExpanded = true;
logToggle.addEventListener('click', () => {
  logExpanded = !logExpanded;
  logBox.style.display = logExpanded ? 'flex' : 'none';
  logArrow.textContent = logExpanded ? '▲' : '▼';
});

// Screen Wake Lock
async function requestWakeLock() {
  if ('wakeLock' in navigator) {
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLockStatus.textContent = '☀️ Screen Awake: ON';
      wakeLockStatus.classList.add('active');
      addLog('Screen wake lock enabled (screen will stay awake while riding).', 'info');

      wakeLock.addEventListener('release', () => {
        wakeLockStatus.textContent = '☀️ Screen Awake: Off';
        wakeLockStatus.classList.remove('active');
      });
    } catch (err) {
      addLog(`Wake Lock error: ${err.message}`, 'warn');
    }
  } else {
    wakeLockStatus.textContent = '☀️ Wake Lock unsupported';
  }
}

wakeLockStatus.addEventListener('click', async () => {
  if (wakeLock) {
    await wakeLock.release();
    wakeLock = null;
  } else {
    await requestWakeLock();
  }
});

// Auto re-acquire wake lock when phone app regains visibility
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState === 'visible' && !wakeLock && (ftms.isConnected || workoutRunner.isRunning)) {
    await requestWakeLock();
  }
});

// Telemetry formatting
function formatDuration(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Timer
function startTimer() {
  workoutStartTime = Date.now();
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - workoutStartTime) / 1000);
    valTime.textContent = formatDuration(elapsed);
  }, 1000);
}

function stopTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = null;
}

// FTMS Event Listeners
ftms.addEventListener('log', (e) => {
  addLog(e.detail.message, e.detail.type);
});

ftms.addEventListener('connected', async (e) => {
  statusDot.className = 'status-dot connected';
  statusText.textContent = 'Connected (FTMS)';
  btnConnect.className = 'btn-connect connected';
  connectBtnText.textContent = 'Disconnect';
  deviceDetails.style.display = 'inline-flex';
  deviceName.textContent = e.detail.name || 'Elite Direto X-RT';

  // Request wake lock when connected
  requestWakeLock();
  startTimer();

  // Initial target power sync
  try {
    await ftms.setTargetPower(targetWatts);
    targetWattsHeader.textContent = `Target: ${targetWatts} W`;
  } catch (err) {
    addLog(`Error setting initial target watts: ${err.message}`, 'error');
  }
});

ftms.addEventListener('disconnected', () => {
  activityRecorder.clearTelemetry();
  statusDot.className = 'status-dot';
  statusText.textContent = 'Disconnected';
  btnConnect.className = 'btn-connect';
  connectBtnText.textContent = 'Connect Elite Direto';
  deviceDetails.style.display = 'none';
  stopTimer();
  addLog('Trainer session ended.', 'warn');
});

ftms.addEventListener('deviceinfo', (e) => {
  const { manufacturer, model, firmware } = e.detail;
  if (model) {
    deviceName.textContent = `${manufacturer || ''} ${model}`.trim();
  }
});

ftms.addEventListener('telemetry', (e) => {
  const d = e.detail;
  activityRecorder.update(d);

  // Power
  if (d.power !== undefined) {
    valPower.textContent = d.power;

    if (currentMode === 'workout') {
      const curr = workoutRunner.getCurrentInterval();
      if (curr && curr.mode === 'erg') {
        const activeTarget = workoutRunner.getCurrentTargetWatts();
        const delta = d.power - activeTarget;
        const deltaSign = delta > 0 ? `+${delta}` : `${delta}`;
        powerDeltaSub.textContent = `${deltaSign}W vs Target (${activeTarget}W @ ${workoutRunner.intensityBias}%)`;

        if (Math.abs(delta) <= 10) valPower.style.color = 'var(--accent-green)';
        else if (delta < -10) valPower.style.color = '#38bdf8';
        else valPower.style.color = 'var(--accent-orange)';
      } else if (curr && curr.mode === 'grade') {
        const grade = curr.targetValue;
        powerDeltaSub.textContent = `Grade: ${grade >= 0 ? '+' : ''}${grade.toFixed(1)}% simulated incline`;
        valPower.style.color = grade > 4 ? 'var(--accent-orange)' : 'var(--accent-cyan)';
      } else if (curr && curr.mode === 'resistance') {
        powerDeltaSub.textContent = `Resistance Level ${curr.targetValue} active`;
        valPower.style.color = 'var(--accent-yellow)';
      }
    } else if (currentMode === 'erg') {
      const delta = d.power - targetWatts;
      const deltaSign = delta > 0 ? `+${delta}` : `${delta}`;
      powerDeltaSub.textContent = `${deltaSign}W vs Target (${targetWatts}W)`;

      if (Math.abs(delta) <= 10) valPower.style.color = 'var(--accent-green)';
      else if (delta < -10) valPower.style.color = '#38bdf8';
      else valPower.style.color = 'var(--accent-orange)';
    } else {
      // Slope Mode
      const slopeSign = targetSlope >= 0 ? '+' : '';
      powerDeltaSub.textContent = `Grade: ${slopeSign}${targetSlope.toFixed(1)}% resistance active`;
      valPower.style.color = targetSlope > 4 ? 'var(--accent-orange)' : targetSlope < 0 ? 'var(--accent-cyan)' : 'var(--accent-green)';
    }
  }

  // Cadence
  if (d.cadence !== undefined) {
    valCadence.textContent = Math.round(d.cadence);
    cadenceSub.textContent = d.cadence > 0 ? (d.cadence < 80 ? 'Low RPM' : d.cadence > 100 ? 'High RPM' : 'Optimal cadence') : 'Coasting';
  }

  // Speed
  if (d.speed !== undefined) {
    valSpeed.textContent = d.speed.toFixed(1);
  }

  // Distance
  if (d.totalDistance !== undefined) {
    distanceSub.textContent = `${(d.totalDistance / 1000).toFixed(2)} km`;
  }

  // Heart Rate
  if (d.heartRate !== undefined) {
    valHeartRate.textContent = d.heartRate;
  }

  // Calories
  if (d.totalEnergyKCal !== undefined) {
    caloriesSub.textContent = `${d.totalEnergyKCal} kcal`;
  }
});

// ============================================================
// MOBILE PHONE ENGINE: AUDIO ALERTS & HAPTIC VIBRATION
// ============================================================

function initAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playTone(freq, duration = 0.12, type = 'sine', gainVal = 0.25) {
  if (!isSoundEnabled) return;
  try {
    initAudioContext();
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(gainVal, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    // Audio context requires user gesture
  }
}

function playCountdownPip() {
  playTone(560, 0.1, 'sine', 0.25);
}

function playIntervalStartChime() {
  playTone(880, 0.35, 'triangle', 0.35);
}

function playWorkoutCompleteJingle() {
  playTone(523, 0.15, 'sine', 0.3);
  setTimeout(() => playTone(659, 0.15, 'sine', 0.3), 160);
  setTimeout(() => playTone(784, 0.35, 'sine', 0.35), 320);
}

// Mobile Vibration API for Handlebars
function triggerHaptic(pattern = 35) {
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {}
  }
}

// Fullscreen Cockpit Toggle
if (btnToggleFullscreen) {
  btnToggleFullscreen.addEventListener('click', () => {
    triggerHaptic(30);
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      btnToggleFullscreen.classList.add('active');
    } else {
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      btnToggleFullscreen.classList.remove('active');
    }
  });
}

// Sound Alerts Toggle
if (btnToggleSound) {
  btnToggleSound.addEventListener('click', () => {
    triggerHaptic(30);
    isSoundEnabled = !isSoundEnabled;
    btnToggleSound.textContent = isSoundEnabled ? '🔊' : '🔇';
    btnToggleSound.classList.toggle('active', isSoundEnabled);
    if (isSoundEnabled) {
      initAudioContext();
      playCountdownPip();
    }
  });
}

// Standalone Phone Setup / Help Modal
if (btnOpenPhoneGuide && modalPhoneGuide) {
  btnOpenPhoneGuide.addEventListener('click', () => {
    triggerHaptic(30);
    modalPhoneGuide.classList.add('active');
  });
  if (btnClosePhoneGuide) {
    btnClosePhoneGuide.addEventListener('click', () => modalPhoneGuide.classList.remove('active'));
  }
  if (btnClosePhoneGuideBtn) {
    btnClosePhoneGuideBtn.addEventListener('click', () => modalPhoneGuide.classList.remove('active'));
  }
}

// PWA Install Prompt Listener
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  if (btnInstallPwa) {
    btnInstallPwa.style.display = 'inline-flex';
  }
});

if (btnInstallPwa) {
  btnInstallPwa.addEventListener('click', async () => {
    triggerHaptic(40);
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') {
      btnInstallPwa.style.display = 'none';
      addLog('Installed to phone successfully!', 'info');
    }
    deferredInstallPrompt = null;
  });
}

window.addEventListener('appinstalled', () => {
  if (btnInstallPwa) btnInstallPwa.style.display = 'none';
  addLog('App successfully added to your home screen.', 'info');
});

// Connect Button Handler
btnConnect.addEventListener('click', async () => {
  initAudioContext();
  triggerHaptic(40);
  if (ftms.isConnected) {
    await ftms.disconnect();
  } else {
    try {
      statusDot.className = 'status-dot connecting';
      statusText.textContent = 'Connecting...';
      const dName = await ftms.connect();
      statusDot.className = 'status-dot connected';
      statusText.textContent = 'Connected (FTMS)';
      btnConnect.className = 'btn-connect connected';
      connectBtnText.textContent = 'Disconnect';
      deviceDetails.style.display = 'inline-flex';
      deviceName.textContent = dName || 'Elite Direto XR';
    } catch (err) {
      statusDot.className = 'status-dot';
      statusText.textContent = 'Failed: ' + (err.name || 'Error');
      addLog(`Connection failed: ${err.message}`, 'error');
      // Auto-expand log box so the user sees the diagnostic details immediately
      if (logBox.style.display === 'none') {
        logBox.style.display = 'block';
        logArrow.textContent = '▲';
      }
    }
  }
});

// Mode Switching (ERG vs Slope vs Workout)
tabErg.addEventListener('click', () => {
  currentMode = 'erg';
  tabErg.classList.add('active');
  tabSlope.classList.remove('active');
  tabWorkout.classList.remove('active');
  ergSection.classList.remove('hidden');
  slopeSection.classList.remove('active');
  workoutSection.classList.remove('active');
  updateTargetWatts(targetWatts, true);
  addLog('Switched to ERG Mode (Target Watts control).', 'info');
});

tabSlope.addEventListener('click', () => {
  currentMode = 'slope';
  tabSlope.classList.add('active');
  tabErg.classList.remove('active');
  tabWorkout.classList.remove('active');
  ergSection.classList.add('hidden');
  slopeSection.classList.add('active');
  workoutSection.classList.remove('active');
  updateTargetSlope(targetSlope, true);
  addLog('Switched to Slope Sim Mode (Gradient % control).', 'info');
});

tabWorkout.addEventListener('click', () => {
  currentMode = 'workout';
  tabWorkout.classList.add('active');
  tabErg.classList.remove('active');
  tabSlope.classList.remove('active');
  ergSection.classList.add('hidden');
  slopeSection.classList.remove('active');
  workoutSection.classList.add('active');
  syncWorkoutTargetToTrainer();
  addLog('Switched to Workout Mode (Structured ERG).', 'info');
});

// ERG Mode Adjustments
function updateTargetWatts(watts, sendToTrainer = true) {
  targetWatts = Math.max(50, Math.min(500, Math.round(watts)));
  targetWattsDisplay.textContent = targetWatts;
  sliderWatts.value = targetWatts;
  
  if (currentMode === 'erg') {
    targetWattsHeader.textContent = `Target: ${targetWatts} W`;
  }

  if (sendToTrainer && ftms.isConnected) {
    ftms.setTargetPower(targetWatts).catch((err) => {
      addLog(`Failed to set watts: ${err.message}`, 'error');
    });
  }
}

// Step buttons (+/-)
document.querySelectorAll('[data-step]').forEach((btn) => {
  btn.addEventListener('click', () => {
    triggerHaptic(30);
    const step = parseInt(btn.getAttribute('data-step'), 10);
    updateTargetWatts(targetWatts + step, true);
  });
});

// Presets
document.querySelectorAll('[data-watts]').forEach((btn) => {
  btn.addEventListener('click', () => {
    triggerHaptic(35);
    const watts = parseInt(btn.getAttribute('data-watts'), 10);
    updateTargetWatts(watts, true);
  });
});

// Slider (with debounce for smooth dragging without spamming BLE)
let sliderDebounce = null;
sliderWatts.addEventListener('input', (e) => {
  const val = parseInt(e.target.value, 10);
  updateTargetWatts(val, false);

  clearTimeout(sliderDebounce);
  sliderDebounce = setTimeout(() => {
    updateTargetWatts(val, true);
  }, 250);
});

btnSendTarget.addEventListener('click', () => {
  triggerHaptic(40);
  updateTargetWatts(targetWatts, true);
});

// Slope Mode Adjustments
function updateTargetSlope(slope, sendToTrainer = true) {
  targetSlope = Math.max(-10, Math.min(20, Math.round(parseFloat(slope) * 10) / 10));
  const sign = targetSlope >= 0 ? '+' : '';
  const formattedSlope = `${sign}${targetSlope.toFixed(1)}%`;

  targetSlopeDisplay.textContent = formattedSlope;
  sliderSlope.value = targetSlope;

  if (currentMode === 'slope') {
    targetWattsHeader.textContent = `Grade: ${formattedSlope}`;
    powerDeltaSub.textContent = `Simulated Incline: ${formattedSlope}`;
  }

  if (sendToTrainer && ftms.isConnected) {
    ftms.setSimulationParameters(targetSlope).catch((err) => {
      addLog(`Failed to set slope: ${err.message}`, 'error');
    });
  }
}

// Incremental slope step buttons (+0.5%, -0.5%, +1.0%, etc.)
document.querySelectorAll('[data-slope-step]').forEach((btn) => {
  btn.addEventListener('click', () => {
    triggerHaptic(30);
    const step = parseFloat(btn.getAttribute('data-slope-step'));
    updateTargetSlope(targetSlope + step, true);
  });
});

// Slope Presets (-3%, 0%, +3%, +6%, +10%)
document.querySelectorAll('[data-slope]').forEach((btn) => {
  btn.addEventListener('click', () => {
    triggerHaptic(35);
    const slope = parseFloat(btn.getAttribute('data-slope'));
    updateTargetSlope(slope, true);
  });
});

// Slope Slider (with debounce)
let slopeSliderDebounce = null;
sliderSlope.addEventListener('input', (e) => {
  const val = parseFloat(e.target.value);
  updateTargetSlope(val, false);

  clearTimeout(slopeSliderDebounce);
  slopeSliderDebounce = setTimeout(() => {
    updateTargetSlope(val, true);
  }, 250);
});

btnSendSlope.addEventListener('click', () => {
  updateTargetSlope(targetSlope, true);
});

// ==========================================
// STRUCTURED WORKOUT CONTROLLER & TIMELINE
// ==========================================

// Initialize FTP
inputFtp.value = workoutRunner.getFtp();
inputFtp.addEventListener('change', (e) => {
  const val = parseInt(e.target.value, 10);
  workoutRunner.setFtp(val);
  renderWorkoutTimeline();
  syncWorkoutTargetToTrainer();
  addLog(`User FTP updated to ${workoutRunner.ftp}W`, 'info');
});

// Sync workout target to trainer
function syncWorkoutTargetToTrainer() {
  const currentInterval = workoutRunner.getCurrentInterval();
  if (!currentInterval) return;

  currentIntervalName.textContent = currentInterval.name;

  if (currentInterval.mode === 'erg') {
    const currentWatts = workoutRunner.getCurrentTargetWatts();
    intervalWattsTarget.textContent = `Target: ${currentWatts} W`;

    if (currentInterval.targetType === 'pct_ftp') {
      intervalPctFtp.textContent = `${Math.round(currentInterval.targetValue * 100)}% FTP (@ ${workoutRunner.intensityBias}%)`;
    } else {
      intervalPctFtp.textContent = `${currentInterval.targetValue}W Hard Target (@ ${workoutRunner.intensityBias}%)`;
    }

    if (currentMode === 'workout') {
      targetWattsHeader.textContent = `Target: ${currentWatts} W`;
      powerDeltaSub.textContent = `ERG Mode Active (${currentWatts}W)`;
    }

    if (ftms.isConnected && (workoutRunner.isRunning || currentMode === 'workout')) {
      ftms.setTargetPower(currentWatts).catch((err) => {
        addLog(`Failed to set ERG target watts: ${err.message}`, 'error');
      });
    }
  } else if (currentInterval.mode === 'grade') {
    const grade = workoutRunner.getCurrentTargetGrade() || 0;
    const sign = grade >= 0 ? '+' : '';
    intervalWattsTarget.textContent = `Grade: ${sign}${grade.toFixed(1)}%`;
    intervalPctFtp.textContent = `Base ${currentInterval.targetValue}% (@ ${workoutRunner.intensityBias}% Bias)`;

    if (currentMode === 'workout') {
      targetWattsHeader.textContent = `Grade: ${sign}${grade.toFixed(1)}%`;
      powerDeltaSub.textContent = `Simulated Incline: ${sign}${grade.toFixed(1)}% (@ ${workoutRunner.intensityBias}% Bias)`;
    }

    if (ftms.isConnected && (workoutRunner.isRunning || currentMode === 'workout')) {
      ftms.setSimulationParameters(grade).catch((err) => {
        addLog(`Failed to set slope simulation: ${err.message}`, 'error');
      });
    }
  } else if (currentInterval.mode === 'resistance') {
    const res = workoutRunner.getCurrentTargetResistance() || 1;
    intervalWattsTarget.textContent = `Resistance: Level ${res}`;
    intervalPctFtp.textContent = `Base Level ${currentInterval.targetValue} (@ ${workoutRunner.intensityBias}% Bias)`;

    if (currentMode === 'workout') {
      targetWattsHeader.textContent = `Resistance: Level ${res}`;
      powerDeltaSub.textContent = `Trainer Resistance Level ${res} (@ ${workoutRunner.intensityBias}% Bias)`;
    }

    if (ftms.isConnected && (workoutRunner.isRunning || currentMode === 'workout')) {
      ftms._writeControl([0x04, Math.round(res)]).catch((err) => {
        addLog(`Failed to set resistance level: ${err.message}`, 'error');
      });
    }
  }

  // Next interval preview
  const next = workoutRunner.getNextInterval();
  if (next) {
    let nextDetail = '';
    if (next.mode === 'erg') {
      const nextWatts = next.targetType === 'pct_ftp' 
        ? Math.round(workoutRunner.ftp * next.targetValue * (workoutRunner.intensityBias / 100))
        : Math.round(next.targetValue * (workoutRunner.intensityBias / 100));
      nextDetail = `@ ${nextWatts}W`;
    } else if (next.mode === 'grade') {
      const nextBiasedGrade = Math.round(next.targetValue * (workoutRunner.intensityBias / 100) * 10) / 10;
      nextDetail = `@ ${nextBiasedGrade >= 0 ? '+' : ''}${nextBiasedGrade.toFixed(1)}% Grade`;
    } else {
      const nextBiasedRes = Math.round(next.targetValue * (workoutRunner.intensityBias / 100) * 10) / 10;
      nextDetail = `@ Level ${nextBiasedRes}`;
    }
    nextIntervalPreview.textContent = `Next: ${next.name} (${formatDuration(next.durationSec)} ${nextDetail})`;
  } else {
    nextIntervalPreview.textContent = 'Next: Finished!';
  }
}

// Render Workout Visual Timeline Bar
function renderWorkoutTimeline() {
  workoutTimeline.innerHTML = '';
  const intervals = workoutRunner.intervals;
  if (!intervals || intervals.length === 0) {
    workoutNameDisplay.textContent = 'No workout loaded';
    workoutTotalDuration.textContent = '00:00';
    return;
  }

  workoutNameDisplay.textContent = workoutRunner.workoutName || 'Structured Workout';
  const totalSec = workoutRunner.getTotalDuration();
  workoutTotalDuration.textContent = formatDuration(totalSec);

  intervals.forEach((interval, idx) => {
    const bar = document.createElement('div');
    bar.className = 'timeline-bar';

    // Width proportional to duration
    const widthPct = Math.max(1.5, (interval.durationSec / totalSec) * 100);
    bar.style.width = `${widthPct}%`;

    // Height & Color based on mode
    if (interval.mode === 'erg') {
      const wattsEquivalent = interval.targetType === 'pct_ftp' 
        ? Math.round(workoutRunner.ftp * interval.targetValue * (workoutRunner.intensityBias / 100))
        : Math.round(interval.targetValue * (workoutRunner.intensityBias / 100));

      const effectivePct = wattsEquivalent / workoutRunner.ftp;
      const heightPct = Math.min(100, Math.max(25, (effectivePct / 1.3) * 100));
      bar.style.height = `${heightPct}%`;

      if (effectivePct < 0.60) bar.classList.add('zone-z1');
      else if (effectivePct < 0.76) bar.classList.add('zone-z2');
      else if (effectivePct < 0.91) bar.classList.add('zone-z3');
      else if (effectivePct < 1.06) bar.classList.add('zone-z4');
      else if (effectivePct < 1.21) bar.classList.add('zone-z5');
      else bar.classList.add('zone-z6');

      bar.title = `${interval.name}: ${formatDuration(interval.durationSec)} @ ${wattsEquivalent}W (${interval.targetType === 'pct_ftp' ? Math.round(interval.targetValue * 100) + '%' : 'Hard Watt'} FTP)`;
    } else if (interval.mode === 'grade') {
      const biasedGrade = Math.round(interval.targetValue * (workoutRunner.intensityBias / 100) * 10) / 10;
      const heightPct = Math.min(100, Math.max(25, ((biasedGrade + 5) / 20) * 100));
      bar.style.height = `${heightPct}%`;
      bar.classList.add('zone-grade');
      bar.title = `${interval.name}: ${formatDuration(interval.durationSec)} @ ${biasedGrade >= 0 ? '+' : ''}${biasedGrade.toFixed(1)}% Grade (Base ${interval.targetValue}%)`;
    } else {
      const biasedRes = Math.round(interval.targetValue * (workoutRunner.intensityBias / 100) * 10) / 10;
      const heightPct = Math.min(100, Math.max(25, (biasedRes / 10) * 100));
      bar.style.height = `${heightPct}%`;
      bar.classList.add('zone-res');
      bar.title = `${interval.name}: ${formatDuration(interval.durationSec)} @ Resistance Level ${biasedRes} (Base Level ${interval.targetValue})`;
    }

    if (idx === workoutRunner.currentIndex) {
      bar.classList.add('active');
    } else if (idx < workoutRunner.currentIndex) {
      bar.classList.add('passed');
    }

    bar.addEventListener('click', () => {
      workoutRunner.currentIndex = idx;
      workoutRunner.elapsedInInterval = 0;
      workoutRunner._notifyIntervalChange();
      renderWorkoutTimeline();
    });

    workoutTimeline.appendChild(bar);
  });
}

// Workout Runner Event Listeners
workoutRunner.addEventListener('tick', (e) => {
  const d = e.detail;
  intervalCountdown.textContent = formatDuration(d.remainingInInterval);
  renderWorkoutTimeline();

  // 3-2-1 Audio countdown & haptic alerts for handlebar phone mount
  if (workoutRunner.isRunning && !workoutRunner.isPaused) {
    if (d.remainingInInterval === 3 || d.remainingInInterval === 2 || d.remainingInInterval === 1) {
      playCountdownPip();
      triggerHaptic(60);
    }
  }
});

workoutRunner.addEventListener('intervalchanged', (e) => {
  const d = e.detail;
  intervalCountdown.textContent = formatDuration(d.interval.durationSec);
  syncWorkoutTargetToTrainer();
  renderWorkoutTimeline();
  playIntervalStartChime();
  triggerHaptic([100, 50, 150]);
  
  if (d.interval.mode === 'grade') {
    const sign = d.targetGrade >= 0 ? '+' : '';
    addLog(`Workout interval: ${d.interval.name} (Grade: ${sign}${d.targetGrade.toFixed(1)}%)`, 'info');
  } else if (d.interval.mode === 'resistance') {
    addLog(`Workout interval: ${d.interval.name} (Resistance: Level ${d.targetResistance})`, 'info');
  } else {
    addLog(`Workout interval: ${d.interval.name} (${d.targetWatts}W)`, 'info');
  }
});

workoutRunner.addEventListener('biaschanged', (e) => {
  const d = e.detail;
  biasDisplay.textContent = `${d.bias}%`;
  syncWorkoutTargetToTrainer();
  renderWorkoutTimeline();

  const curr = d.interval;
  if (curr && curr.mode === 'grade') {
    const sign = d.targetGrade >= 0 ? '+' : '';
    addLog(`Workout Intensity Bias: ${d.bias}% (Target Grade: ${sign}${d.targetGrade.toFixed(1)}%)`, 'info');
  } else if (curr && curr.mode === 'resistance') {
    addLog(`Workout Intensity Bias: ${d.bias}% (Target Resistance: Level ${d.targetResistance})`, 'info');
  } else {
    addLog(`Workout Intensity Bias: ${d.bias}% (Target: ${d.targetWatts}W)`, 'info');
  }
});

workoutRunner.addEventListener('started', () => {
  if (!activityRecorder.active) {
    activityRecorder.start(workoutRunner.workoutName);
    recordingTimer = setInterval(() => activityRecorder.sample(), 1000);
  }
  initAudioContext();
  triggerHaptic([80, 50, 80]);
  requestWakeLock();
  btnWorkoutToggle.textContent = '⏸ Pause';
  btnWorkoutToggle.className = 'btn-workout-main btn-pause';
  btnWorkoutStop.style.display = 'block';
  syncWorkoutTargetToTrainer();
  addLog('Workout started! Holding ERG resistance.', 'info');
});

workoutRunner.addEventListener('paused', (e) => {
  activityRecorder.setPaused(e.detail.isPaused);
  triggerHaptic(50);
  if (e.detail.isPaused) {
    btnWorkoutToggle.textContent = '▶ Resume';
    btnWorkoutToggle.className = 'btn-workout-main btn-play';
    addLog('Workout paused.', 'info');
  } else {
    btnWorkoutToggle.textContent = '⏸ Pause';
    btnWorkoutToggle.className = 'btn-workout-main btn-pause';
    addLog('Workout resumed.', 'info');
  }
});

workoutRunner.addEventListener('stopped', () => {
  clearInterval(recordingTimer);
  recordingTimer = null;
  const activity = activityRecorder.stop();
  if (activity) {
    const date = new Date(activity.startTime).toISOString().replace(/[:.]/g, '-');
    recordedFitFile = new File([activity.bytes], `indoor-cycling-${date}.fit`, { type: 'application/octet-stream' });
    fitExportPanel.hidden = false;
    fitExportStatus.textContent = `${activity.name}: FIT file ready. Download, then upload to Garmin Connect.`;
    btnShareFit.hidden = !(navigator.canShare && navigator.canShare({ files: [recordedFitFile] }));
    downloadFit();
    addLog('Workout saved as FIT. Upload it using Garmin Connect web Import Data.', 'info');
  }
  triggerHaptic(50);
  btnWorkoutToggle.textContent = '▶ Start Workout';
  btnWorkoutToggle.className = 'btn-workout-main btn-play';
  btnWorkoutStop.style.display = 'none';
  const curr = workoutRunner.getCurrentInterval();
  intervalCountdown.textContent = curr ? formatDuration(curr.durationSec) : '00:00';
  renderWorkoutTimeline();
  addLog('Workout stopped.', 'warn');
});

workoutRunner.addEventListener('completed', () => {
  playWorkoutCompleteJingle();
  triggerHaptic([150, 80, 150, 80, 300]);
  btnWorkoutToggle.textContent = '▶ Start Workout';
  btnWorkoutToggle.className = 'btn-workout-main btn-play';
  btnWorkoutStop.style.display = 'none';
  intervalCountdown.textContent = '00:00';
  renderWorkoutTimeline();
  alert('🎉 Workout Completed! Fantastic effort!');
  addLog('🎉 Workout Completed! Great effort!', 'info');
});

// Workout Play / Pause / Skip Buttons
btnWorkoutToggle.addEventListener('click', () => {
  triggerHaptic(40);
  initAudioContext();
  if (!workoutRunner.isRunning) {
    workoutRunner.start();
  } else {
    workoutRunner.pause();
  }
});

btnWorkoutPrev.addEventListener('click', () => {
  triggerHaptic(30);
  workoutRunner.prevInterval();
  renderWorkoutTimeline();
});

btnWorkoutSkip.addEventListener('click', () => {
  triggerHaptic(30);
  workoutRunner.skipInterval();
  renderWorkoutTimeline();
});

btnWorkoutStop.addEventListener('click', () => {
  triggerHaptic(50);
  workoutRunner.stop();
});

// Zwift-style Bias Buttons (-5%, -1%, 100%, +1%, +5%)
document.querySelectorAll('[data-bias]').forEach((btn) => {
  btn.addEventListener('click', () => {
    triggerHaptic(30);
    const val = btn.getAttribute('data-bias');
    if (val === 'reset') {
      workoutRunner.setBias(100);
    } else {
      workoutRunner.adjustBias(parseInt(val, 10));
    }
  });
});

// Modal Dialog & Workout Loader
btnOpenWorkoutEditor.addEventListener('click', () => {
  modalWorkout.classList.add('active');
});

btnCloseModal.addEventListener('click', () => {
  modalWorkout.classList.remove('active');
});

btnCancelModal.addEventListener('click', () => {
  modalWorkout.classList.remove('active');
});

function loadWorkoutFromText(rawText, name = 'Custom CSV Workout') {
  const intervals = WorkoutParser.parseCSV(rawText);

  if (intervals.length === 0) {
    alert('Could not parse any CSV workout intervals. Please check format: Segment,Duration,Mode,Target');
    return false;
  }

  workoutRunner.loadWorkout(intervals, name);
  const first = workoutRunner.getCurrentInterval();
  if (first) {
    intervalCountdown.textContent = formatDuration(first.durationSec);
  }
  renderWorkoutTimeline();
  syncWorkoutTargetToTrainer();
  addLog(`Loaded "${name}" with ${intervals.length} segments (${formatDuration(workoutRunner.getTotalDuration())}).`, 'info');
  return true;
}

btnApplyWorkout.addEventListener('click', () => {
  const name = inputWorkoutSaveName.value.trim() || 'Custom CSV Workout';
  if (loadWorkoutFromText(workoutTextInput.value, name)) {
    modalWorkout.classList.remove('active');
  }
});

// CSV File Upload
btnTriggerUpload.addEventListener('click', () => {
  fileCsvInput.click();
});

fileCsvInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const content = event.target.result;
    workoutTextInput.value = content;
    const workoutName = file.name.replace(/\.[^/.]+$/, '');
    inputWorkoutSaveName.value = workoutName;
    loadWorkoutFromText(content, workoutName);
    modalWorkout.classList.remove('active');
  };
  reader.readAsText(file);
});

// ==========================================
// WORKOUT LIBRARY CONTROLLER
// ==========================================

let activeLibraryCategory = 'all';

function renderLibrary(filterCategory = 'all') {
  activeLibraryCategory = filterCategory;
  libraryList.innerHTML = '';

  const allWorkouts = WorkoutLibrary.getAllWorkouts();
  const filtered = filterCategory === 'all'
    ? allWorkouts
    : allWorkouts.filter(w => {
        if (filterCategory === 'Custom') return w.isCustom;
        return w.category.toLowerCase().includes(filterCategory.toLowerCase());
      });

  if (filtered.length === 0) {
    libraryList.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 24px;">No workouts found in this category.</div>';
    return;
  }

  filtered.forEach((w) => {
    const intervals = WorkoutParser.parseCSV(w.csv);
    const totalSec = intervals.reduce((acc, c) => acc + c.durationSec, 0);

    const card = document.createElement('div');
    card.className = 'workout-card';

    // Build mini preview bars
    let miniBarsHtml = '';
    intervals.forEach(inv => {
      const widthPct = Math.max(1.5, (inv.durationSec / totalSec) * 100);
      let colorClass = 'zone-z2';
      if (inv.mode === 'grade') colorClass = 'zone-grade';
      else if (inv.mode === 'resistance') colorClass = 'zone-res';
      else {
        const eff = inv.targetType === 'pct_ftp' ? inv.targetValue : (inv.targetValue / workoutRunner.ftp);
        if (eff < 0.60) colorClass = 'zone-z1';
        else if (eff < 0.76) colorClass = 'zone-z2';
        else if (eff < 0.91) colorClass = 'zone-z3';
        else if (eff < 1.06) colorClass = 'zone-z4';
        else if (eff < 1.21) colorClass = 'zone-z5';
        else colorClass = 'zone-z6';
      }
      miniBarsHtml += `<div class="mini-bar ${colorClass}" style="width: ${widthPct}%;"></div>`;
    });

    const isCustomBadge = w.isCustom ? '<span class="workout-badge custom">Custom</span>' : '';
    const deleteBtn = w.isCustom ? `<button data-del="${w.id}" style="background: transparent; border: none; color: #ef4444; font-size: 0.9rem; cursor: pointer;" title="Delete Workout">🗑</button>` : '';

    card.innerHTML = `
      <div class="workout-card-top">
        <div>
          <div class="workout-card-title">${w.name}</div>
          <div style="display: flex; gap: 4px; margin-top: 4px;">
            <span class="workout-badge">${w.category}</span>
            ${isCustomBadge}
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <button class="btn-step" data-load-id="${w.id}" style="padding: 6px 14px; font-size: 0.8rem; background: var(--accent-cyan); color: #000; font-weight: 800;">Select</button>
          ${deleteBtn}
        </div>
      </div>
      <div class="workout-card-desc">${w.description || ''}</div>
      <div class="mini-timeline">${miniBarsHtml}</div>
      <div class="workout-card-footer">
        <span class="workout-meta">⏱ ${formatDuration(totalSec)}</span>
        <span class="workout-meta">${intervals.length} segments</span>
      </div>
    `;

    // Handle Card Click
    card.addEventListener('click', (e) => {
      if (e.target.closest('[data-del]')) return;
      selectAndLoadWorkout(w);
    });

    // Delete custom workout
    const delBtn = card.querySelector('[data-del]');
    if (delBtn) {
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Delete custom workout "${w.name}"?`)) {
          WorkoutLibrary.deleteCustomWorkout(w.id);
          renderLibrary(activeLibraryCategory);
        }
      });
    }

    libraryList.appendChild(card);
  });
}

function selectAndLoadWorkout(w) {
  loadWorkoutFromText(w.csv, w.name);
  workoutTextInput.value = w.csv;
  modalLibrary.classList.remove('active');

  // Switch to workout tab
  if (currentMode !== 'workout') {
    tabWorkout.click();
  }

  addLog(`Loaded "${w.name}" from library. Press "▶ Start Workout" on the main screen to begin!`, 'info');
}

// Category filter pills
document.querySelectorAll('#libraryFilters .category-pill').forEach((pill) => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('#libraryFilters .category-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    renderLibrary(pill.getAttribute('data-category'));
  });
});

// Library Modal Open / Close
btnOpenLibrary.addEventListener('click', () => {
  renderLibrary(activeLibraryCategory);
  modalLibrary.classList.add('active');
});

btnCloseLibrary.addEventListener('click', () => {
  modalLibrary.classList.remove('active');
});

btnCloseLibraryBtn.addEventListener('click', () => {
  modalLibrary.classList.remove('active');
});

// Save to Library from CSV Editor Modal
btnSaveToLibrary.addEventListener('click', () => {
  const csv = workoutTextInput.value.trim();
  const intervals = WorkoutParser.parseCSV(csv);
  if (intervals.length === 0) {
    alert('Please enter valid CSV workout segments before saving.');
    return;
  }

  const name = inputWorkoutSaveName.value.trim() || `Custom Workout (${intervals.length} seg)`;
  const saved = WorkoutLibrary.saveCustomWorkout(name, 'Custom', `Custom workout (${formatDuration(intervals.reduce((a, c) => a + c.durationSec, 0))})`, csv);
  
  selectAndLoadWorkout(saved);
  modalWorkout.classList.remove('active');
  inputWorkoutSaveName.value = '';
  addLog(`Saved "${name}" to your Workout Library!`, 'info');
});

// Initial Workout Load on App Launch (defaults to the first library workout)
const defaultWorkout = WorkoutLibrary.getAllWorkouts()[0];
if (defaultWorkout) {
  selectAndLoadWorkout(defaultWorkout);
} else {
  loadWorkoutFromText(workoutTextInput.value, '5x3min Threshold Intervals');
}

// ==========================================
// WORKOUT BUILDER CONTROLLER
// ==========================================

let builderSegments = [
  { id: 'b-1', name: 'Warmup', durationMin: 5, mode: 'erg_pct', targetVal: '0.50' },
  { id: 'b-2', name: 'Interval 1', durationMin: 3, mode: 'erg_pct', targetVal: '0.90' },
  { id: 'b-3', name: 'Rest 1', durationMin: 1, mode: 'erg_watts', targetVal: '120' },
  { id: 'b-4', name: 'Interval 2', durationMin: 3, mode: 'erg_pct', targetVal: '0.90' },
  { id: 'b-5', name: 'Rest 2', durationMin: 1, mode: 'erg_watts', targetVal: '120' },
  { id: 'b-6', name: 'Hill Climb', durationMin: 4, mode: 'grade', targetVal: '6.0' },
  { id: 'b-7', name: 'Cooldown', durationMin: 5, mode: 'erg_watts', targetVal: '110' }
];

function renderBuilderSegments() {
  builderSegmentsList.innerHTML = '';
  builderSegmentCount.textContent = builderSegments.length;

  builderSegments.forEach((seg, idx) => {
    const row = document.createElement('div');
    row.className = 'builder-segment-row';

    let targetPlaceholder = '% FTP (e.g. 0.90)';
    if (seg.mode === 'erg_watts') targetPlaceholder = 'Watts (e.g. 150)';
    else if (seg.mode === 'grade') targetPlaceholder = 'Grade % (e.g. 5.0)';
    else if (seg.mode === 'resistance') targetPlaceholder = 'Level (e.g. 8)';

    row.innerHTML = `
      <input type="text" class="builder-input seg-name" value="${seg.name}" placeholder="Name">
      <div style="display: flex; align-items: center; gap: 4px;">
        <input type="number" class="builder-input seg-dur" value="${seg.durationMin}" step="0.5" min="0.1" style="width: 55px; text-align: center;">
        <span style="font-size: 0.75rem; color: var(--text-muted);">min</span>
      </div>
      <select class="builder-select seg-mode">
        <option value="erg_pct" ${seg.mode === 'erg_pct' ? 'selected' : ''}>ERG (% FTP)</option>
        <option value="erg_watts" ${seg.mode === 'erg_watts' ? 'selected' : ''}>ERG (Watts)</option>
        <option value="grade" ${seg.mode === 'grade' ? 'selected' : ''}>Grade / Slope</option>
        <option value="resistance" ${seg.mode === 'resistance' ? 'selected' : ''}>Resistance</option>
      </select>
      <input type="text" class="builder-input seg-target" value="${seg.targetVal}" placeholder="${targetPlaceholder}">
      <button class="builder-btn-del" data-remove="${idx}" title="Remove">✕</button>
    `;

    const nameInput = row.querySelector('.seg-name');
    nameInput.addEventListener('input', (e) => {
      seg.name = e.target.value;
    });

    const durInput = row.querySelector('.seg-dur');
    durInput.addEventListener('input', (e) => {
      seg.durationMin = parseFloat(e.target.value) || 1;
      updateBuilderPreview();
    });

    const modeSelect = row.querySelector('.seg-mode');
    const targetInput = row.querySelector('.seg-target');
    modeSelect.addEventListener('change', (e) => {
      seg.mode = e.target.value;
      if (seg.mode === 'erg_pct') {
        targetInput.placeholder = '% FTP (e.g. 0.90)';
        if (!seg.targetVal || parseFloat(seg.targetVal) > 2) seg.targetVal = '0.90';
      } else if (seg.mode === 'erg_watts') {
        targetInput.placeholder = 'Watts (e.g. 150)';
        if (!seg.targetVal || parseFloat(seg.targetVal) <= 2) seg.targetVal = '180';
      } else if (seg.mode === 'grade') {
        targetInput.placeholder = 'Grade % (e.g. 5.0)';
        seg.targetVal = '5.0';
      } else if (seg.mode === 'resistance') {
        targetInput.placeholder = 'Level (e.g. 8)';
        seg.targetVal = '8';
      }
      targetInput.value = seg.targetVal;
      updateBuilderPreview();
    });

    targetInput.addEventListener('input', (e) => {
      seg.targetVal = e.target.value;
      updateBuilderPreview();
    });

    const delBtn = row.querySelector('.builder-btn-del');
    delBtn.addEventListener('click', () => {
      builderSegments.splice(idx, 1);
      renderBuilderSegments();
    });

    builderSegmentsList.appendChild(row);
  });

  updateBuilderPreview();
}

function updateBuilderPreview() {
  builderTimelinePreview.innerHTML = '';
  if (builderSegments.length === 0) {
    builderTotalDuration.textContent = 'Total: 00:00';
    return;
  }

  let totalSec = 0;
  builderSegments.forEach(s => {
    totalSec += Math.round((s.durationMin || 1) * 60);
  });

  builderTotalDuration.textContent = `Total: ${formatDuration(totalSec)}`;

  builderSegments.forEach((seg) => {
    const bar = document.createElement('div');
    bar.className = 'timeline-bar';
    const durSec = Math.round((seg.durationMin || 1) * 60);
    const widthPct = Math.max(2, (durSec / totalSec) * 100);
    bar.style.width = `${widthPct}%`;

    if (seg.mode === 'grade') {
      const g = parseFloat(seg.targetVal) || 0;
      bar.style.height = `${Math.min(100, Math.max(25, ((g + 5) / 20) * 100))}%`;
      bar.classList.add('zone-grade');
    } else if (seg.mode === 'resistance') {
      const r = parseFloat(seg.targetVal) || 5;
      bar.style.height = `${Math.min(100, Math.max(25, (r / 10) * 100))}%`;
      bar.classList.add('zone-res');
    } else {
      let effPct = 0.5;
      if (seg.mode === 'erg_pct') {
        effPct = parseFloat(seg.targetVal) || 0.5;
      } else {
        effPct = (parseFloat(seg.targetVal) || 150) / workoutRunner.ftp;
      }
      bar.style.height = `${Math.min(100, Math.max(25, (effPct / 1.3) * 100))}%`;

      if (effPct < 0.60) bar.classList.add('zone-z1');
      else if (effPct < 0.76) bar.classList.add('zone-z2');
      else if (effPct < 0.91) bar.classList.add('zone-z3');
      else if (effPct < 1.06) bar.classList.add('zone-z4');
      else if (effPct < 1.21) bar.classList.add('zone-z5');
      else bar.classList.add('zone-z6');
    }

    bar.title = `${seg.name} (${seg.durationMin}m)`;
    builderTimelinePreview.appendChild(bar);
  });
}

function generateBuilderCSV() {
  const lines = ['Segment,Duration,Mode,Target'];
  builderSegments.forEach((s) => {
    let modeStr = 'erg';
    let targetStr = s.targetVal || '0.50';

    if (s.mode === 'grade') {
      modeStr = 'grade';
      targetStr = s.targetVal.includes('%') ? s.targetVal : `${s.targetVal}%`;
    } else if (s.mode === 'resistance') {
      modeStr = 'resistance';
      targetStr = s.targetVal;
    } else if (s.mode === 'erg_watts') {
      modeStr = 'erg';
      targetStr = `${Math.round(parseFloat(s.targetVal) || 150)}`;
    } else {
      modeStr = 'erg';
      targetStr = s.targetVal;
    }

    lines.push(`${s.name.replace(/,/g, ' ')},${s.durationMin},${modeStr},${targetStr}`);
  });
  return lines.join('\n');
}

// Add Single Interval
btnAddSegmentBtn.addEventListener('click', () => {
  builderSegments.push({
    id: 'b-' + Date.now(),
    name: `Interval ${builderSegments.length + 1}`,
    durationMin: 3,
    mode: 'erg_pct',
    targetVal: '0.90'
  });
  renderBuilderSegments();
});

// Add Warmup Preset
btnAddWarmupPreset.addEventListener('click', () => {
  builderSegments.unshift({
    id: 'b-' + Date.now(),
    name: 'Warmup Spin',
    durationMin: 5,
    mode: 'erg_pct',
    targetVal: '0.50'
  });
  renderBuilderSegments();
});

// Add Cooldown Preset
btnAddCooldownPreset.addEventListener('click', () => {
  builderSegments.push({
    id: 'b-' + Date.now(),
    name: 'Cooldown',
    durationMin: 5,
    mode: 'erg_watts',
    targetVal: '110'
  });
  renderBuilderSegments();
});

// Repeat Block Handler
btnOpenRepeatBox.addEventListener('click', () => {
  builderRepeatBox.classList.toggle('active');
});

btnCloseRepeatBox.addEventListener('click', () => {
  builderRepeatBox.classList.remove('active');
});

btnConfirmAddRepeat.addEventListener('click', () => {
  const count = parseInt(repeatCountInput.value, 10) || 3;
  const workDur = parseFloat(repeatWorkDurInput.value) || 3;
  const workTarget = repeatWorkTargetInput.value.trim() || '0.90';
  const restDur = parseFloat(repeatRestDurInput.value) || 1;
  const restTarget = repeatRestTargetInput.value.trim() || '120';

  const isWorkWatts = parseFloat(workTarget) > 2.5;
  const isRestWatts = parseFloat(restTarget) > 2.5;

  for (let r = 1; r <= count; r++) {
    builderSegments.push({
      id: `b-work-${Date.now()}-${r}`,
      name: `Set (${r}/${count})`,
      durationMin: workDur,
      mode: isWorkWatts ? 'erg_watts' : 'erg_pct',
      targetVal: workTarget
    });
    builderSegments.push({
      id: `b-rest-${Date.now()}-${r}`,
      name: `Rest (${r}/${count})`,
      durationMin: restDur,
      mode: isRestWatts ? 'erg_watts' : 'erg_pct',
      targetVal: restTarget
    });
  }

  builderRepeatBox.classList.remove('active');
  renderBuilderSegments();
});

// Download CSV file directly
btnDownloadCsv.addEventListener('click', () => {
  if (builderSegments.length === 0) {
    alert('Please add at least one segment before downloading.');
    return;
  }
  const csvText = generateBuilderCSV();
  const name = builderWorkoutName.value.trim() || 'Custom_Workout';
  const safeFilename = name.replace(/[^a-z0-9_-]/gi, '_') + '.csv';

  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = safeFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  addLog(`Downloaded workout CSV file: "${safeFilename}"`, 'info');
});

// Save to Library & Ride
btnSaveBuilderToLibrary.addEventListener('click', () => {
  if (builderSegments.length === 0) {
    alert('Please add at least one segment before saving.');
    return;
  }
  const csvText = generateBuilderCSV();
  const name = builderWorkoutName.value.trim() || 'Custom Builder Workout';
  const category = builderCategory.value || 'Custom';

  let totalSec = 0;
  builderSegments.forEach(s => totalSec += Math.round((s.durationMin || 1) * 60));

  const saved = WorkoutLibrary.saveCustomWorkout(
    name,
    category,
    `Custom built workout (${formatDuration(totalSec)}, ${builderSegments.length} segments)`,
    csvText
  );

  selectAndLoadWorkout(saved);
  modalBuilder.classList.remove('active');
  addLog(`Saved "${name}" to Library! Tap "▶ Start Workout" on the main screen to begin.`, 'info');
});

// Modal Open / Close
btnOpenBuilder.addEventListener('click', () => {
  renderBuilderSegments();
  modalBuilder.classList.add('active');
});

btnCloseBuilder.addEventListener('click', () => {
  modalBuilder.classList.remove('active');
});

btnCancelBuilder.addEventListener('click', () => {
  modalBuilder.classList.remove('active');
});

// ============================================================
// REGISTER SERVICE WORKER (OFFLINE PWA CAPABILITY)
// ============================================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => {
        console.log('Indoor Trainer Service Worker registered:', reg.scope);
      })
      .catch((err) => {
        console.warn('Indoor Trainer Service Worker failed:', err);
      });
  });
}


