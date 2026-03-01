

## Restructure Onboarding Pages 2 and 4, Enhance Page 5

### Overview
Rework the "conditions" step into a 3-mode branching UI, broaden the pain scale step to cover all symptom rating, and add diagnosis-aware symptom suggestions plus a catch-all meta-tag on the symptoms page.

---

### Page 2: "Conditions & Diagnoses" (Step 1)

**Replace** the current "You're in the right place" list with a new branching layout:

**Header**: "Do you have any diagnoses or conditions?"
**Subtitle**: "Add anything that helps you track patterns. You can skip this or change it later."

**Three mode cards** (new state: `diagnosisMode`):
1. "I have diagnoses I want to track"
2. "I don't have a diagnosis yet"
3. "I'd rather not say right now"

Selecting a card reveals a variant panel below (same page, no extra step):

- **"I have diagnoses"**: Shows the existing `BELONG_OPTIONS` list as pill-buttons (renamed to `CONDITION_OPTIONS`), plus a search/add field for free-text diagnoses. Selected items appear as a chips row at the top. A small link at the bottom: "I'm not sure / still undiagnosed instead" toggles to mode 2.

- **"No diagnosis yet"**: Reassurance text ("Totally okay. We'll focus on your symptoms, patterns, and what your days feel like.") plus optional micro-chips: "Waiting for testing", "Doctors aren't sure yet", "I'm just exploring". Optional free-text field: "If you'd like, add any suspected conditions". These become tags on the profile.

- **"Rather not say"**: Brief reassurance: "That's okay. You can add or edit diagnoses later in settings." No other fields.

**Validation**: `canAdvance` for step 1 requires `diagnosisMode` to be set (any of the 3). No minimum selections needed within a mode.

**Data mapping**: `belongSelection` continues to store the selected condition labels. New state `diagnosisMode` ("diagnosed" | "undiagnosed" | "prefer_not_say") and `undiagnosedTags` (string[]) are added. All are saved to session storage and passed through `saveProgress`.

---

### Page 4: Broaden "Pain Scale" to "Rating Style" (Step 3)

**Title change**: "How do you like to rate how you're feeling?"
**Subtitle**: "We'll use this for pain and other symptoms."

**Rename the 3 options**:
- "Numbers (0-10)" (was "0-10 Scale")
- "Words (none, mild, moderate, severe)" (was "Word Scale")
- "Faces (emoji faces)" (unchanged)

Descriptions updated to be less pain-specific. This is a copy-only change to the `PAIN_PREFS` array and the step 3 JSX header.

---

### Page 5: Symptoms Enhancements (Step 4)

1. **Diagnosis-aware search**: When a user types a diagnosis keyword (e.g., "POTS", "Long COVID"), surface the related symptoms as quick-add chips. Add a new `DIAGNOSIS_SYMPTOM_MAP` lookup (e.g., "POTS" -> ["Dizziness", "Fatigue", "Palpitations"], "Long COVID" -> ["Fatigue", "Brain fog", "Shortness of breath"]).

2. **Catch-all meta-tag**: Add a permanent chip at the end of suggestions: "I experience other things that are hard to describe". This is stored as a symptom tag and signals the AI to ask follow-up questions during the intake chat.

---

### Technical Changes

**`src/pages/OnboardingPage.tsx`**:
- Add new state: `diagnosisMode` (null | "diagnosed" | "undiagnosed" | "prefer_not_say"), `undiagnosedTags` (string[]), `suspectedConditions` (string)
- Persist these in session storage alongside existing fields
- Rebuild step 1 JSX with the 3-card layout and conditional sub-panels
- Update `PAIN_PREFS` labels and step 3 header/subtitle text
- Add `DIAGNOSIS_SYMPTOM_MAP` for search-triggered symptom suggestions on step 4
- Add the "hard to describe" catch-all chip to step 4 suggestions
- Update `canAdvance()`: step 1 requires `diagnosisMode` to be set
- Update `saveProgress()` to include `diagnosisMode`, `undiagnosedTags`, and `suspectedConditions` in the row (store as JSON or individual columns -- use existing `intake_raw` or add to the preferences row)

**`src/lib/data.ts`**:
- Export new `DIAGNOSIS_SYMPTOM_MAP` mapping diagnosis keywords to symptom arrays (for the search enhancement)

**No database migration needed** -- `belongSelection` data flows into existing `intake_condition` and the raw intake data. The `diagnosisMode` and `undiagnosedTags` can be stored in the existing `intake_raw` JSON column or as part of the preferences JSON.

