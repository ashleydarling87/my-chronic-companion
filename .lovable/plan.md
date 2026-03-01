

## Fix 6 Onboarding and Profile Issues

### 1. Intake chat ends too abruptly
**Problem**: When the AI sends `[INTAKE_COMPLETE]`, the chat auto-navigates after a 2-second timeout, cutting the user off mid-read.
**Fix**: Remove the `setTimeout` auto-navigation. Instead, when `intakeData` is detected, add a "Ready to explore the app" chip to the final message. Navigation only happens when the user clicks that chip. This requires adding a special chip handler in `IntakeChat` that calls `onComplete` when that specific chip is tapped.

### 2. Buddy reverts to default after onboarding
**Problem**: The `saveProgress` function saves `buddy_avatar` and `buddy_name` correctly, but when the user lands on the main chat, `UserPreferencesContext` may have stale data fetched before onboarding completed. 
**Fix**: After `saveProgress(true, intakeData)` completes in `handleIntakeComplete`, force-refresh the preferences context. Add a `refreshPrefs` method to `UserPreferencesContext` and call it before navigating to `/`.

### 3. Caretaker profile missing "Person I'm caring for" field
**Problem**: The caretaker section in ProfilePage renders conditionally on `prefs?.usage_mode === "caretaker"`. The `usage_mode` field is saved during onboarding, but the `saveProgress` function stores it correctly. The likely issue is that the `usage_mode` column value isn't being read back properly, or the initial insert during onboarding didn't include it properly for the update path.
**Fix**: Verify `usage_mode` is included in the onboarding `saveProgress` row (it is), and ensure `parseRow` in the preferences context correctly maps it. The real fix: the `saveProgress` insert path only sends a limited set of fields -- it omits `usage_mode`, `buddy_name`, `buddy_avatar`, `my_symptoms`, etc. Update the insert path in `saveProgress` to include all onboarding fields.

### 4. No "Save Preferences" button on profile page
**Problem**: The save button only appears when `isDirty` is true. If the prefs haven't loaded yet when the page renders, or if the initial sync sets draft state equal to prefs, the button won't show. This is working as designed -- it only shows when you change something. Need to verify the dirty detection is comparing correctly.
**Fix**: This is actually working correctly by design -- the button appears only when changes are made. However, the issue may be that `prefs` is null initially, causing `isDirty` to always be `false`. Add a guard so the save button section also considers whether prefs are loaded. If the user expects the button always visible, change it to always show but be disabled when clean.

### 5. Multi-chip selection in intake chat
**Problem**: The intake chat chips send immediately on click (`onClick={() => sendMessage(chip)}`), unlike the main chat which supports multi-select with a Send button.
**Fix**: Add the same multi-chip selection pattern from `ChatPage` to the `IntakeChat` component: track `selectedChips` state, toggle on click, show a "Send" button when chips are selected.

### 6. Retry onboarding bounces back to conditions page
**Problem**: After completing the intake chat, `onboarding_complete` is set to `true`. But the `OnboardingRoute` in `App.tsx` redirects to `/` if `onboardingComplete` is true. So if a user somehow re-enters onboarding (e.g., the save failed or there's a race condition), they get bounced. The session storage progress (`step: 6`) persists across attempts but `onboarding_complete` is already `true` in the database, causing the redirect.
**Fix**: Clear onboarding session storage in `handleIntakeComplete` (already done), and ensure `onboarding_complete` is only set to `true` after successful save. The real issue is likely that after the intake chat completes but before navigation, the `OnboardingRoute` guard detects `onboardingComplete === true` and redirects to `/`, which then loads `ChatPage` without fresh prefs. Fix by ensuring `handleIntakeComplete` navigates immediately after save succeeds, and by clearing session storage before navigation.

---

### Technical Changes

**`src/pages/OnboardingPage.tsx`**:
- Remove `setTimeout(() => onComplete(intakeData), 2000)` -- instead store `intakeData` in state and show a "Ready to explore the app" chip on the final message
- Add a chip click handler: if chip is the "ready" chip, call `onComplete(storedIntakeData)`; otherwise send as normal message
- Add `selectedChips` state and multi-select toggle logic (same pattern as ChatPage's `QuickChips`)
- Add a "Send" button that appears when multiple chips are selected

**`src/contexts/UserPreferencesContext.tsx`**:
- Add a `refreshPrefs` function that re-fetches from the database
- Export it in the context value

**`src/pages/OnboardingPage.tsx` (handleIntakeComplete)**:
- After `saveProgress(true, intakeData)`, call `refreshPrefs()` from context before navigating

**`src/pages/ProfilePage.tsx`**:
- Make the "Save Preferences" button always visible (but disabled when not dirty), so users always know it's there

