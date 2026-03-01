

## Expand Crisis Support in Chat Conversations

### Problem
The current EMERGENCY section in the buddy's system prompt only triggers on extreme keywords like "suicidal thoughts" or "self-harm." When a user mentions **intrusive thoughts, hopelessness, racing thoughts**, or other signs of emotional distress that aren't explicitly suicidal, the buddy doesn't proactively offer crisis resources. Additionally, after offering resources, there's no guidance for the buddy to ask if they want to keep talking or to direct them to the Resources tab.

### What Changes

**One file:** `supabase/functions/buddyChat/index.ts` -- update the system prompt's EMERGENCY section.

### Updated Prompt Logic

Replace the current brief EMERGENCY block (lines 292-293) with expanded instructions:

1. **Broader trigger keywords** -- The buddy will now recognize a wider range of distress signals including: intrusive thoughts, hopelessness, racing thoughts, feeling numb, dread, despair, "can't do this anymore," "what's the point," dark thoughts, wanting to disappear, overwhelming anxiety/panic, and dissociation. These are distinct from the existing "suicidal thoughts / self-harm" acute emergency triggers.

2. **Tiered response:**
   - **Acute emergency** (suicidal ideation, self-harm, chest pain, breathing difficulty): Immediate empathy + crisis resources (988, Crisis Text Line) + `"emergency": true` in entry JSON. Same as current behavior.
   - **Emotional distress** (intrusive thoughts, hopelessness, racing thoughts, dark thoughts, etc.): Validate first, then gently offer crisis resources inline (988 Suicide and Crisis Lifeline: call/text 988, Crisis Text Line: text HOME to 741741). Do NOT treat this as a full emergency unless the user escalates.

3. **After offering resources, two follow-up steps:**
   - Ask if they want to keep talking through what they're feeling, or if there's something physical going on too.
   - Encourage them to check out the **Resources tab** for mindfulness exercises, encouragement, and more crisis resources.

4. **Quick-reply chips** after a crisis-resource message should include options like: `"CHIPS:Keep talking|Something physical too|Take me to Resources|I'm okay for now"`

### Technical Detail

The EMERGENCY section at lines 292-293 will be replaced with a longer, two-tier block covering both acute emergencies and lower-level emotional distress signals, with explicit follow-up instructions and a Resources tab callout.
