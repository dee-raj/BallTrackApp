# 🏏 BallTrack Mobile

A premium, professional-grade cricket scoring and match analytics application built with React Native. BallTrack provides a seamless experience for scorers to record matches ball-by-ball and for enthusiasts to analyze performance with detailed reports.

---

## 🚀 Key Features

### 1. **Elite Scoring Interface**
- **Dynamic Ball-by-Ball Tracking**: Intuitive scoring with support for Wickets, Extras (Wide, No-Ball, Bye, Leg-Bye), and Boundaries.
- **Strike Management**: Automated strike rotation and end-of-over prompts.
- **Toss & Innings Flow**: Full lifecycle management from the coin toss to the final result.

### 2. **Global Player & Team Registry**
- **Decoupled Architecture**: Players are created as global entities and can be assigned to multiple teams, ensuring data consistency.
- **Team Analytics**: View full squad details, playing XI, and team-specific performance metrics.
- **CRUD Operations**: Complete management (Create, Update, Delete) for players and teams with robust error handling for active match constraints.

### 3. **Deep Analytics (Match Report)**
- **Interactive Timeline**: A beautiful, ball-by-ball review of the entire match.
- **Smart UI**: Collapsible over-by-over views and innings summaries to manage large data sets efficiently.
- **Real-time Stats**: Highlighted boundaries, wickets, and run-rates calculated on the fly.

### 4. **User Experience & Performance**
- **Premium Design System**: A modern, slate-themed UI with glassmorphism effects and rounded cards.
- **Keyboard Management**: Optimized forms that prevent input obstruction using `KeyboardAvoidingView`.
- **Virtualized Lists**: High-performance player directories optimized with `React.memo` and stabilization hooks for smooth scrolling.

---

## 🛠 Tech Stack

- **Framework**: [React Native](https://reactnative.dev/)
- **State Management**: React Context API
- **Networking**: [Axios](https://axios-http.com/)
- **UI Components**: Vanilla StyleSheet with Premium Design Tokens
- **Icons**: Emoji Glyphs / Custom SVG Pathing

---

## 📦 Getting Started

### Prerequisites
- Node.js (v16+)
- React Native CLI
- Android Studio (for Android) or Xcode (for iOS)

### Installation
1. Navigate to the mobile app directory:
   ```bash
   cd MobileApp
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run on your platform:
   ```bash
   # For Android
   npx react-native run-android

   # For iOS
   npx react-native run-ios
   ```

---

## 📁 Project Structure

```text
src/
├── api/            # API services and Axios client setup
├── components/     # Reusable UI components
├── context/        # Global state (Auth, Match Settings)
├── screens/        # Full-page screens (Dashboard, Scoring, Reports)
├── styles/         # Global themes and design tokens
└── utils/          # Formatting and calculation helpers
```

---

## 🛡 Security & Roles
- **Scorer Mode**: Full administrative access to start matches and edit registries.
- **Audience Mode**: Read-only access to view live scores and match reports without authentication risks.

---

## 📄 License
This project is for internal development and learning at BallTrack. All rights reserved.
