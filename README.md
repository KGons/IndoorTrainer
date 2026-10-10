# 🚴 Indoor Trainer FTMS - Mobile Phone App

A standalone, high-contrast mobile web app and installable Progressive Web App (PWA) for controlling Bluetooth Low Energy (BLE) smart bike trainers like the **Elite Direto X-RT**, **Wahoo KICKR**, **Tacx NEO**, and all FTMS-compliant trainers directly from your phone.

> **Zero PC Requirement:** Once installed to your phone, this app runs 100% locally on your device. The Bluetooth connection communicates directly from your phone's Bluetooth chip to the trainer. Your computer does NOT need to be turned on or connected while you train!

---

## 📱 Mobile-First Features

- **📲 Installable Progressive Web App (PWA)**:
  - Add to your phone's Home Screen and App Launcher with 1 tap.
  - Launches full-screen (standalone mode) with no browser address bar or buttons.
  - **100% Offline Support**: Integrated Service Worker (`sw.js`) caches all assets, workouts, sounds, and icons so you can ride anywhere (garage, basement, pain cave) without internet.
- **🔊 Handlebar Audio Countdown Alerts**:
  - Web Audio synth emits audible countdown pips (3... 2... 1...) before interval switches, followed by a transition chime.
  - Hear when to change cadence/watts without having to stare at your phone screen!
  - In-app toggle button to mute/unmute at any time.
- **📳 Tactile Haptic Vibration**:
  - Vibrates your phone mount when starting, pausing, tapping steppers, and at interval transitions.
- **☀️ Screen Wake Lock API**:
  - Automatically keeps your phone screen awake while cycling so it never dims or sleeps mid-interval.
  - Auto-reacquires the wake lock if you switch away from the app and return.
- **🚴 Handlebar Cockpit View (Landscape Mode)**:
  - Mount your phone sideways on your handlebar or stem mount for a widescreen cockpit HUD with giant power digits and clear training zone bars.
- **🥊 Demo Mode Removed**:
  - Clean, dedicated connection interface designed strictly for real smart trainer workouts.

---

## 🚀 How to Run Standalone on Your Phone (Without a PC)

### Method 1: Free GitHub Pages (Recommended — Permanent & 100% Free)

You only need your PC once for 2 minutes to push the files, and you're set forever:

1. Create a free repository on [GitHub](https://github.com) (e.g. `indoor-trainer`).
2. Push or upload the files in this folder to the repository:
   ```bash
   git init
   git add .
   git commit -m "Indoor Trainer Mobile App"
   git branch -M main
   git remote add origin https://github.com/<your-username>/indoor-trainer.git
   git push -u origin main
   ```
3. In GitHub, go to your repository **Settings** → **Pages** → under **Branch**, choose `main` and `/ (root)` → Click **Save**.
4. GitHub provides a secure HTTPS URL: `https://<your-username>.github.io/indoor-trainer/`
5. Open this URL on your **Android phone in Google Chrome**.
6. Tap the **📲 Install** button in the header (or tap Chrome Menu `⋮` → **Install app** / **Add to Home screen**).
7. **Done!** You now have a standalone app icon on your phone. You can turn off your PC forever.

---

### Method 2: Netlify Drop / Cloudflare Pages (Instant Drag-and-Drop)

1. Open [drop.netlify.com](https://app.netlify.com/drop) in your PC browser.
2. Drag and drop the `indoorTrainerApp` folder into the browser window.
3. Netlify instantly gives you a free HTTPS link.
4. Open the link on your Android phone and install it to your home screen.

---

### Method 3: Local Testing via Chrome USB Port Forwarding

If you want to test before publishing:

1. Double-click `start.bat` on your PC.
2. Connect your Android phone to your PC via USB cable.
3. In Chrome on your PC, open: `chrome://inspect/#devices`
4. Click **Port forwarding...** and add: `8080` → `localhost:8080`.
5. Open `http://localhost:8080` in Chrome on your phone.
6. Chrome treats `localhost` as a Secure Context, enabling Web Bluetooth!

---

## 🚴 Trainer Compatibility & Bluetooth Setup

1. **Turn on your trainer** (plug in power and pedal once to wake up Bluetooth).
2. **On your phone**: Ensure **Bluetooth** and **Location** are enabled in Android Settings (Android requires Location permissions for Bluetooth Low Energy device discovery).
3. Open the **Indoor Trainer** app on your phone.
4. Tap **Connect Smart Trainer**.
5. Select your trainer (e.g. `Elite Direto XR`, `KICKR`, `Tacx`) from the list and tap **Pair**.
6. The app will confirm connection and display real-time telemetry (Watts, Cadence, Speed, Heart Rate).

---

## 🛠 Features Breakdown

| Feature | Description |
|---|---|
| **Workout Library** | Preloaded with Threshold (5x3m), VO2 Max (4x4m), Sweet Spot, Climbing, Sprints, and Recovery sessions. |
| **Workout Builder** | Create custom interval sessions with repeat sets, warmups, and cooldowns directly on your phone. |
| **Zwift-Style Bias** | Increase or decrease interval difficulty on the fly (-5%, -1%, 100%, +1%, +5%). |
| **Manual ERG Mode** | Set fixed target wattage (50W - 500W) with quick presets and steps. |
| **Slope Simulation** | Set simulated climbing grades (-5% downhill to +15% climb). |
| **Offline Cache** | Full PWA Service Worker caching for zero-network operation. |
