

## Rebrand to CozyZebra

### Changes Overview

Rename the app from "Wellbeing Buddy" to "CozyZebra" and weave the word "cozy" into copy throughout. The chat buddy remains called "Buddy" (user-configurable name). The zebra is a nod to the rare/chronic illness community — the 🦓 emoji replaces 🐻 in branding spots.

### File Changes

**`index.html`**
- Title: "Wellbeing Buddy" → "CozyZebra"
- Meta description: update to mention CozyZebra, keep the purpose
- OG title: "Wellbeing Buddy" → "CozyZebra"

**`src/pages/AuthPage.tsx`**
- Emoji: 🐻 → 🦓
- Heading: "Wellbeing Buddy" → "CozyZebra"
- Subtitle: "Your personal health & mental wellness companion" → "Your cozy companion for health & wellness"
- Welcome blurb: add "cozy" flavor — e.g. "A cozy, safe space to track and advocate for your wellbeing."

**`src/pages/OnboardingPage.tsx`**
- Initial chat message: "What brings you to Wellbeing Buddy?" → "What brings you to CozyZebra?"

**`src/components/settings/AboutSheet.tsx`**
- App name: "Wellbeing Buddy" → "CozyZebra"
- Tagline: "A compassionate companion…" → "Your cozy companion for tracking and understanding your wellbeing journey…"
- Mission text: "Wellbeing Buddy was created to give everyone a safe, private space…" → "CozyZebra was created to give everyone a cozy, safe space…"
- Footer: "Made with ❤️ for your wellbeing" → "Made with ❤️ to keep you cozy"
- Email subject: update to "CozyZebra"

**`src/components/settings/HelpSupportSheet.tsx`**
- Email subject: "Wellbeing%20Buddy%20Feedback" → "CozyZebra%20Feedback"

**`src/components/settings/DataPrivacySheet.tsx`**
- Export filename: "wellbeing-buddy-export.json" → "cozyzebra-export.json"

**`src/components/DeleteAccountSection.tsx`**
- Export filename: "wellbeing-buddy-export.json" → "cozyzebra-export.json"

**`src/pages/ChatPage.tsx`**
- Header subtitle: "Always here for you" → "Your cozy check-in"

**`src/pages/Index.tsx`**
- Welcome heading: "Welcome to Your Blank App" → "Welcome to CozyZebra" (minor — this may be a fallback page)

### What stays the same
- The user's configurable buddy name (e.g. "Buddy 🐻") — unchanged
- All buddy avatar emoji logic in `data.ts` — unchanged
- The word "check-in" throughout — unchanged
- No structural or database changes needed

