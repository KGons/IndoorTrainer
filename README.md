# 🚴 Indoor Trainer FTMS - Mobile Phone App
> Disclaimer: This entire thing is vibe coded with antigravity. Ive been looking for an app like this for a while and realised it was a cool project to see what vibe coding can generate. I'm quite pleased with the result, but there are still much to improve on. 

A standalone, high-contrast mobile web app and installable Progressive Web App (PWA) for controlling Bluetooth Low Energy (BLE) smart bike trainers like the **Elite Direto X-RT**, **Wahoo KICKR**, **Tacx NEO**, and all FTMS-compliant trainers directly from your phone.

## 🛠 Features Breakdown

| Feature | Description |
|---|---|
| **Workout Library** | Preloaded with Threshold (5x3m), VO2 Max (4x4m), Sweet Spot, Climbing, Sprints, and Recovery sessions. |
| **Workout Builder** | Create custom interval sessions with repeat sets, warmups, and cooldowns directly on your phone. |
| **Zwift-Style Bias** | Increase or decrease interval difficulty on the fly (-5%, -1%, 100%, +1%, +5%). |
| **Manual ERG Mode** | Set fixed target wattage (50W - 500W) with quick presets and steps. |
| **Slope Simulation** | Set simulated climbing grades (-5% downhill to +15% climb). |
| **Offline Cache** | Full PWA Service Worker caching for zero-network operation. |


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
---

## 🚀 How to Run Standalone on Your Phone
1. GitHub provides a secure HTTPS URL: `https://kgons.github.io/indoor-trainer/`
2. Open this URL on your **Android phone in Google Chrome**.
3. Tap the **📲 Install** button in the header (or tap Chrome Menu `⋮` → **Install app** / **Add to Home screen**).
4. **Done!** You now have a standalone app icon on your phone. You can turn off your PC forever.

---

## 🚴 Trainer Compatibility & Bluetooth Setup

1. **Turn on your trainer** (plug in power and pedal once to wake up Bluetooth).
2. **On your phone**: Ensure **Bluetooth** and **Location** are enabled in Android Settings (Android requires Location permissions for Bluetooth Low Energy device discovery).
3. Open the **Indoor Trainer** app on your phone.
4. Tap **Connect Smart Trainer**.
5. Select your trainer (e.g. `Elite Direto XR`, `KICKR`, `Tacx`) from the list and tap **Pair**.
6. The app will confirm connection and display real-time telemetry (Watts, Cadence, Speed, Heart Rate).

---



## Support
If you have any issues create a ticket here and lets see if the agent can solve it
