

## Fix Buddy Chat Logging Behavior

### Problems Identified
1. **"Got it!" sounds dismissive** -- The system prompt explicitly tells the AI to say "Got it! I'll log: [summary]" when saving entries. For someone sharing distress like hopelessness, this feels tone-deaf.
2. **Not asking about symptoms** -- The prompt doesn't instruct the AI to probe for specific symptoms (from the user's tracked list) before logging.
3. **Emotional states not logged as symptoms** -- When a user says "hopeless," the AI should include "Hopelessness" in the `symptoms` array of the saved entry so it appears in reporting.

### Changes

**File: `supabase/functions/buddyChat/index.ts`** (lines 184-193 of the SAVING AN ENTRY section)

1. **Replace the "Got it!" template** with gentler, empathetic phrasing like: *"I hear you. I'll log: [summary]. Anything you want to add or change?"* -- instruct the AI to acknowledge the user's feelings first, never use overly cheerful language like "Got it!"

2. **Add symptom probing instruction** -- Before saving, the AI should ask about relevant symptoms from the user's tracked list. Add a rule: *"Before logging, check if you've asked about at least 1-2 of their tracked symptoms. If not, gently ask (e.g., 'How's the brain fog been today?') before wrapping up."*

3. **Add emotional-state-to-symptom mapping instruction** -- Tell the AI: *"When the user describes emotional states (hopelessness, anxiety, panic, numbness, etc.), always include them in the `symptoms` array of the entry JSON. These are trackable symptoms, not just mood descriptors. For example, if someone says they feel hopeless, include 'Hopelessness' in symptoms AND reflect it in mood."*

### Technical Details

All changes are in the system prompt string within `supabase/functions/buddyChat/index.ts`, specifically the daily check-in prompt (the `else` branch starting at line 127). Three targeted edits:

- **Lines 184-186**: Replace the logging confirmation template to remove "Got it!" and use empathetic language
- **After line 175** (before QUICK-REPLY SUGGESTIONS): Add a new section about symptom probing before logging
- **After line 190** (in the SAVING AN ENTRY section): Add instruction to map emotional states to the symptoms array

