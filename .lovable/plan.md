## Plan: Deferred Cozy Features

### 1. Haptic Feedback

The Web Vibration API (`navigator.vibrate()`) works on Android Chrome and some other browsers. iOS Safari does not support it, but we can call it safely with a feature check — it simply does nothing on unsupported browsers.

**Implementation:**

- Create a small utility `src/lib/haptics.ts` with a `softTap()` function that calls `navigator.vibrate(10)` (10ms = very light).
- Call `softTap()` on: chip selection (ChatPage, LogPage mood/pain chips, onboarding chips), button taps on check-in submit, and chip toggles throughout the app.
- No user-facing setting needed — it's a progressive enhancement.

**Files:** New `src/lib/haptics.ts`, then add imports in `src/pages/ChatPage.tsx`, `src/pages/LogPage.tsx`, `src/pages/OnboardingPage.tsx`.

---

### 2. Sound Effects

Instead of requiring external APIs or audio files, we can generate simple sounds using the Web Audio API (oscillator-based). This keeps it zero-dependency and instant.

**Implementation:**

- Create `src/lib/sounds.ts` with two functions:
  - `playLogComplete()` — a soft, warm two-note chime (like Animal Crossing furniture placement). Uses two sine oscillators with quick fade-out, ~300ms total.
  - `playNotificationTap()` — a single soft woodblock-like tap. Short burst of a filtered noise or triangle wave, ~80ms.
- Add a user preference toggle in Settings (Notifications sheet) for "Sound effects" — default ON.
- Call `playLogComplete()` after successful check-in submit in `LogPage.tsx` (the `toast.success("Check-in saved!")` line) and after chat entry save in `ChatPage.tsx`.
- Store the preference in `localStorage` (no DB needed — it's device-specific).

**Files:** New `src/lib/sounds.ts`, edit `src/pages/LogPage.tsx`, `src/pages/ChatPage.tsx`, `src/components/settings/NotificationsSheet.tsx`.

---

---

### 3. One-Action-Per-Screen Journal Flow

Redesign the `CheckInForm` from a single scrollable form into a stepped wizard that feels like turning pages in a journal. Each step shows one question with generous spacing and a "Next" button.

**Implementation:**

- Refactor `CheckInForm` in `src/pages/LogPage.tsx` into a multi-step component with 5 steps:
  1. **Pain** — PainInput component (full screen focus)
  2. **Energy** — Energy slider only
  3. **Mood** — Mood selector only
  4. **Sleep** — Sleep hours input only
  5. **Journal** — Free-text "How are you feeling?" with submit button
- Add step indicators (small dots) at the top, current step highlighted.
- Smooth `animate-slide-up` transition between steps.
- "Next" button at bottom of each step; "Back" link at top-left.
- "Skip" option on optional steps (journal text).
- On the final step, show "Submit Check-In" button.
- Each step uses emoji section markers: ☕ Pain → ⚡ Energy → 😊 Mood → 🛏️ Sleep → 📝 Journal.

**Files:** Edit `src/pages/LogPage.tsx` (refactor `CheckInForm`).

---

### Summary of all files


| Feature         | New files            | Modified files                        | &nbsp; | &nbsp; | &nbsp; |
| --------------- | -------------------- | ------------------------------------- | ------ | ------ | ------ |
| Haptic feedback | `src/lib/haptics.ts` | ChatPage, LogPage, OnboardingPage     | &nbsp; | &nbsp; | &nbsp; |
| Sound effects   | `src/lib/sounds.ts`  | LogPage, ChatPage, NotificationsSheet | &nbsp; | &nbsp; | &nbsp; |
| &nbsp;          | &nbsp;               | &nbsp;                                | &nbsp; | &nbsp; | &nbsp; |
| Journal wizard  | —                    | LogPage (CheckInForm refactor)        | &nbsp; | &nbsp; | &nbsp; |
