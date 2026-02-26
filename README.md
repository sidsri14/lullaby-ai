# Lullaby AI 🌙

An intelligent, privacy-first mobile application designed to help new parents understand and soothe their babies. Lullaby AI features an **on-device** cry translation engine, smart wake window predictions, feeding trackers, and a comprehensive soothing dashboard.

## 🚀 Key Features

*   **🎙️ On-Device Cry Translator:** Analyzes your baby's cries in real-time to determine if they are hungry, sleepy, need a diaper change, or have gas/discomfort. Completely offline and private.
*   **⏰ Smart Wake Windows:** Tracks sleep sessions to predict your baby's next optimal nap time, preventing overtiredness.
*   **🍼 Feeding Tracker:** Keep logs of feeding times (breast, bottle, or solids) with easy-to-use logging and historical tracking.
*   **🎶 Soothe Dashboard:** A built-in library of white noise, lullabies, and ambient sounds like heartbeat and shushing to calm your baby down quickly.
*   **📊 History & Insights:** Review past cries, sleep patterns, and feeding schedules to understand your baby's routine.

## 🛠️ Technology Stack

*   **Framework:** React Native (Expo)
*   **Language:** TypeScript
*   **Routing:** React Navigation (v7)
*   **Audio Processing:** Expo Audio (`expo-audio`)
*   **Local Storage:** AsyncStorage
*   **Icons:** Lucide React Native

## 📦 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/sidsri14/lullaby-ai.git
   cd lullaby-ai
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npx expo start
   ```

4. **Run on a device or emulator:**
   *   Press `a` to open in an Android emulator.
   *   Press `i` to open in an iOS simulator (Mac only).
   *   Use the Expo Go app on your physical device to scan the QR code.

## 🔒 Privacy & On-Device Processing

Lullaby AI is built with privacy as a core principle. The Cry Translation engine uses a custom set of on-device acoustic heuristics and contextual logic (combining audio features like pitch and rhythm with recent feeding/sleep data). **No audio recordings are ever sent to an external server or API**, ensuring your baby's voice remains completely private.

## 📝 License

This project is proprietary and not open for unauthorized use or distribution without explicit permission.
