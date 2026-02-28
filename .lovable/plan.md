

# Add PHQ-4 Mental Health Check-In

## Overview
Add a PHQ-4 (Patient Health Questionnaire-4) mental health screener that users can complete weekly or on demand. The PHQ-4 is a 4-question validated tool that screens for both anxiety (GAD-2) and depression (PHQ-2), scored 0-12.

## PHQ-4 Questions
Each question is rated 0-3 (Not at all / Several days / More than half the days / Nearly every day) over the last 2 weeks:

1. Feeling nervous, anxious, or on edge
2. Not being able to stop or control worrying
3. Little interest or pleasure in doing things
4. Feeling down, depressed, or hopeless

**Scoring**: Total 0-12. Anxiety sub-score (Q1+Q2), Depression sub-score (Q3+Q4). Severity: 0-2 Normal, 3-5 Mild, 6-8 Moderate, 9-12 Severe.

---

## Database Changes

### New table: `mental_health_scores`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default gen_random_uuid() |
| user_id | uuid | NOT NULL |
| created_at | timestamptz | default now() |
| scale_type | text | default 'phq4' |
| total_score | integer | NOT NULL, 0-12 |
| anxiety_score | integer | 0-6 (Q1+Q2) |
| depression_score | integer | 0-6 (Q3+Q4) |
| answers | jsonb | Array of 4 answer values |
| severity | text | normal/mild/moderate/severe |

RLS: Users can INSERT, SELECT, UPDATE, DELETE their own records (user_id = auth.uid()).

---

## Frontend Changes

### 1. New component: `src/components/mental-health/PHQ4CheckIn.tsx`
- A card/sheet UI with the 4 PHQ-4 questions
- Each question has 4 radio-style chip buttons (0-3)
- Shows total score and severity after submission
- Saves to `mental_health_scores` table
- Reusable -- can be opened from the Log page or via a weekly prompt

### 2. New component: `src/components/mental-health/PHQ4ScoreCard.tsx`
- Displays latest PHQ-4 score with severity badge
- Shows anxiety and depression sub-scores
- "Take check-in" button when no recent score exists

### 3. Update `src/pages/LogPage.tsx`
- Add a "Mental Health Check-In" section above or below the daily check-in
- Show the PHQ4ScoreCard with latest score
- Button to open the PHQ4CheckIn form
- Show a gentle weekly prompt if last check-in was 7+ days ago

### 4. Update `src/pages/WeeklyPage.tsx`
- Add PHQ-4 score trend line to the existing chart (or a separate small chart)
- Show average anxiety and depression sub-scores in the stats section
- Include mental health scores in the doctor report generation

### 5. New hook: `src/hooks/useMentalHealthScores.ts`
- Fetch latest and historical PHQ-4 scores
- Helper to determine if a weekly prompt should show (last score > 7 days ago)
- Save new score function

---

## Weekly Prompt Logic
- On the Log page, check the most recent `mental_health_scores` entry
- If none exists or the latest is older than 7 days, show a gentle prompt card: "It's been a while since your last mental health check-in. Want to take a quick 2-minute screen?"
- Users can dismiss the prompt or complete the check-in
- The check-in is also always accessible via a button (on-demand)

---

## Technical Notes
- No edge function needed -- all reads/writes go directly through the client SDK
- PHQ-4 is public domain, no licensing concerns
- Scores integrate into the existing doctor report generation in WeeklyPage
- Follows the existing UI patterns (rounded cards, chip buttons, slide-up animations)

