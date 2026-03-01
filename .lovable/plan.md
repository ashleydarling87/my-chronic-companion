

# Settings Menu Overhaul

## Overview

Replace the current placeholder settings buttons with four functional items: **Notifications**, **Data & Privacy**, **Help & Support**, and **About** -- each opening a bottom sheet with real content.

## 1. Notifications Sheet

**New file:** `src/components/settings/NotificationsSheet.tsx`

A bottom sheet with toggle switches for notification categories:
- Daily check-in reminders
- Weekly report ready
- Encouragement notes
- Crisis resource updates

Each toggle saves to `user_preferences`. At the top, a banner detects whether browser notification permission is granted. If not, it shows a message with a button that calls `Notification.requestPermission()` or, if previously denied, instructs the user to enable notifications in their device/browser settings.

## 2. Data & Privacy Sheet

**New file:** `src/components/settings/DataPrivacySheet.tsx`

Combines the old "Data Export" and "Privacy" items into one sheet with two sections:

**Your Data:**
- "Download My Data" button (reuses the existing `exportMyData` edge function logic from `DeleteAccountSection`)
- Brief description of what's included

**Privacy Policy:**
A scrollable section with a sample privacy policy covering:
- What data is collected (check-ins, preferences, chat messages)
- How it's used (personalization, AI responses, reports)
- Data storage and security (encrypted, user-scoped)
- Third-party sharing (none -- data is never sold or shared)
- Data deletion (available via account deletion in profile)
- Contact info for privacy questions

## 3. Help & Support Sheet

**New file:** `src/components/settings/HelpSupportSheet.tsx`

A bottom sheet with two sections:

**Having trouble?**
- Common FAQ items as expandable accordions (e.g., "My check-in didn't save", "How do I change my buddy's name", "How do I export my data")

**Have an idea?**
- Brief message encouraging feedback
- "Email Us" button that opens `mailto:placeholder@example.com` with a pre-filled subject line like "Wellbeing Buddy Feedback"

## 4. About Sheet

**New file:** `src/components/settings/AboutSheet.tsx`

A bottom sheet containing:
- App icon/logo area with the buddy emoji
- App name: **Wellbeing Buddy**
- Version number (e.g., "1.0.0")
- Brief mission statement ("A compassionate companion for tracking and understanding your wellbeing journey")
- Credits/attribution section
- Links to privacy policy (scrolls or opens Data & Privacy) and terms
- "Made with care" footer

## 5. Profile Page Updates

**File:** `src/pages/ProfilePage.tsx`

- Replace the static settings list with four buttons: "Notifications", "Data & Privacy", "Help & Support", "About"
- Add state for which sheet is open
- Import and render all four sheet components

## Technical Notes

- All sheets use the existing `Sheet`/`SheetContent` component (bottom variant) consistent with `HowToUseSheet` and `CrisisSheet`
- Notification toggles use the existing `Switch` component
- The data export button reuses the `exportMyData` edge function already deployed
- No database changes needed -- notification preferences can be stored in the existing `user_preferences` JSON or as new columns if needed later

