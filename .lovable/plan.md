

## Update Report Discrimination & Emotional Sections

### 1. Update Report Verbiage

Change the generated report language from accusatory phrasing to history-focused framing:

- **Current**: "Reported feeling dismissed by a healthcare provider on X occasion(s)" / "Reported experiencing discrimination on X occasion(s)"
- **New**: "Patient has a history of feeling dismissed by healthcare providers (noted on X occasion(s) during this period)" / "Patient has a history of experiencing discrimination in healthcare settings (noted on X occasion(s) during this period)"
- Section header change: "PATIENT CONTEXT (shared with consent)" becomes "PATIENT HISTORY & CONTEXT (shared with consent)"

### 2. Discrimination/Dismissal Detail Sheet

When the user checks "Include notes about discrimination or being dismissed," a bottom sheet opens with:

- A brief explanation: "Help your provider understand your past experiences. This information is shared with your consent."
- Guided prompts with checkboxes:
  - "I have been told my pain isn't real"
  - "My symptoms were attributed to anxiety or stress without investigation"
  - "I felt my concerns were not taken seriously"
  - "I experienced bias related to my identity"
- A free-text box: "Anything else you'd like your provider to know about past experiences?"
- A "Save & Include" button that stores the responses and keeps the checkbox checked
- A "Skip" button that still keeps the checkbox checked but uses only the data already in the entries

The additional context from this sheet gets appended to the report's discrimination section.

### 3. Emotional & Spiritual Impact Detail Sheet

When the user checks "Include emotional and spiritual impact," a similar sheet opens with:

- A brief explanation: "Share how your condition affects you emotionally and spiritually."
- Guided prompts with checkboxes:
  - "I experience feelings of hopelessness related to my condition"
  - "My condition affects my sense of purpose or meaning"
  - "I feel isolated because of my symptoms"
  - "My faith or spiritual practices have been affected"
- A free-text box: "Describe any other emotional or spiritual effects"
- Same "Save & Include" / "Skip" buttons

The responses get woven into the Emotional & Spiritual Impact section of the report.

### 4. Technical Details

**Files to modify:**
- `src/pages/WeeklyPage.tsx`:
  - Add state for sheet visibility (`showDiscriminationSheet`, `showEmotionalSheet`)
  - Add state for gathered responses (`discriminationDetails`, `emotionalDetails`)
  - Change checkbox `onChange` handlers to open sheets instead of just toggling
  - Update `generateDoctorReport()` to incorporate the gathered detail text
  - Update report verbiage strings
  - Add two Sheet components (using existing `@/components/ui/sheet`) at the bottom of the JSX

**No new files, no database changes, no new dependencies required.** Uses the existing Sheet UI component already in the project.

